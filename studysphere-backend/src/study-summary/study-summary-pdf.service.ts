import { Injectable } from '@nestjs/common';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import type { UniversePerformanceEntry } from '../study-sessions/study-sessions.service';
import { formatDurationShort } from '../common/format-duration.util';

export interface StudySummaryPdfData {
    userName: string;
    reportTitle: string;
    periodLabel: string;
    totalDurationSeconds: number;
    sessionCount: number;
    daysStudied: number;
    questionCount: number;
    correctCount: number;
    wrongCount: number;
    subjectBreakdown: UniversePerformanceEntry[];
}

const DARK = '#1E293B';
const DARK_DEEPER = '#0F172A';
const ACCENT = '#22C55E';
const ACCENT_DARK = '#15803D';
const SUCCESS = '#22C55E';
const ERROR = '#EF4444';
const TEXT = '#1E293B';
const TEXT_SECONDARY = '#475569';
const SURFACE = '#F1F5F9';
const BORDER = '#CBD5E1';
const WHITE = '#FFFFFF';

const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const MARGIN = 40;
const TOP_CHART_SUBJECT_LIMIT = 8;

@Injectable()
export class StudySummaryPdfService {
    async generate(data: StudySummaryPdfData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 0, bottom: 0, left: MARGIN, right: MARGIN },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.registerFont('Regular', path.join(FONT_DIR, 'DejaVuSans.ttf'));
            doc.registerFont('Bold', path.join(FONT_DIR, 'DejaVuSans-Bold.ttf'));

            this.render(doc, data);

            doc.end();
        });
    }

    private render(doc: PDFKit.PDFDocument, data: StudySummaryPdfData): void {
        const pageW = doc.page.width;
        const contentW = pageW - MARGIN * 2;

        this.drawBanner(doc, data, pageW, contentW);
        doc.y = 95 + 24;

        doc.font('Regular').fontSize(11).fillColor(TEXT)
            .text(`Merhaba ${data.userName}, ${data.periodLabel} dönemine ait çalışma özetin hazır.`, MARGIN, doc.y, { width: contentW });
        doc.y += 20;

        const cardW = (contentW - 3 * 10) / 4;
        const cardY = doc.y;
        this.drawStatCard(doc, MARGIN, cardY, cardW, 56, formatDurationShort(data.totalDurationSeconds), 'Toplam Süre');
        this.drawStatCard(doc, MARGIN + (cardW + 10) * 1, cardY, cardW, 56, String(data.sessionCount), 'Seans');
        this.drawStatCard(doc, MARGIN + (cardW + 10) * 2, cardY, cardW, 56, String(data.daysStudied), 'Çalışılan Gün');
        this.drawStatCard(doc, MARGIN + (cardW + 10) * 3, cardY, cardW, 56, String(data.questionCount), 'Soru');
        doc.y = cardY + 56 + 28;

        const subjectRows = this.flattenSubjects(data.subjectBreakdown);
        if (subjectRows.length > 0) {
            const chartY = doc.y;
            const chartLeftW = 300;
            this.drawBarChart(doc, MARGIN, chartY, chartLeftW, subjectRows);
            this.drawAccuracyDonut(doc, MARGIN + chartLeftW + 20, chartY, data.correctCount, data.wrongCount);
            doc.y = chartY + Math.max(190, 26 + subjectRows.length * 44);
        } else {
            const chartY = doc.y;
            this.drawAccuracyDonut(doc, MARGIN, chartY, data.correctCount, data.wrongCount);
            doc.y = chartY + 150;
        }

        doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentW, doc.y).lineWidth(0.75).strokeColor(BORDER).stroke();
        doc.y += 16;

        if (data.subjectBreakdown.length > 0) {
            doc.font('Bold').fontSize(13).fillColor(TEXT).text('Ders / konu bazlı dökümün', MARGIN, doc.y);
            doc.y += 18;

            for (const universe of data.subjectBreakdown) {
                this.drawUniverseSection(doc, universe, contentW);
            }
        }

        this.checkAddPage(doc, 24);
        doc.font('Regular').fontSize(9.5).fillColor(TEXT_SECONDARY)
            .text("StudySphere'i kullanmaya devam et, küçük adımlar bile fark yaratır!", MARGIN, doc.y, { width: contentW });
        doc.y += 16;
        doc.font('Regular').fontSize(8).fillColor(TEXT_SECONDARY)
            .text('Bu e-postaları Profil > E-posta Bildirimleri bölümünden kapatabilirsiniz.', MARGIN, doc.y, { width: contentW });
    }

    private drawBanner(doc: PDFKit.PDFDocument, data: StudySummaryPdfData, pageW: number, contentW: number): void {
        const bannerH = 95;
        doc.rect(0, 0, pageW, bannerH).fill(DARK);
        doc.rect(0, bannerH - 3, pageW, 3).fill(DARK_DEEPER);

        doc.fillColor(WHITE).font('Bold').fontSize(24).text('StudySphere', MARGIN, 26, { lineBreak: false });
        doc.font('Regular').fontSize(12).fillColor('#E2E8F0').text(data.reportTitle, MARGIN, 56, { lineBreak: false });

        doc.font('Regular').fontSize(10).fillColor(WHITE)
            .text(data.periodLabel, MARGIN, 26, { width: contentW, align: 'right' });
        doc.fontSize(9).fillColor('#E2E8F0')
            .text(`${data.userName} için hazırlandı`, MARGIN, 42, { width: contentW, align: 'right' });
    }

    private roundedCard(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, r = 8): void {
        doc.roundedRect(x, y, w, h, r).fillColor(SURFACE).fill();
        doc.roundedRect(x, y, w, h, r).lineWidth(0.75).strokeColor(BORDER).stroke();
    }

    private drawStatCard(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, value: string, label: string): void {
        this.roundedCard(doc, x, y, w, h);
        doc.font('Bold').fontSize(17).fillColor(ACCENT_DARK)
            .text(value, x, y + 14, { width: w, align: 'center' });
        doc.font('Regular').fontSize(9).fillColor(TEXT_SECONDARY)
            .text(label, x, y + 38, { width: w, align: 'center' });
    }

    private flattenSubjects(breakdown: UniversePerformanceEntry[]): { name: string; duration: number }[] {
        const rows: { name: string; duration: number }[] = [];
        for (const universe of breakdown) {
            for (const subject of universe.subjects) {
                rows.push({ name: subject.subjectName, duration: subject.totalDuration });
            }
        }
        rows.sort((a, b) => b.duration - a.duration);

        if (rows.length <= TOP_CHART_SUBJECT_LIMIT) {
            return rows;
        }

        const top = rows.slice(0, TOP_CHART_SUBJECT_LIMIT - 1);
        const rest = rows.slice(TOP_CHART_SUBJECT_LIMIT - 1);
        const restTotal = rest.reduce((sum, r) => sum + r.duration, 0);
        top.push({ name: `Diğer (${rest.length})`, duration: restTotal });
        return top;
    }

    private drawBarChart(doc: PDFKit.PDFDocument, x: number, y: number, w: number, rows: { name: string; duration: number }[]): void {
        const maxVal = Math.max(...rows.map((r) => r.duration), 1);
        const barH = 20;
        const gap = 24;
        const labelW = 95;
        const chartW = w - labelW - 70;

        doc.font('Bold').fontSize(13).fillColor(TEXT).text('Ders bazlı çalışma süresi', x, y);
        let cy = y + 26;

        for (const row of rows) {
            const barW = Math.max(4, (row.duration / maxVal) * chartW);
            doc.font('Regular').fontSize(10).fillColor(TEXT)
                .text(row.name, x, cy + 5, { width: labelW - 8, align: 'right' });
            doc.roundedRect(x + labelW, cy, barW, barH, 4).fill(ACCENT);
            doc.font('Regular').fontSize(9.5).fillColor(TEXT_SECONDARY)
                .text(formatDurationShort(row.duration), x + labelW + barW + 8, cy + 5, { lineBreak: false });
            cy += barH + gap;
        }
    }

    private drawDonutSegment(doc: PDFKit.PDFDocument, cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number, color: string): void {
        const toRad = (d: number) => (d - 90) * (Math.PI / 180);
        const start = toRad(startDeg);
        const end = toRad(endDeg);
        const steps = Math.max(2, Math.ceil(Math.abs(endDeg - startDeg) / 3));

        let pathData = '';
        for (let i = 0; i <= steps; i++) {
            const a = start + (end - start) * (i / steps);
            const px = cx + outerR * Math.cos(a);
            const py = cy + outerR * Math.sin(a);
            pathData += i === 0 ? `M ${px} ${py} ` : `L ${px} ${py} `;
        }
        for (let i = steps; i >= 0; i--) {
            const a = start + (end - start) * (i / steps);
            const px = cx + innerR * Math.cos(a);
            const py = cy + innerR * Math.sin(a);
            pathData += `L ${px} ${py} `;
        }
        pathData += 'Z';

        doc.save();
        doc.path(pathData).fill(color);
        doc.restore();
    }

    private drawAccuracyDonut(doc: PDFKit.PDFDocument, x: number, y: number, correct: number, wrong: number): void {
        doc.font('Bold').fontSize(13).fillColor(TEXT).text('Doğruluk oranı', x, y);
        const cx = x + 45;
        const cy = y + 70;
        const outerR = 40;
        const innerR = 27;
        const total = correct + wrong;
        const pct = total ? Math.round((100 * correct) / total) : 0;
        const correctDeg = total ? (360 * correct) / total : 0;

        if (total === 0) {
            doc.circle(cx, cy, outerR).lineWidth(outerR - innerR).strokeColor(BORDER).stroke();
        } else {
            if (correct > 0) this.drawDonutSegment(doc, cx, cy, outerR, innerR, 0, correctDeg, SUCCESS);
            if (wrong > 0) this.drawDonutSegment(doc, cx, cy, outerR, innerR, correctDeg, 360, ERROR);
        }

        doc.font('Bold').fontSize(20).fillColor(TEXT).text(`%${pct}`, x, cy - 12, { width: 90, align: 'center' });
        doc.font('Regular').fontSize(9).fillColor(TEXT_SECONDARY).text('doğruluk', x, cy + 10, { width: 90, align: 'center' });

        doc.font('Regular').fontSize(9.5).fillColor(TEXT_SECONDARY)
            .text(`${correct} doğru · ${wrong} yanlış`, x, cy + outerR + 16, { width: 150, align: 'left' });
    }

    private checkAddPage(doc: PDFKit.PDFDocument, neededHeight: number): void {
        if (doc.y + neededHeight > doc.page.height - 40) {
            doc.addPage({ margins: { top: 0, bottom: 0, left: MARGIN, right: MARGIN } });
            doc.y = 40;
        }
    }

    private drawUniverseSection(doc: PDFKit.PDFDocument, universe: UniversePerformanceEntry, contentW: number): void {
        this.checkAddPage(doc, 30);
        const headerY = doc.y;
        doc.roundedRect(MARGIN, headerY, contentW, 26, 5).fill(DARK);
        doc.font('Bold').fontSize(11.5).fillColor(WHITE)
            .text(universe.universeName, MARGIN + 10, headerY + 7, { lineBreak: false });
        doc.y = headerY + 26 + 4;

        const colX = [MARGIN + 8, MARGIN + 200, MARGIN + 300, MARGIN + 390];
        const rowH = 24;

        for (const subject of universe.subjects) {
            this.checkAddPage(doc, rowH);
            const rowY = doc.y;
            doc.rect(MARGIN, rowY, contentW, rowH).fill(SURFACE);
            doc.font('Bold').fontSize(9.5).fillColor(TEXT).text(subject.subjectName, colX[0], rowY + 7, { lineBreak: false });
            doc.font('Regular').fontSize(8.5).fillColor(TEXT_SECONDARY).text(formatDurationShort(subject.totalDuration), colX[1], rowY + 7, { lineBreak: false });
            doc.text(`${subject.totalQuestions} soru`, colX[2], rowY + 7, { lineBreak: false });
            doc.fillColor(SUCCESS).text(`${subject.totalCorrect} ✓`, colX[3], rowY + 7, { continued: true, lineBreak: false });
            doc.fillColor(ERROR).text(`  ${subject.totalWrong} ✗`, { lineBreak: false });
            doc.y = rowY + rowH;

            for (const topic of subject.topics) {
                this.checkAddPage(doc, rowH);
                const ty = doc.y;
                doc.font('Regular').fontSize(8.5).fillColor(TEXT_SECONDARY).text(`↳ ${topic.topicName}`, colX[0] + 6, ty + 7, { lineBreak: false });
                doc.text(formatDurationShort(topic.totalDuration), colX[1], ty + 7, { lineBreak: false });
                doc.text(`${topic.totalQuestions} soru`, colX[2], ty + 7, { lineBreak: false });
                doc.fillColor(SUCCESS).text(`${topic.totalCorrect} ✓`, colX[3], ty + 7, { continued: true, lineBreak: false });
                doc.fillColor(ERROR).text(`  ${topic.totalWrong} ✗`, { lineBreak: false });
                doc.moveTo(MARGIN, ty + rowH).lineTo(MARGIN + contentW, ty + rowH).lineWidth(0.4).strokeColor(BORDER).stroke();
                doc.y = ty + rowH;
            }
            doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentW, doc.y).lineWidth(0.4).strokeColor(BORDER).stroke();
        }
        doc.y += 16;
    }
}
