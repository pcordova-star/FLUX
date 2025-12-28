import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PdfHeader {
    key: string;
    label: string;
    width: number;
    align?: 'left' | 'right';
}

interface PdfMetaInfo {
    companyName: string;
    reportTitle: string;
    reportSubtitle: string;
    dateRange: string;
}

const PAGE_MARGIN = 40;
const FONT_SIZE = 9;
const HEADER_FONT_SIZE = 10;
const FONT_COLOR = '#333333';
const HEADER_BG_COLOR = '#F3F4F6';
const ROW_STROKE_COLOR = '#E5E7EB';

export async function buildPdf(
    rows: any[],
    columns: PdfHeader[],
    meta: PdfMetaInfo
): Promise<Buffer> {
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: PAGE_MARGIN,
            bottom: PAGE_MARGIN,
            left: PAGE_MARGIN,
            right: PAGE_MARGIN,
        },
        bufferPages: true,
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Register a standard font
    doc.font('Helvetica');

    // Header on all pages
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);

        // Add header
        generateHeader(doc, meta);
        
        // Add footer
        generateFooter(doc);

        // Add table header
        generateTable(doc, rows, columns, i === 0);
    }
    
    // --- Manual Generation ---
    let y = doc.y;
    doc.switchToPage(doc.bufferedPageRange().count -1);
    
    y = doc.y;

    for (const row of rows) {
      if (y > doc.page.height - PAGE_MARGIN - 40) { // Check if new page is needed
          doc.addPage();
          generateHeader(doc, meta);
          generateFooter(doc);
          generateTable(doc, rows, columns, true);
          y = doc.y;
      }

      let x = PAGE_MARGIN;
      for (const col of columns) {
          const text = row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '';
          doc.fontSize(FONT_SIZE).fillColor(FONT_COLOR).text(text, x, y, {
              width: col.width,
              align: col.align || 'left',
          });
          x += col.width + 10;
      }

      y += 20;
      doc.moveTo(PAGE_MARGIN, y).lineTo(doc.page.width - PAGE_MARGIN, y).stroke(ROW_STROKE_COLOR);
      y += 5;
    }


    const endPromise = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    doc.end();

    return endPromise;
}

function generateHeader(doc: PDFKit.PDFDocument, meta: PdfMetaInfo) {
    doc.fontSize(16).font('Helvetica-Bold').text(meta.reportTitle, PAGE_MARGIN, PAGE_MARGIN);
    doc.fontSize(10).font('Helvetica').text(meta.reportSubtitle, PAGE_MARGIN, doc.y);
    
    const emissionDate = format(new Date(), "dd 'de' MMMM, yyyy HH:mm", { locale: es });
    
    const rightHeaderX = doc.page.width - PAGE_MARGIN - 200;
    doc.fontSize(8).font('Helvetica').text(`Compañía: ${meta.companyName}`, rightHeaderX, PAGE_MARGIN + 10, { align: 'right', width: 200 });
    doc.text(`Periodo: ${meta.dateRange}`, rightHeaderX, doc.y, { align: 'right', width: 200 });
    doc.text(`Emitido: ${emissionDate}`, rightHeaderX, doc.y, { align: 'right', width: 200 });

    doc.moveDown(2);
}

function generateFooter(doc: PDFKit.PDFDocument) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const pageNumText = `Página ${i + 1} de ${range.count}`;
        doc.fontSize(8).font('Helvetica').text(
            pageNumText,
            0,
            doc.page.height - PAGE_MARGIN + 10,
            { align: 'center' }
        );
    }
}

function generateTable(doc: PDFKit.PDFDocument, data: any[], columns: PdfHeader[], drawHeader: boolean) {
    let y = doc.y;
    
    if (drawHeader) {
        doc.rect(PAGE_MARGIN, y, doc.page.width - (PAGE_MARGIN * 2), 25).fill(HEADER_BG_COLOR);
        doc.moveDown(0.5);
        y += 5;

        let x = PAGE_MARGIN;
        for (const col of columns) {
            doc.fontSize(HEADER_FONT_SIZE).font('Helvetica-Bold').fillColor(FONT_COLOR)
               .text(col.label, x, y, { width: col.width });
            x += col.width + 10;
        }
        y += 20;
        doc.moveTo(PAGE_MARGIN, y).lineTo(doc.page.width - PAGE_MARGIN, y).stroke(ROW_STROKE_COLOR);
        doc.y = y + 5;
    }
}
