import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { RefreshTokenDto } from 'src/refresh-tokens/dto/refresh-token.dto';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

@Injectable()
export class AuthService {

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly refreshTokensService: RefreshTokensService,
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
            return safeUser;
        } catch (error) {
            throw new InternalServerErrorException('Kullanıcı kaydedilirken bir hata oluştu');
        }
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

        // Rotation: eski token'ı iptal edip yenisini oluşturuyoruz.
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

        return { message: 'Şifre başarıyla güncellendi.' };
    }

}