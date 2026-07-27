import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Genel amacli SMTP gonderici. Saglayici secimi (Gmail App Password, Outlook,
// Mailtrap, Resend SMTP vb.) tamamen .env'deki SMTP_* degiskenlerine bagli;
// bu servis hangi saglayici oldugunu bilmez, sadece standart SMTP kullanir.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? '587');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.fromAddress = this.configService.get<string>('MAIL_FROM') ?? user ?? 'noreply@studysphere.local';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"StudySphere" <${this.fromAddress}>`,
        to,
        subject: 'StudySphere e-posta doğrulama kodunuz',
        text: `Doğrulama kodunuz: ${code}\n\nBu kod 10 dakika içinde geçerliliğini kaybedecek. Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p>StudySphere hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
            <p style="color: #666;">Bu kod 10 dakika içinde geçerliliğini kaybedecek. Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Doğrulama e-postası gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"StudySphere" <${this.fromAddress}>`,
        to,
        subject: 'StudySphere şifre sıfırlama kodunuz',
        text: `Şifre sıfırlama kodunuz: ${code}\n\nBu kod 10 dakika içinde geçerliliğini kaybedecek. Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilir, şifreniz değişmeden kalır.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p>StudySphere şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
            <p style="color: #666;">Bu kod 10 dakika içinde geçerliliğini kaybedecek. Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz, şifreniz değişmeden kalır.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Şifre sıfırlama e-postası gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }

  // Hesap ele gecirilip sifre degistirilirse gercek sahibinin haberi olsun diye —
  // hem "sifre degistir" (change-password) hem "sifremi unuttum" (reset-password)
  // akislarindan sonra gonderilir. Best-effort: basarisiz olsa bile cagiran
  // taraf islemi geri almaz (bkz. AuthService.changePassword / resetPassword).
  async sendPasswordChangedNotice(to: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"StudySphere" <${this.fromAddress}>`,
        to,
        subject: 'StudySphere şifreniz değiştirildi',
        text: `Hesabınızın şifresi az önce değiştirildi ve tüm cihazlarınızda oturumunuz sonlandırıldı.\n\nBu işlemi siz yapmadıysanız hemen "Şifremi Unuttum" akışıyla şifrenizi tekrar sıfırlayın.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p>Hesabınızın şifresi az önce değiştirildi ve tüm cihazlarınızdaki oturumlar sonlandırıldı.</p>
            <p style="color: #b00020; font-weight: 600;">Bu işlemi siz yapmadıysanız hemen "Şifremi Unuttum" akışıyla şifrenizi tekrar sıfırlayın.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Şifre değişikliği bildirimi gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }
}
