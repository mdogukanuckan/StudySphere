import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from 'src/refresh-tokens/dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService : AuthService){}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto : RegisterDto){
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() logindDto : LoginDto){
        return this.authService.login(logindDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() refreshTokenDto: RefreshTokenDto){
        return this.authService.refresh(refreshTokenDto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body() refreshTokenDto: RefreshTokenDto){
        return this.authService.logout(refreshTokenDto);
    }

    @Post('change-password')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto){
        const userId = req.user.userId;
        return this.authService.changePassword(userId, changePasswordDto);
    }

    // Dogrulanmamis hesaplar da giris yapabildigi icin bu uc noktalar
    // authenticated ama EmailVerifiedGuard KULLANMIYOR — aksi halde dogrulanmamis
    // kullanici kendi kodunu isteyip dogrulayamazdi.
    @Post('send-verification-code')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async sendVerificationCode(@Req() req: any){
        return this.authService.sendVerificationCode(req.user.userId);
    }

    @Post('verify-email')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Req() req: any, @Body() verifyEmailDto: VerifyEmailDto){
        return this.authService.verifyEmail(req.user.userId, verifyEmailDto.code);
    }

    // Kullanici henuz giris yapamadigi icin (sifresini unuttu) bu iki uc nokta
    // authsuz/public — guard YOK.
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto){
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto){
        return this.authService.resetPassword(
            resetPasswordDto.email,
            resetPasswordDto.code,
            resetPasswordDto.newPassword,
        );
    }
}