import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import axios from 'axios';
import { SubmissionEntity, FormEntity } from '../lib/dynamo/index.js';
import { StorageService } from '../storage.js';

export class PdfExportService {
  async exportSubmissionToPdf(submissionId: string, projectId: string): Promise<Uint8Array> {
    // 1. Fetch Submission
    const subResult = await SubmissionEntity.get({ projectId, submissionId }).go();
    const submission = subResult.data;
    if (!submission) throw new Error('Submission not found');

    // 2. Fetch Form
    const formResult = await FormEntity.get({ projectId, formId: submission.formId }).go();
    const form = formResult.data;
    if (!form) throw new Error('Form not found');

    const formSchema = form.schema as Record<string, unknown>;
    const settings = formSchema.settings as Record<string, unknown> | undefined;
    const backgroundPdfUrl = settings?.backgroundPdfUrl as string | undefined;

    if (!backgroundPdfUrl) {
      throw new Error('Form does not have a background PDF configured');
    }

    // 3. Fetch Background PDF
    const response = await axios.get(backgroundPdfUrl, { responseType: 'arraybuffer' });
    const pdfDoc = await PDFDocument.load(response.data);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // 4. Prepare Font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    // 5. Map Data to Overlay Coordinates
    const responseData = submission.data as Record<string, unknown>;

    // Flatten all fields from schema
    const allFields: Array<{ name?: string; id?: string; overlay?: { x: number; y: number; pageIndex?: number } }> = [];
    const schemaPages = (formSchema.pages ?? []) as Array<{
      sections: Array<{
        fields: Array<{
          name?: string;
          id?: string;
          overlay?: { x: number; y: number; pageIndex?: number };
          columns?: Array<Record<string, unknown>>;
          fields?: Array<Record<string, unknown>>;
        }>;
      }>;
    }>;

    for (const page of schemaPages) {
      for (const section of page.sections) {
        const extractFields = (fields: Array<Record<string, unknown>>) => {
          for (const f of fields) {
            allFields.push(f as typeof allFields[number]);
            if (Array.isArray(f.columns)) extractFields(f.columns as Array<Record<string, unknown>>);
            if (Array.isArray(f.fields)) extractFields(f.fields as Array<Record<string, unknown>>);
          }
        };
        extractFields(section.fields as Array<Record<string, unknown>>);
      }
    }

    // Draw Data
    for (const [key, value] of Object.entries(responseData)) {
      const field = allFields.find((f) => f.name === key);
      if (field?.overlay) {
        const { x, y, pageIndex } = field.overlay;
        const targetPage = pages[pageIndex || 0] || firstPage;

        let text = String(value);
        if (value === true) text = 'Yes';
        if (value === false) text = 'No';
        if (Array.isArray(value)) text = value.join(', ');

        targetPage.drawText(text, {
          x,
          y: targetPage.getHeight() - y - fontSize,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }
    }

    return await pdfDoc.save();
  }
}

/**
 * Generate a flattened PDF using a FormPDFOverlay configuration.
 * Downloads the background PDF from S3, overlays submission data, returns buffer.
 */
export async function generateFlattenedPDF(
  overlayConfig: { pdfUrl: string; fields: Array<{ fieldId: string; x: number; y: number; page: number }> },
  submissionData: Record<string, unknown>,
): Promise<Buffer> {
  const pdfBytes = await StorageService.getObject(overlayConfig.pdfUrl);
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const field of overlayConfig.fields) {
    const page = doc.getPage(field.page - 1);
    const value = submissionData[field.fieldId];
    let text: string;
    if (value === true) text = 'Yes';
    else if (value === false) text = 'No';
    else if (Array.isArray(value)) text = (value as unknown[]).join(', ');
    else text = String(value ?? '');

    page.drawText(text, {
      x: field.x,
      y: field.y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return Buffer.from(await doc.save());
}
