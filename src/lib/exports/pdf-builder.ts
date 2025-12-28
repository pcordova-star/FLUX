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

type PdfSummaryItem = { label: string; value: string };

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
    summary?: PdfSummaryItem[];
    notes?: string[];
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
    
    // Draw notes on the last page if they exist
    if (params.notes && params.notes.length > 0) {
        drawNotes(doc, params.notes);
    }
    
    // Finalize the document and add page numbers to footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        drawHeader(doc, params); // Header must be drawn after switching page
        drawFooter(doc, i + 1, pageCount);
    }
    
    const endPromise = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    doc.end();
    return endPromise;
}

// --- Drawing Helper Functions ---

function drawHeader(doc: PDFKit.PDFDocument, params: BuildPdfParams) {
    const { meta, branding, summary } = params;
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
    doc.moveDown(1);
    
    // Draw Summary if provided
    if (summary && summary.length > 0) {
        drawSummary(doc, summary);
        doc.moveDown(1);
    }
}

function drawSummary(doc: PDFKit.PDFDocument, summary: PdfSummaryItem[]) {
    const startX = doc.page.margins.left;
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const boxY = doc.y;

    doc.rect(startX, boxY, availableWidth, 40).fillAndStroke(HEADER_BG_COLOR, ROW_STROKE_COLOR);

    let x = startX + 15;
    let y = boxY + 10;
    
    doc.font('Helvetica-Bold').fontSize(HEADER_FONT_SIZE).fillColor(FONT_COLOR)
       .text('Resumen Ejecutivo', x, y);
    doc.y += 10;
    x += 120;
    y = boxY + 8;


    for (const item of summary) {
        doc.font('Helvetica').fontSize(FONT_SIZE).fillColor('#6B7280').text(item.label, x, y, { width: 100, align: 'left' });
        doc.font('Helvetica-Bold').fontSize(FONT_SIZE).fillColor(FONT_COLOR).text(item.value, x, y + 10, { width: 100, align: 'left' });
        x += 100;
        if (x > startX + availableWidth - 100) { break; } // Avoid overflow
    }
    
    doc.y = boxY + 50;
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
    const { rows, columns } = params;
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
    y = doc.y; // Start after header and summary
    
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
        
        // Calculate max height of the row before moving Y
        let maxHeight = 0;
        columns.forEach(col => {
            const text = row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '';
            const height = doc.heightOfString(text, { width: col.width });
            if (height > maxHeight) maxHeight = height;
        });
        
        doc.y += maxHeight + 5; 
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke(ROW_STROKE_COLOR);
        doc.y += 5;
    }
}

function drawNotes(doc: PDFKit.PDFDocument, notes: string[]) {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 80) {
        doc.addPage();
    }
    
    doc.moveDown(3);
    
    const startX = doc.page.margins.left;
    const y = doc.y;
    
    doc.font('Helvetica-Bold').fontSize(10).fillColor(FONT_COLOR).text('Notas Adicionales', startX, y);
    doc.moveDown(0.5);

    const sanitizedNotes = notes
        .map(note => note.replace(/[\r\n\t]+/g, ' ').trim().substring(0, 500)) // Sanitize and truncate
        .filter(note => note.length > 0);

    doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
    sanitizedNotes.forEach(note => {
        // Truncate long notes
        const truncatedNote = note.length > 250 ? note.substring(0, 250) + '...' : note;
        doc.list([truncatedNote], { bulletRadius: 1.5, textIndent: 10 });
    });
}
