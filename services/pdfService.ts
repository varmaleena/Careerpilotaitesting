import { getDocument } from 'pdfjs-dist';

// Ensure the worker is set up correctly for the browser environment
import { GlobalWorkerOptions } from 'pdfjs-dist';
// Use the CDN worker for simplicity in client-side React without complex build config
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import * as pdfjs from 'pdfjs-dist';

/**
 * Extracts plain text from a PDF file (Blob/File).
 * Uses pdfjs-dist to parse the file in the browser.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        // Load the document
        const loadingTask = getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Loop through all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Concatenate strings
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error("PDF Parse Error:", error);
        throw new Error("Failed to extract text from PDF. Please upload a clear PDF file.");
    }
};
