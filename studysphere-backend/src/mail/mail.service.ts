import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatDurationText } from '../common/format-duration.util';

export interface StudySummaryData {
  periodLabel: string;
  totalDurationSeconds: number;
  sessionCount: number;
  daysStudied: number;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
}

export interface StudySummaryAttachment {
  name: string;
  content: Buffer;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly brevoApiKey: string;
  private readonly fromAddress: string;
  private readonly fromName = 'StudySphere';

  constructor(private readonly configService: ConfigService) {
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY') ?? '';
    this.fromAddress = this.configService.get<string>('MAIL_FROM') ?? 'noreply@studysphere.local';
  }

  private async sendViaBrevo(to: string, subject: string, text: string, html: string, attachments?: { name: string; content: string }[]): Promise<void> {
    const payload: Record<string, unknown> = {
      sender: { name: this.fromName, email: this.fromAddress },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    };
    if (attachments && attachments.length > 0) {
      payload.attachment = attachments;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': this.brevoApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Brevo API ${response.status}: ${body}`);
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    try {
      await this.sendViaBrevo(
        to,
        'StudySphere e-posta doğrulama kodunuz',
        `Doğrulama kodunuz: ${code}\n\nBu kod 10 dakika içinde geçerliliğini kaybedecek. Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.`,
        `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p>StudySphere hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
            <p style="color: #666;">Bu kod 10 dakika içinde geçerliliğini kaybedecek. Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
          </div>
        `,
      );
    } catch (error) {
      this.logger.error(`Doğrulama e-postası gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    try {
      await this.sendViaBrevo(
        to,
        'StudySphere şifre sıfırlama kodunuz',
        `Şifre sıfırlama kodunuz: ${code}\n\nBu kod 10 dakika içinde geçerliliğini kaybedecek. Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilir, şifreniz değişmeden kalır.`,
        `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p>StudySphere şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
            <p style="color: #666;">Bu kod 10 dakika içinde geçerliliğini kaybedecek. Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz, şifreniz değişmeden kalır.</p>
          </div>
        `,
      );
    } catch (error) {
      this.logger.error(`Şifre sıfırlama e-postası gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }

  async sendPasswordChangedNotice(to: string): Promise<void> {
    try {
      await this.sendViaBrevo(
        to,
        'StudySphere şifreniz değiştirildi',
        `Hesabınızın şifresi az önce değiştirildi ve tüm cihazlarınızda oturumunuz sonlandırıldı.\n\nBu işlemi siz yapmadıysanız hemen "Şifremi Unuttum" akışıyla şifrenizi tekrar sıfırlayın.`,
        `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p>Hesabınızın şifresi az önce değiştirildi ve tüm cihazlarınızdaki oturumlar sonlandırıldı.</p>
            <p style="color: #b00020; font-weight: 600;">Bu işlemi siz yapmadıysanız hemen "Şifremi Unuttum" akışıyla şifrenizi tekrar sıfırlayın.</p>
          </div>
        `,
      );
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
      await this.sendViaBrevo(
        to,
        'StudySphere hesabınıza yeni bir cihazdan giriş yapıldı',
        `Hesabınıza ${loginTime} tarihinde "${deviceName}" adlı yeni bir cihazdan giriş yapıldı.\n\nBu işlemi siz yapmadıysanız hemen şifrenizi değiştirin ve "Aktif Oturumlar" bölümünden bilmediğiniz oturumları sonlandırın.`,
        `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p>Hesabınıza <strong>${loginTime}</strong> tarihinde <strong>${deviceName}</strong> adlı yeni bir cihazdan giriş yapıldı.</p>
            <p style="color: #b00020; font-weight: 600;">Bu işlemi siz yapmadıysanız hemen şifrenizi değiştirin ve "Aktif Oturumlar" bölümünden bilmediğiniz oturumları sonlandırın.</p>
          </div>
        `,
      );
    } catch (error) {
      this.logger.error(`Yeni cihaz bildirimi gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }

  async sendStudySummary(to: string, data: StudySummaryData, attachment: StudySummaryAttachment): Promise<void> {
    const durationText = formatDurationText(data.totalDurationSeconds);

    try {
      await this.sendViaBrevo(
        to,
        `StudySphere çalışma özetiniz: ${data.periodLabel}`,
        `${data.periodLabel} dönemindeki çalışma özetin ekte PDF olarak hazır.\n\n` +
          `Toplam çalışma süresi: ${durationText}\n` +
          `Tamamlanan seans sayısı: ${data.sessionCount}\n` +
          `Çalışılan gün sayısı: ${data.daysStudied}\n` +
          `Çözülen soru sayısı: ${data.questionCount} (${data.correctCount} doğru, ${data.wrongCount} yanlış)\n\n` +
          `Ders/konu bazlı detaylı dökümü ekteki PDF'te bulabilirsin.\n\n` +
          `StudySphere'i kullanmaya devam edin!`,
        `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p><strong>${data.periodLabel}</strong> dönemindeki çalışma özetin ekte PDF olarak hazır.</p>
            <ul style="line-height: 1.8;">
              <li>Toplam çalışma süresi: <strong>${durationText}</strong></li>
              <li>Tamamlanan seans sayısı: <strong>${data.sessionCount}</strong></li>
              <li>Çalışılan gün sayısı: <strong>${data.daysStudied}</strong></li>
              <li>Çözülen soru sayısı: <strong>${data.questionCount}</strong> (${data.correctCount} doğru, ${data.wrongCount} yanlış)</li>
            </ul>
            <p style="color: #666;">Ders/konu bazlı detaylı dökümü ekteki PDF'te bulabilirsin.</p>
            <p style="color: #666; margin-top: 20px;">Bu e-postaları "Profil &gt; E-posta Bildirimleri" bölümünden kapatabilirsiniz.</p>
          </div>
        `,
        [{ name: attachment.name, content: attachment.content.toString('base64') }],
      );
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
      await this.sendViaBrevo(
        to,
        subject,
        `${headline}\n\n${message}\n\nBu bildirimleri "Profil > Hareketsizlik Hatırlatması" bölümünden kapatabilirsiniz.`,
        `
          <div style="font-family: sans-serif; max-width: 480px;">
            <p style="font-size: 18px; font-weight: bold;">${headline}</p>
            <p>${message}</p>
            <p style="color: #666;">Bu bildirimleri "Profil &gt; Hareketsizlik Hatırlatması" bölümünden kapatabilirsiniz.</p>
          </div>
        `,
      );
    } catch (error) {
      this.logger.error(`Hareketsizlik hatırlatma e-postası gönderilemedi (${to}): ${(error as Error).message}`);
      throw error;
    }
  }
}
