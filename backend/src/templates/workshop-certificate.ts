import PDFDocument from 'pdfkit';

// ===== TYPE DEFINITIONS =====

interface Corner {
  x: number;
  y: number;
}

interface WorkshopCertificateData {
  name: string;
  workshopTitle: string;
  duration: string;
  date: string;
  coordinatorName?: string;
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

interface WorkshopCertificateModule {
  drawWorkshopCertificate: typeof drawWorkshopCertificate;
  settings: DocumentSettings;
}

// ===== CERTIFICATE DRAWING FUNCTION =====

/**
 * Workshop Certificate Template
 * @param doc - The PDFKit document instance
 * @param data - Certificate data
 */
function drawWorkshopCertificate(doc: typeof PDFDocument, data: WorkshopCertificateData): void {
  const pageWidth: number = 841.89;  // A4 landscape width
  const pageHeight: number = 595.28; // A4 landscape height
  const centerX: number = pageWidth / 2;

  // ===== DECORATIVE BORDER =====
  // Outer border
  doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
    .lineWidth(3)
    .strokeColor('#2E86C1') // Blue for workshop
    .stroke();

  // Inner border
  doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
    .lineWidth(1)
    .strokeColor('#2E86C1')
    .stroke();

  // Corner decorations
  const cornerSize: number = 40;
  const corners: Corner[] = [
    { x: 40, y: 40 },                              // Top-left
    { x: pageWidth - 80, y: 40 },                  // Top-right
    { x: 40, y: pageHeight - 80 },                 // Bottom-left
    { x: pageWidth - 80, y: pageHeight - 80 }      // Bottom-right
  ];

  corners.forEach((corner: Corner) => {
    doc.moveTo(corner.x, corner.y)
      .lineTo(corner.x + cornerSize, corner.y)
      .moveTo(corner.x, corner.y)
      .lineTo(corner.x, corner.y + cornerSize)
      .lineWidth(2)
      .strokeColor('#F39C12') // Accent color
      .stroke();
  });

  // ===== HEADER =====
  doc.fontSize(36)
    .font('Helvetica-Bold')
    .fillColor('#2E86C1')
    .text('CERTIFICATE OF PARTICIPATION', 0, 80, {
      width: pageWidth,
      align: 'center'
    });

  // Decorative line under header
  doc.moveTo(centerX - 150, 135)
    .lineTo(centerX + 150, 135)
    .lineWidth(2)
    .strokeColor('#F39C12')
    .stroke();

  // ===== "PROUDLY PRESENTED TO" =====
  doc.fontSize(14)
    .font('Helvetica')
    .fillColor('#333333')
    .text('PROUDLY PRESENTED TO', 0, 160, {
      width: pageWidth,
      align: 'center'
    });

  // ===== RECIPIENT NAME =====
  doc.fontSize(42)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text(data.name, 0, 200, {
      width: pageWidth,
      align: 'center'
    });

  // Underline under name
  doc.fontSize(48);
  const nameWidth: number = doc.widthOfString(data.name);
  const nameUnderlineStart: number = centerX - (nameWidth / 2);
  const nameUnderlineEnd: number = centerX + (nameWidth / 2);

  doc.moveTo(nameUnderlineStart, 255)
    .lineTo(nameUnderlineEnd, 255)
    .lineWidth(1)
    .strokeColor('#666666')
    .stroke();

  // ===== PARTICIPATION TEXT =====
  doc.fontSize(14)
    .font('Helvetica')
    .fillColor('#333333')
    .text('for successfully participating in the workshop', 0, 280, {
      width: pageWidth,
      align: 'center'
    });

  // ===== WORKSHOP TITLE =====
  doc.fontSize(24)
    .font('Helvetica-Bold')
    .fillColor('#2E86C1')
    .text(data.workshopTitle, 0, 315, {
      width: pageWidth,
      align: 'center'
    });

  // ===== DATE AND DURATION =====
  const detailsY: number = 365;

  doc.fontSize(14)
    .font('Helvetica')
    .fillColor('#333333')
    .text(`Duration: ${data.duration} (${data.date})`, 0, detailsY, {
      width: pageWidth,
      align: 'center'
    });

  // ===== FOOTER SECTION =====
  const footerY: number = pageHeight - 120;

  // Date of Issue
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Date of Issue', 150, footerY, {
      width: 150,
      align: 'center'
    });

  const issueDate: string = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text(issueDate, 150, footerY + 20, {
      width: 150,
      align: 'center'
    });

  // Date signature line
  doc.moveTo(150, footerY + 50)
    .lineTo(300, footerY + 50)
    .lineWidth(1)
    .strokeColor('#333333')
    .stroke();

  // Workshop Coordinator section
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Workshop Coordinator', pageWidth - 300, footerY, {
      width: 150,
      align: 'center'
    });

  // Coordinator signature line
  doc.moveTo(pageWidth - 300, footerY + 50)
    .lineTo(pageWidth - 150, footerY + 50)
    .lineWidth(1)
    .strokeColor('#333333')
    .stroke();

  // Coordinator Name
  if (data.coordinatorName) {
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(data.coordinatorName, pageWidth - 300, footerY + 55, {
        width: 150,
        align: 'center'
      });
  }

  // ===== DECORATIVE SEAL/BADGE =====
  const sealX: number = centerX;
  const sealY: number = footerY + 25;
  const sealRadius: number = 25;

  // Outer circle
  doc.circle(sealX, sealY, sealRadius)
    .lineWidth(2)
    .strokeColor('#F39C12')
    .fillColor('#2E86C1', 0.1)
    .fillAndStroke();

  // Inner circle
  doc.circle(sealX, sealY, sealRadius - 5)
    .lineWidth(1)
    .strokeColor('#F39C12')
    .stroke();

  // W for Workshop
  doc.fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#F39C12')
    .text('W', sealX - 9, sealY - 10);
}

// ===== TEMPLATE SETTINGS =====

const settings: DocumentSettings = {
  size: 'A4',
  layout: 'landscape',
  margins: { top: 0, bottom: 0, left: 0, right: 0 }
};

// Attach settings to the function
drawWorkshopCertificate.settings = settings;

const workshopCertificateModule: WorkshopCertificateModule = {
  drawWorkshopCertificate,
  settings
};

export default workshopCertificateModule;
export { drawWorkshopCertificate, settings };
export type { WorkshopCertificateData, DocumentSettings };