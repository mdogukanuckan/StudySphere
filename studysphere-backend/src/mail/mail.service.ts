import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { UniversePerformanceEntry } from '../study-sessions/study-sessions.service';

export interface StudySummaryData {
  periodLabel: string;
  totalDurationSeconds: number;
  sessionCount: number;
  daysStudied: number;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  subjectBreakdown: UniversePerformanceEntry[];
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

  private formatDurationText(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} saat ${minutes} dakika` : `${minutes} dakika`;
  }

  private buildSubjectBreakdownText(breakdown: UniversePerformanceEntry[]): string {
    if (breakdown.length === 0) {
      return '';
    }

    const lines: string[] = ['Ders / konu bazlı dökümünüz:'];
    for (const universe of breakdown) {
      lines.push(`\n${universe.universeName}:`);
      for (const subject of universe.subjects) {
        lines.push(
          `  ${subject.subjectName} — ${this.formatDurationText(subject.totalDuration)}, ${subject.totalQuestions} soru (${subject.totalCorrect} doğru, ${subject.totalWrong} yanlış)`,
        );
        for (const topic of subject.topics) {
          lines.push(
            `    ${topic.topicName} — ${this.formatDurationText(topic.totalDuration)}, ${topic.totalQuestions} soru (${topic.totalCorrect} doğru, ${topic.totalWrong} yanlış)`,
          );
        }
      }
    }
    return lines.join('\n');
  }

  private buildSubjectBreakdownHtml(breakdown: UniversePerformanceEntry[]): string {
    if (breakdown.length === 0) {
      return '';
    }

    const universesHtml = breakdown.map((universe) => {
      const subjectsHtml = universe.subjects.map((subject) => {
        const topicsHtml = subject.topics.map((topic) => `
          <li style="color: #555; font-size: 13px;">${topic.topicName} — ${this.formatDurationText(topic.totalDuration)}, ${topic.totalQuestions} soru (${topic.totalCorrect} doğru, ${topic.totalWrong} yanlış)</li>
        `).join('');

        return `
          <li style="margin-top: 8px;">
            <strong>${subject.subjectName}</strong> — ${this.formatDurationText(subject.totalDuration)}, ${subject.totalQuestions} soru (${subject.totalCorrect} doğru, ${subject.totalWrong} yanlış)
            <ul style="margin: 4px 0 0 0; padding-left: 18px; line-height: 1.6;">${topicsHtml}</ul>
          </li>
        `;
      }).join('');

      return `
        <div style="margin-top: 16px;">
          <p style="font-weight: 600; margin-bottom: 4px;">${universe.universeName}</p>
          <ul style="margin: 0; padding-left: 18px; line-height: 1.6;">${subjectsHtml}</ul>
        </div>
      `;
    }).join('');

    return `
      <p style="margin-top: 20px;"><strong>Ders / konu bazlı dökümünüz:</strong></p>
      ${universesHtml}
    `;
  }

  async sendStudySummary(to: string, data: StudySummaryData): Promise<void> {
    const durationText = this.formatDurationText(data.totalDurationSeconds);
    const breakdownText = this.buildSubjectBreakdownText(data.subjectBreakdown);
    const breakdownHtml = this.buildSubjectBreakdownHtml(data.subjectBreakdown);

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
          (breakdownText ? `${breakdownText}\n\n` : '') +
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
            ${breakdownHtml}
            <p style="color: #666; margin-top: 20px;">Bu e-postaları "Profil &gt; E-posta Bildirimleri" bölümünden kapatabilirsiniz.</p>
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
