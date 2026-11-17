const PDFDocument = require('pdfkit');
const config = require('../../config');

const DEFAULT_PHONE = 'TEL. 01-773-78-50497 / 504-98 / 500-09      FAX 506-22';
const MANAGER = 'RECURSOS HUMANOS';
const LOGO_TIMEOUT_MS = 3000;
const PAGE = { width: 612, left: 40, right: 572 };
const COPY_HEIGHT = 362;
const TIME_ZONE = 'America/Mexico_City';
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

class NoticePdf {
  constructor() {
    this.logos = new Map();
  }

  static longDate(iso, capitalized = false) {
    const [year, month, day] = iso.slice(0, 10).split('-');
    const name = MONTHS[Number(month) - 1];
    return `${day}-${capitalized ? name[0].toUpperCase() + name.slice(1) : name}-${year}`;
  }

  static shortTime(time) {
    return time ? time.slice(0, 5) : '—';
  }

  static requestDay(value) {
    return new Date(value).toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
  }

  static plural(count, word) {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
  }

  static absenceLines(notice) {
    const lines = [];
    if (notice.days_taken > 0) {
      lines.push(
        `DÍAS   Del ${NoticePdf.longDate(notice.absence_start_date, true)} al ${NoticePdf.longDate(notice.absence_end_date, true)}, Número de Días: ${notice.days_taken}`
      );
    }
    if (notice.hours_taken > 0) {
      lines.push(
        `HORAS   de las ${NoticePdf.shortTime(notice.absence_start_time)} a las ${NoticePdf.shortTime(notice.absence_end_time)} hrs, Número de Horas: ${notice.hours_taken}`
      );
    }
    return lines;
  }

  async loadLogo(url) {
    if (!url || config.env === 'test') return null;
    if (this.logos.has(url)) return this.logos.get(url);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(LOGO_TIMEOUT_MS) });
      const logo = response.ok ? Buffer.from(await response.arrayBuffer()) : null;
      this.logos.set(url, logo);
      return logo;
    } catch {
      return null;
    }
  }

  box(doc, x, y, width, height, text, options = {}) {
    doc.rect(x, y, width, height).lineWidth(0.8).stroke();
    if (text) {
      doc
        .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(options.size ?? 9)
        .text(text, x + 4, y + 4, { width: width - 8, height: height - 6, ellipsis: true });
    }
  }

  label(doc, text, x, y) {
    return doc.font('Helvetica-Bold').fontSize(8).text(text, x, y, { lineBreak: false });
  }

  drawHeader(doc, company, logo, top) {
    if (logo) doc.image(logo, PAGE.left, top + 4, { fit: [64, 64] });
    const headerX = PAGE.left + 74;
    const headerWidth = PAGE.right - headerX;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(company.company_name, headerX, top + 6, { width: headerWidth, align: 'center' });
    doc.font('Helvetica').fontSize(8);
    doc.text(company.location ?? '', headerX, top + 22, { width: headerWidth, align: 'center' });
    doc.text(`R.F.C. ${company.rfc ?? ''}`, headerX, top + 34, { width: headerWidth, align: 'center' });
    doc.text(company.phone_number ? `TEL. ${company.phone_number}` : DEFAULT_PHONE, headerX, top + 45, {
      width: headerWidth,
      align: 'center',
    });
  }

  drawSignatures(doc, top) {
    const signatures = ['RECURSOS HUMANOS', 'ENC. DEPARTAMENTO', 'INTERESADO'];
    const columnWidth = (PAGE.right - PAGE.left) / signatures.length;
    signatures.forEach((title, index) => {
      const x = PAGE.left + index * columnWidth;
      doc.font('Helvetica-Bold').fontSize(8).text(title, x, top + 306, { width: columnWidth, align: 'center' });
      doc
        .moveTo(x + 18, top + 340)
        .lineTo(x + columnWidth - 18, top + 340)
        .lineWidth(0.8)
        .stroke();
    });
  }

  drawCopy(doc, data, top) {
    const { notice, company, balance, logo } = data;
    const { longDate } = NoticePdf;

    this.drawHeader(doc, company, logo, top);

    doc.font('Helvetica-Bold').fontSize(13).text('AVISO DE AUSENCIA', PAGE.left, top + 66, { width: 420, align: 'center' });
    doc.text(`NO.  ${notice.notice_id}`, 440, top + 66, { lineBreak: false });

    this.label(doc, 'Fecha Solicitud:', 350, top + 90);
    this.box(doc, 430, top + 86, 142, 16, longDate(NoticePdf.requestDay(notice.request_date)));

    this.label(doc, 'No. Trab.', PAGE.left, top + 106);
    this.box(doc, PAGE.left, top + 116, 70, 16, notice.employee_number, { bold: true });
    this.label(doc, 'NOMBRE', 120, top + 106);
    this.box(doc, 120, top + 116, 452, 16, (notice.employee_name ?? '').toUpperCase(), { bold: true });

    this.label(doc, 'DEPARTAMENTO:', PAGE.left, top + 140);
    this.box(doc, PAGE.left, top + 150, 260, 16, (notice.department_name ?? '').toUpperCase(), { bold: true });
    this.label(doc, 'ENCARGADO:', 312, top + 140);
    this.box(doc, 312, top + 150, 260, 16, MANAGER, { bold: true });

    this.label(doc, 'MOTIVO:', PAGE.left, top + 174);
    this.box(doc, PAGE.left, top + 184, 330, 18, (notice.reason_description ?? '').toUpperCase(), { bold: true });
    doc.rect(PAGE.left, top + 202, 330, 60).lineWidth(0.8).stroke();
    doc.font('Helvetica').fontSize(7.5);
    NoticePdf.absenceLines(notice).forEach((line, index) =>
      doc.text(line, PAGE.left + 6, top + 208 + index * 14, { width: 318 })
    );
    if (balance) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .text(
          `Restantes en el periodo: ${NoticePdf.plural(balance.available.days, 'día')} y ${NoticePdf.plural(balance.available.hours, 'hora')}`,
          PAGE.left + 6,
          top + 248,
          { width: 318 }
        );
    }

    this.label(doc, 'ESTARÁ AUSENTE A PARTIR DEL:', 382, top + 184);
    this.box(doc, 382, top + 198, 86, 16, longDate(notice.absence_start_date), { size: 8 });
    this.label(doc, 'AL:', 474, top + 202);
    this.box(doc, 492, top + 198, 80, 16, longDate(notice.absence_end_date), { size: 8 });

    this.label(doc, 'OBS.:', PAGE.left, top + 276);
    this.box(doc, 76, top + 270, 496, 22, notice.remarks ?? '', { size: 8 });

    this.drawSignatures(doc, top);
  }

  async render(data) {
    const logo = await this.loadLogo(data.company.logo);
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 0,
      info: { Title: `Aviso de ausencia ${data.notice.notice_id}` },
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const finished = new Promise((resolve) => doc.on('end', resolve));

    this.drawCopy(doc, { ...data, logo }, 24);
    doc
      .moveTo(PAGE.left - 10, 24 + COPY_HEIGHT + 6)
      .lineTo(PAGE.right + 10, 24 + COPY_HEIGHT + 6)
      .dash(4, { space: 3 })
      .lineWidth(0.6)
      .stroke()
      .undash();
    this.drawCopy(doc, { ...data, logo }, 24 + COPY_HEIGHT + 18);

    doc.end();
    await finished;
    return Buffer.concat(chunks);
  }
}

module.exports = new NoticePdf();
module.exports.NoticePdf = NoticePdf;
