import PDFDocument from 'pdfkit';

// ===== TYPE DEFINITIONS =====

interface CompletionCertificateData {
  name: string;
  courseName: string;
  completionDate?: string;
  instructorName?: string;
  certificateId?: string;
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

interface CompletionCertificateModule {
  drawCompletionCertificate: typeof drawCompletionCertificate;
  settings: DocumentSettings;
}

// ===== CERTIFICATE DRAWING FUNCTION =====

/**
 * Certificate of Completion Template
 * @param doc - The PDFKit document instance
 * @param data - Certificate data
 */
function drawCompletionCertificate(doc: typeof PDFDocument, data: CompletionCertificateData): void {
  const pageWidth: number = 841.89;  // A4 landscape width
  const pageHeight: number = 595.28; // A4 landscape height
  const centerX: number = pageWidth / 2;

  // ===== DECORATIVE BORDER =====
  // Outer border
  doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
    .lineWidth(4)
    .strokeColor('#27AE60') // Green for completion
    .stroke();

  // Inner border
  doc.rect(35, 35, pageWidth - 70, pageHeight - 70)
    .lineWidth(1)
    .strokeColor('#27AE60')
    .stroke();

  // Corner decorations - Simple arcs
  const arcRadius: number = 40;

  // Top-left
  doc.path(`M 40 ${40 + arcRadius} A ${arcRadius} ${arcRadius} 0 0 1 ${40 + arcRadius} 40`)
    .lineWidth(2)
    .strokeColor('#27AE60')
    .stroke();

  // Top-right
  doc.path(`M ${pageWidth - 40 - arcRadius} 40 A ${arcRadius} ${arcRadius} 0 0 1 ${pageWidth - 40} ${40 + arcRadius}`)
    .lineWidth(2)
    .strokeColor('#27AE60')
    .stroke();

  // Bottom-right
  doc.path(`M ${pageWidth - 40} ${pageHeight - 40 - arcRadius} A ${arcRadius} ${arcRadius} 0 0 1 ${pageWidth - 40 - arcRadius} ${pageHeight - 40}`)
    .lineWidth(2)
    .strokeColor('#27AE60')
    .stroke();

  // Bottom-left
  doc.path(`M ${40 + arcRadius} ${pageHeight - 40} A ${arcRadius} ${arcRadius} 0 0 1 40 ${pageHeight - 40 - arcRadius}`)
    .lineWidth(2)
    .strokeColor('#27AE60')
    .stroke();

  // ===== HEADER =====
  doc.fontSize(40)
    .font('Helvetica-Bold')
    .fillColor('#1E8449')
    .text('CERTIFICATE OF COMPLETION', 0, 80, {
      width: pageWidth,
      align: 'center'
    });

  // ===== "AWARDED TO" =====
  doc.fontSize(16)
    .font('Helvetica')
    .fillColor('#555555')
    .text('This certificate is proudly awarded to', 0, 150, {
      width: pageWidth,
      align: 'center'
    });

  // ===== RECIPIENT NAME =====
  doc.fontSize(48)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text(data.name, 0, 190, {
      width: pageWidth,
      align: 'center'
    });

  // Underline under name
  doc.fontSize(48);
  const nameWidth: number = doc.widthOfString(data.name);
  const nameUnderlineStart: number = centerX - (nameWidth / 2) - 20;
  const nameUnderlineEnd: number = centerX + (nameWidth / 2) + 20;

  doc.moveTo(nameUnderlineStart, 250)
    .lineTo(nameUnderlineEnd, 250)
    .lineWidth(2)
    .strokeColor('#1E8449')
    .stroke();

  // ===== COMPLETION TEXT =====
  doc.fontSize(16)
    .font('Helvetica')
    .fillColor('#555555')
    .text('for successfully completing the course', 0, 280, {
      width: pageWidth,
      align: 'center'
    });

  // ===== COURSE NAME =====
  doc.fontSize(28)
    .font('Helvetica-BoldOblique')
    .fillColor('#1E8449')
    .text(data.courseName, 0, 320, {
      width: pageWidth,
      align: 'center'
    });

  // ===== DATE =====
  if (data.completionDate) {
    doc.fontSize(14)
      .font('Helvetica')
      .fillColor('#555555')
      .text(`Completed on ${data.completionDate}`, 0, 370, {
        width: pageWidth,
        align: 'center'
      });
  }

  // ===== FOOTER SECTION =====
  const footerY: number = pageHeight - 120;

  // Date of Issue
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Date of Issue', 150, footerY);

  const issueDate: string = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text(issueDate, 150, footerY + 15);

  doc.moveTo(150, footerY + 35)
    .lineTo(300, footerY + 35)
    .lineWidth(1)
    .strokeColor('#555555')
    .stroke();

  // Instructor Signature
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Instructor Signature', pageWidth - 300, footerY);

  doc.moveTo(pageWidth - 300, footerY + 35)
    .lineTo(pageWidth - 150, footerY + 35)
    .lineWidth(1)
    .strokeColor('#555555')
    .stroke();

  // Instructor Name
  if (data.instructorName) {
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(data.instructorName, pageWidth - 300, footerY + 40);
  }

  // ===== CERTIFICATE ID (Bottom Center) =====
  if (data.certificateId) {
    doc.fontSize(10)
      .font('Courier')
      .fillColor('#999999')
      .text(`Certificate ID: ${data.certificateId}`, 0, pageHeight - 30, {
        width: pageWidth,
        align: 'center'
      });
  }
}

// ===== TEMPLATE SETTINGS =====

const settings: DocumentSettings = {
  size: 'A4',
  layout: 'landscape',
  margins: { top: 0, bottom: 0, left: 0, right: 0 }
};

// Attach settings to the function
drawCompletionCertificate.settings = settings;

const completionCertificateModule: CompletionCertificateModule = {
  drawCompletionCertificate,
  settings
};

export default completionCertificateModule;
export { drawCompletionCertificate, settings };
export type { CompletionCertificateData, DocumentSettings };