
import { PrismaClient } from '@prisma/client';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import axios from 'axios';

const prisma = new PrismaClient();

export class PdfExportService {
  async exportSubmissionToPdf(submissionId: number): Promise<Uint8Array> {
    // 1. Fetch Submission & Form Structure
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { form: true }
    });

    if (!submission || !submission.form) {
      throw new Error('Submission or Form not found');
    }

    const formSchema = submission.form.form_schema as any; // Typed as Json in Prisma, need cast
    const backgroundPdfUrl = formSchema.settings?.backgroundPdfUrl;

    if (!backgroundPdfUrl) {
      throw new Error('Form does not have a background PDF configured');
    }

    // 2. Fetch Background PDF
    const response = await axios.get(backgroundPdfUrl, { responseType: 'arraybuffer' });
    const pdfDoc = await PDFDocument.load(response.data);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0]; // Assuming single page background for now, or match page index
    const { height } = firstPage.getSize();

    // 3. Prepare Font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    // 4. Map Data to Overlay Coordinates
    const responseData = submission.data as Record<string, any>; // JSON
    
    // Helper to find field in recursive schema
    const findFieldById = (fields: any[], id: string): any => {
        for(const field of fields) {
            if (field.id === id) return field;
            if (field.columns) { // Smart Table / Column Layout
                 const found = findFieldById(field.columns, id);
                 if(found) return found;
            }
            if(field.fields) { // Section
                const found = findFieldById(field.fields, id);
                if(found) return found;
            }
        }
        return null;
    };

    // Flatten all fields to iterate
    const allFields: any[] = [];
    formSchema.pages.forEach((page: any) => {
        page.sections.forEach((section: any) => {
            const extractFields = (fields: any[]) => {
                fields.forEach(f => {
                    allFields.push(f);
                    if(f.columns) extractFields(f.columns);
                    if(f.fields) extractFields(f.fields);
                });
            };
            extractFields(section.fields);
        });
    });

    // Draw Data
    for (const [key, value] of Object.entries(responseData)) {
        // Matches by name or ID? Usually data is stored by field Name or Name key.
        // Let's assume response_data keys matches field.name
        const field = allFields.find(f => f.name === key);

        if (field && field.overlay) {
             const { x, y, pageIndex } = field.overlay;
             // Coordinates are typically from bottom-left in PDF, but frontend usually top-left.
             // Need to invert Y if frontend sends top-left Y.
             // Assuming frontend sends top-left (0,0 is top-left).
             // PDF (0,0) is bottom-left.
             // pdfY = height - cssY - (optional textHeight correction)
             
             // If we validated 72 DPI in 8.1, we assume x/y are points.
             
             const targetPage = pages[pageIndex || 0] || firstPage;
             
             // Convert Value to String
             let text = String(value);
             if (value === true) text = "Yes"; // Checkbox
             if (value === false) text = "No";
             if (Array.isArray(value)) text = value.join(", "); // Multi-select
             
             targetPage.drawText(text, {
                 x: x, 
                 y: targetPage.getHeight() - y - fontSize, // Invert Y
                 size: fontSize,
                 font: font,
                 color: rgb(0, 0, 0),
             });
        }
    }

    // 5. Flatten & Save
    // form.flatten(); // Only needed if we used AcroFields. We drew projected text.
    return await pdfDoc.save();
  }
}
