import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { RefreshTokenDto } from 'src/refresh-tokens/dto/refresh-token.dto';
import { MailService } from '../mail/mail.service';
import { DevicesService } from '../devices/devices.service';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;
const PASSWORD_RESET_CODE_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_PASSWORD_RESET_ATTEMPTS = 5;

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly refreshTokensService: RefreshTokensService,
        private readonly mailService: MailService,
        private readonly devicesService: DevicesService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, username, password, firstName, lastName } = registerDto;
        const existingUser = await this.usersService.findByEmailOrUsername(email, username);
        if (existingUser) {
            throw new ConflictException('Bu kullanıcı adı veya e-posta kullanımda');
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        try {
            const savedUser = await this.usersService.create({
                email,
                username,
                passwordHash: hashedPassword,
                firstName,
                lastName
            });
            const { passwordHash, ...safeUser } = savedUser;

             this.sendVerificationCode(savedUser.id).catch((error) => {
                this.logger.warn(`Kayıt sonrası doğrulama kodu gönderilemedi: ${(error as Error)?.message}`);
            });

            return safeUser;
        } catch (error) {
            throw new InternalServerErrorException('Kullanıcı kaydedilirken bir hata oluştu');
        }
    }

    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async sendVerificationCode(userId: string) {
        const state = await this.usersService.getVerificationState(userId);
        if (state.isEmailVerified) {
            return { message: 'E-posta adresiniz zaten doğrulanmış.' };
        }

        if (state.emailVerificationLastSentAt) {
            const elapsed = Date.now() - new Date(state.emailVerificationLastSentAt).getTime();
            if (elapsed < VERIFICATION_RESEND_COOLDOWN_MS) {
                const waitSeconds = Math.ceil((VERIFICATION_RESEND_COOLDOWN_MS - elapsed) / 1000);
                throw new BadRequestException(`Lütfen yeni kod istemeden önce ${waitSeconds} saniye bekleyin.`);
            }
        }

        const code = this.generateVerificationCode();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

        await this.usersService.setEmailVerificationCode(userId, codeHash, expiresAt);

        try {
            await this.mailService.sendVerificationCode(state.email, code);
        } catch (error) {
            throw new InternalServerErrorException('Doğrulama kodu gönderilemedi, lütfen daha sonra tekrar deneyin.');
        }

        return { message: 'Doğrulama kodu e-posta adresinize gönderildi.' };
    }

    async verifyEmail(userId: string, code: string) {
        const state = await this.usersService.getVerificationState(userId);
        if (state.isEmailVerified) {
            return { message: 'E-posta adresiniz zaten doğrulanmış.' };
        }

        if (!state.emailVerificationCode || !state.emailVerificationCodeExpiresAt) {
            throw new BadRequestException('Önce bir doğrulama kodu talep etmelisiniz.');
        }

        if (new Date(state.emailVerificationCodeExpiresAt).getTime() < Date.now()) {
            throw new BadRequestException('Doğrulama kodunun süresi dolmuş, yeni bir kod isteyin.');
        }

        if (state.emailVerificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
            throw new BadRequestException('Çok fazla hatalı deneme yaptınız, yeni bir kod isteyin.');
        }

        const isMatch = await bcrypt.compare(code, state.emailVerificationCode);
        if (!isMatch) {
            await this.usersService.incrementVerificationAttempts(userId);
            throw new BadRequestException('Kod hatalı.');
        }

        await this.usersService.markEmailVerified(userId);
        return { message: 'E-posta adresiniz başarıyla doğrulandı.' };
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Geçersiz e-posta veya şifre.');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Geçersiz e-posta veya şifre.');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await this.jwtService.signAsync(payload);
        const { token: refreshToken } = await this.refreshTokensService.create(user.id, REFRESH_TOKEN_TTL_MS);

        this.devicesService
            .checkAndRecordDevice(user.id, loginDto.deviceId, loginDto.deviceName)
            .then((result) => {
                if (result.isNewDevice) {
                    this.mailService
                        .sendNewDeviceLoginAlert(user.email, loginDto.deviceName ?? 'Bilinmeyen cihaz')
                        .catch((error) => {
                            this.logger.warn(`Yeni cihaz bildirimi gönderilemedi: ${(error as Error)?.message}`);
                        });
                }
            })
            .catch((error) => {
                this.logger.warn(`Cihaz kaydı sırasında hata oluştu: ${(error as Error)?.message}`);
            });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    async refresh(refreshTokenDto: RefreshTokenDto) {
        const existing = await this.refreshTokensService.findValidByToken(refreshTokenDto.refreshToken);
        if (!existing) {
            throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token.');
        }

        const user = await this.usersService.findByIdWithPassword(existing.userId);
        if (!user) {
            throw new UnauthorizedException('Kullanıcı bulunamadı.');
        }

        await this.refreshTokensService.revoke(existing.id);
        const { token: newRefreshToken } = await this.refreshTokensService.create(user.id, REFRESH_TOKEN_TTL_MS);

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            access_token: accessToken,
            refresh_token: newRefreshToken,
        };
    }

    async logout(refreshTokenDto: RefreshTokenDto) {
        await this.refreshTokensService.revokeByToken(refreshTokenDto.refreshToken);
        return { message: 'Çıkış yapıldı.' };
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const { oldPassword, newPassword } = changePasswordDto;

        const user = await this.usersService.findByIdWithPassword(userId);
        if (!user) {
            throw new UnauthorizedException('Kullanıcı bulunamadı.');
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isOldPasswordValid) {
            throw new UnauthorizedException('Eski şifre yanlış.');
        }

        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        await this.usersService.updatePassword(userId, newPasswordHash);

        await this.refreshTokensService.revokeAllForUser(userId);

        this.mailService.sendPasswordChangedNotice(user.email).catch((error) => {
            this.logger.warn(`Şifre değişikliği bildirimi gönderilemedi: ${(error as Error)?.message}`);
        });

        return { message: 'Şifre başarıyla güncellendi.' };
    }

    private readonly FORGOT_PASSWORD_GENERIC_RESPONSE = {
        message: 'Bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama kodu gönderildi.',
    };

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return this.FORGOT_PASSWORD_GENERIC_RESPONSE;
        }

        if (user.passwordResetLastSentAt) {
            const elapsed = Date.now() - new Date(user.passwordResetLastSentAt).getTime();
            if (elapsed < PASSWORD_RESET_RESEND_COOLDOWN_MS) {
                return this.FORGOT_PASSWORD_GENERIC_RESPONSE;
            }
        }

        const code = this.generateVerificationCode();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_CODE_TTL_MS);

        await this.usersService.setPasswordResetCode(user.id, codeHash, expiresAt);

        try {
            await this.mailService.sendPasswordResetCode(user.email, code);
        } catch (error) {
            this.logger.warn(`Şifre sıfırlama kodu gönderilemedi: ${(error as Error)?.message}`);
        }

        return this.FORGOT_PASSWORD_GENERIC_RESPONSE;
    }

    async resetPassword(email: string, code: string, newPassword: string) {
        const genericError = 'Kod hatalı veya süresi dolmuş.';
        const user = await this.usersService.findByEmail(email);
        if (!user || !user.passwordResetCode || !user.passwordResetCodeExpiresAt) {
            throw new BadRequestException(genericError);
        }

        if (new Date(user.passwordResetCodeExpiresAt).getTime() < Date.now()) {
            throw new BadRequestException(genericError);
        }

        if (user.passwordResetAttempts >= MAX_PASSWORD_RESET_ATTEMPTS) {
            throw new BadRequestException('Çok fazla hatalı deneme yaptınız, yeni bir kod isteyin.');
        }

        const isMatch = await bcrypt.compare(code, user.passwordResetCode);
        if (!isMatch) {
            await this.usersService.incrementPasswordResetAttempts(user.id);
            throw new BadRequestException(genericError);
        }

        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        await this.usersService.resetPassword(user.id, newPasswordHash);

        await this.refreshTokensService.revokeAllForUser(user.id);

        this.mailService.sendPasswordChangedNotice(user.email).catch((error) => {
            this.logger.warn(`Şifre değişikliği bildirimi gönderilemedi: ${(error as Error)?.message}`);
        });

        return { message: 'Şifreniz başarıyla güncellendi. Lütfen yeni şifrenizle giriş yapın.' };
    }

}
