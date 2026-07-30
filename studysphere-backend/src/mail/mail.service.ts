import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface StudySummaryData {
  periodLabel: string;
  totalDurationSeconds: number;
  sessionCount: number;
  daysStudied: number;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
}

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

  async sendNewDeviceLoginAlert(to: string, deviceName: string): Promise<void> {
    const loginTime = new Date().toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    try {
      await this.transporter.sendMail({
        from: `"StudySphere" <${this.fromAddress}>`,
        to,
        subject: 'StudySphere hesabınıza yeni bir cihazdan giriş yapıldı',
        text: `Hesabınıza ${loginTime} tarihinde "${deviceName}" adlı yeni bir cihazdan giriş yapıldı.\n\nBu işlemi siz yapmadıysanız hemen şifrenizi değiştirin ve "Aktif Oturumlar" bölümünden bilmediğiniz oturumları sonlandırın.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p>Hesabınıza <strong>${loginTime}</strong> tarihinde <strong>${deviceName}</strong> adlı yeni bir cihazdan giriş yapıldı.</p>
            <p style="color: #b00020; font-weight: 600;">Bu işlemi siz yapmadıysanız hemen şifrenizi değiştirin ve "Aktif Oturumlar" bölümünden bilmediğiniz oturumları sonlandırın.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Yeni cihaz bildirimi gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }

  async sendStudySummary(to: string, data: StudySummaryData): Promise<void> {
    const hours = Math.floor(data.totalDurationSeconds / 3600);
    const minutes = Math.floor((data.totalDurationSeconds % 3600) / 60);
    const durationText = hours > 0 ? `${hours} saat ${minutes} dakika` : `${minutes} dakika`;

    try {
      await this.transporter.sendMail({
        from: `"StudySphere" <${this.fromAddress}>`,
        to,
        subject: `StudySphere çalışma özetiniz: ${data.periodLabel}`,
        text: `${data.periodLabel} dönemindeki çalışma özetiniz:\n\n` +
          `Toplam çalışma süresi: ${durationText}\n` +
          `Tamamlanan seans sayısı: ${data.sessionCount}\n` +
          `Çalışılan gün sayısı: ${data.daysStudied}\n` +
          `Çözülen soru sayısı: ${data.questionCount} (${data.correctCount} doğru, ${data.wrongCount} yanlış)\n\n` +
          `StudySphere'i kullanmaya devam edin!`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p><strong>${data.periodLabel}</strong> dönemindeki çalışma özetiniz:</p>
            <ul style="line-height: 1.8;">
              <li>Toplam çalışma süresi: <strong>${durationText}</strong></li>
              <li>Tamamlanan seans sayısı: <strong>${data.sessionCount}</strong></li>
              <li>Çalışılan gün sayısı: <strong>${data.daysStudied}</strong></li>
              <li>Çözülen soru sayısı: <strong>${data.questionCount}</strong> (${data.correctCount} doğru, ${data.wrongCount} yanlış)</li>
            </ul>
            <p style="color: #666;">Bu e-postaları "Profil &gt; E-posta Bildirimleri" bölümünden kapatabilirsiniz.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Çalışma özeti e-postası gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }

  private buildInactivityContent(daysInactive: number): { subject: string; headline: string; message: string } {
    if (daysInactive >= 14) {
      return {
        subject: "StudySphere'de seni özledik",
        headline: '14 gündür seni görmedik!',
        message: 'Uzun süredir çalışma kaydın yok. Kaldığın yerden devam etmek için hemen kısa bir seans başlat.',
      };
    }
    if (daysInactive >= 7) {
      return {
        subject: "Bir haftadır StudySphere'e uğramadın",
        headline: '7 gündür hareketsizsin.',
        message: 'Kısa bir çalışma seansıyla devam etmeye ne dersin? Küçük adımlar bile fark yaratır.',
      };
    }
    return {
      subject: "StudySphere'den hatırlatma",
      headline: '3 gündür çalışma kaydın yok.',
      message: 'Çalışmalarına devam etmeyi unutma, birkaç dakikan bile yeterli.',
    };
  }

  async sendInactivityReminder(to: string, daysInactive: number): Promise<void> {
    const { subject, headline, message } = this.buildInactivityContent(daysInactive);
    try {
      await this.transporter.sendMail({
        from: `"StudySphere" <${this.fromAddress}>`,
        to,
        subject,
        text: `${headline}\n\n${message}\n\nBu bildirimleri "Profil > Hareketsizlik Hatırlatması" bölümünden kapatabilirsiniz.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p style="font-size: 18px; font-weight: bold;">${headline}</p>
            <p>${message}</p>
            <p style="color: #666;">Bu bildirimleri "Profil &gt; Hareketsizlik Hatırlatması" bölümünden kapatabilirsiniz.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Hareketsizlik hatırlatma e-postası gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }
}
