import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Constants for styling ---
const PAGE_MARGIN = 40;
const FONT_SIZE = 8;
const HEADER_FONT_SIZE = 9;
const FONT_COLOR = '#333333';
const HEADER_BG_COLOR = '#E5E7EB'; // tailwind gray-200
const ROW_STROKE_COLOR = '#D1D5DB'; // tailwind gray-300
const PRIMARY_COLOR = '#3F51B5'; // Deep Indigo from spec

// --- Type Definitions ---

type PdfColumn = {
    key: string;
    label: string;
    width: number;
    align?: 'left' | 'right' | 'center';
};

type PdfBranding = {
    mode: 'standard' | 'corporate';
};

type BuildPdfParams = {
    rows: any[];
    columns: PdfColumn[];
    meta: {
        companyName: string;
        reportTitle: string;
        reportSubtitle: string;
        dateRange: string;
    };
    branding: PdfBranding;
};

// --- Main Builder Function ---

export async function buildPdf(params: BuildPdfParams): Promise<Buffer> {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
        bufferPages: true,
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Register standard fonts
    doc.font('Helvetica');

    // Draw content
    drawTable(doc, params);
    
    // Finalize the document and add page numbers to footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        drawHeader(doc, params.meta, params.branding); // Header must be drawn after switching page
        drawFooter(doc, i + 1, pageCount);
    }
    
    const endPromise = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    doc.end();
    return endPromise;
}

// --- Drawing Helper Functions ---

function drawHeader(doc: PDFKit.PDFDocument, meta: BuildPdfParams['meta'], branding: PdfBranding) {
    const startX = doc.page.margins.left;
    const startY = doc.page.margins.top;
    const endX = doc.page.width - doc.page.margins.right;
    
    // Corporate Header Style
    if (branding.mode === 'corporate') {
        // FLUX Logo (SVG fallback)
        doc.save();
        doc.fillColor(PRIMARY_COLOR).rect(startX, startY - 10, 40, 40).fill();
        doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text('FLUX', startX + 4, startY + 5);
        doc.restore();

        // Titles
        doc.font('Helvetica-Bold').fontSize(16).fillColor(FONT_COLOR)
           .text(meta.reportTitle, startX + 50, startY, { align: 'left' });
        doc.font('Helvetica').fontSize(10)
           .text(meta.reportSubtitle, startX + 50, doc.y + 2, { align: 'left' });
    } else {
        // Standard Header
        doc.font('Helvetica-Bold').fontSize(16).text(meta.reportTitle, startX, startY);
    }

    // Right-aligned Meta Info
    const metaY = startY;
    const metaX = endX - 200;
    doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
    doc.text(`Compañía: ${meta.companyName}`, metaX, metaY, { width: 200, align: 'right' });
    doc.text(`Periodo: ${meta.dateRange}`, metaX, doc.y, { width: 200, align: 'right' });
    
    const emissionDate = format(new Date(), "dd 'de' MMMM, yyyy HH:mm", { locale: es });
    doc.text(`Emitido: ${emissionDate}`, metaX, doc.y, { width: 200, align: 'right' });

    doc.y = Math.max(doc.y, startY + 45); // Ensure header has enough space
    doc.moveDown(2);
}

function drawFooter(doc: PDFKit.PDFDocument, currentPage: number, totalPages: number) {
    const startX = doc.page.margins.left;
    const endX = doc.page.width - doc.page.margins.right;
    const y = doc.page.height - doc.page.margins.bottom + 10;
    
    doc.font('Helvetica-Bold').fontSize(8).fillColor(PRIMARY_COLOR)
       .text('FLUX Wems Core', startX, y, { align: 'left' });
       
    doc.font('Helvetica').fontSize(8).fillColor('#6B7280')
       .text(`Página ${currentPage} de ${totalPages}`, endX - 100, y, { width: 100, align: 'right' });
}

function drawTable(doc: PDFKit.PDFDocument, params: BuildPdfParams) {
    const { rows, columns, meta, branding } = params;
    let y = doc.y; // Will be set by header on first page
    
    const checkNewPage = (currentY: number) => {
        if (currentY > doc.page.height - doc.page.margins.bottom - 40) { // 40 is a threshold for a new row
            doc.addPage();
            y = doc.page.margins.top;
            drawTableHeader();
            return doc.y;
        }
        return currentY;
    };

    const drawTableHeader = () => {
        let x = doc.page.margins.left;
        doc.rect(x, y, doc.page.width - (doc.page.margins.left * 2), 20).fill(HEADER_BG_COLOR);
        doc.y += 4;
        
        for (const col of columns) {
            doc.font('Helvetica-Bold').fontSize(HEADER_FONT_SIZE).fillColor(FONT_COLOR)
               .text(col.label, x, doc.y, { width: col.width, align: 'left' });
            x += col.width + 10;
        }
        doc.y += 15;
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke(ROW_STROKE_COLOR);
        doc.y += 5;
    };
    
    // Initial setup on the first page
    y = doc.page.margins.top; // Dummy value, will be reset by header
    
    // Draw table
    drawTableHeader();

    for (const row of rows) {
        y = checkNewPage(doc.y);
        
        let x = doc.page.margins.left;
        for (const col of columns) {
            const text = row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '';
            doc.font('Helvetica').fontSize(FONT_SIZE).fillColor(FONT_COLOR)
               .text(text, x, y, {
                   width: col.width,
                   align: col.align || 'left',
                   lineBreak: true // Allow wrapping within the cell
               });
            x += col.width + 10;
        }
        
        doc.y += 15; // Move y down after drawing a row
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke(ROW_STROKE_COLOR);
        doc.y += 5;
    }
}
