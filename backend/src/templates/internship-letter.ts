import PDFDocument from 'pdfkit';

// ===== TYPE DEFINITIONS =====

interface InternshipLetterData {
  companyName?: string;
  companyAddress?: string;
  name: string;
  recipientAddress?: string;
  startDate?: string;
  endDate?: string;
  position?: string;
  learningArea?: string;
  stipend?: string;
}

interface DocumentSettings {
  size: string;
  layout: 'landscape' | 'portrait';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface InternshipLetterModule {
  drawInternshipLetter: typeof drawInternshipLetter;
  settings: DocumentSettings;
}

// ===== INTERNSHIP LETTER DRAWING FUNCTION =====

/**
 * Internship Letter Template
 * @param doc - The PDFKit document instance
 * @param data - Letter data
 */
function drawInternshipLetter(doc: typeof PDFDocument, data: InternshipLetterData): void {
  const pageWidth: number = 595.28; // A4 portrait width
  const pageHeight: number = 841.89; // A4 portrait height
  const margin: number = 50;

  // ===== HEADER - Company Info =====
  const companyName: string = data.companyName || 'Your Company Name';
  const companyAddress: string = data.companyAddress || '123 Business Road, Tech City, 10001';

  doc.fontSize(24)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text(companyName, margin, margin, { align: 'center' });

  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#555555')
    .text(companyAddress, margin, margin + 30, { align: 'center' });

  // Decorative Line
  doc.moveTo(margin, margin + 50)
    .lineTo(pageWidth - margin, margin + 50)
    .lineWidth(1)
    .strokeColor('#000000')
    .stroke();

  // ===== DATE =====
  const currentDate: string = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.fontSize(11)
    .font('Helvetica')
    .fillColor('#000000')
    .text(`Date: ${currentDate}`, margin, margin + 70);

  // ===== RECIPIENT DETAILS =====
  doc.moveDown(2);
  doc.text('To,', margin);
  doc.font('Helvetica-Bold').text(data.name);
  if (data.recipientAddress) {
    doc.font('Helvetica').text(data.recipientAddress);
  }

  // ===== SUBJECT =====
  doc.moveDown(2);
  doc.font('Helvetica-Bold')
    .text('Subject: Internship Offer Letter', margin, doc.y, { underline: true });

  // ===== SALUTATION =====
  doc.moveDown(1.5);
  doc.font('Helvetica')
    .text(`Dear ${data.name},`, margin);

  // ===== BODY PARAGRAPHS =====
  doc.moveDown(1);

  const startDate: string = data.startDate || '[Start Date]';
  const endDate: string = data.endDate || '[End Date]';
  const position: string = data.position || 'Intern';

  const para1: string = `We are pleased to offer you an internship at ${companyName} as a ${position}. Your internship is scheduled to start on ${startDate} and will conclude on ${endDate}.`;

  doc.text(para1, {
    align: 'justify',
    width: pageWidth - (2 * margin)
  });

  doc.moveDown(1);
  const para2: string = `During your internship, you will be working under the guidance of our team and will have the opportunity to learn about ${data.learningArea || 'various aspects of our operations'}. You will be expected to perform the duties assigned to you to the best of your ability and to comply with all company policies and procedures.`;

  doc.text(para2, {
    align: 'justify',
    width: pageWidth - (2 * margin)
  });

  doc.moveDown(1);
  const para3: string = data.stipend
    ? `You will receive a stipend of ${data.stipend} per month during the internship period.`
    : 'This is an unpaid internship position focused on educational experience.';

  doc.text(para3, {
    align: 'justify',
    width: pageWidth - (2 * margin)
  });

  doc.moveDown(1);
  const para4: string = 'We are confident that this internship will be a valuable learning experience for you and we look forward to having you on our team.';

  doc.text(para4, {
    align: 'justify',
    width: pageWidth - (2 * margin)
  });

  doc.moveDown(1);
  doc.text('Please sign and return a copy of this letter as acceptance of the internship offer.');

  // ===== CLOSING =====
  doc.moveDown(3);
  doc.text('Sincerely,');

  doc.moveDown(3);
  doc.font('Helvetica-Bold').text('Authorised Signatory');
  doc.font('Helvetica').text(companyName);

  // ===== FOOTER =====
  const footerY: number = pageHeight - 40;
  doc.fontSize(8)
    .fillColor('#888888')
    .text(`${companyName} | ${companyAddress}`, margin, footerY, {
      align: 'center',
      width: pageWidth - (2 * margin)
    });
}

// ===== TEMPLATE SETTINGS =====

const settings: DocumentSettings = {
  size: 'A4',
  layout: 'portrait',
  margins: { top: 0, bottom: 0, left: 0, right: 0 }
};

// Attach settings to the function
drawInternshipLetter.settings = settings;

const internshipLetterModule: InternshipLetterModule = {
  drawInternshipLetter,
  settings
};

export default internshipLetterModule;
export { drawInternshipLetter, settings };
export type { InternshipLetterData, DocumentSettings };