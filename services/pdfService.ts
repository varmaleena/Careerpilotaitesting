import * as pdfjs from 'pdfjs-dist';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Ensure the worker is set up correctly for the browser environment using the jsdelivr CDN
GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Extracts plain text from a PDF file (Blob/File).
 * Uses pdfjs-dist to parse the file in the browser.
 * Also extracts hyperlinks from annotations (clickable icons/text).
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
    // Support plain text / markdown files directly
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const plainText = await file.text();
        if (plainText && plainText.trim()) return plainText.trim();
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        // Load the document
        const loadingTask = getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        const extractedLinks: string[] = [];

        // Loop through all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Concatenate strings
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n\n';

            // Extract annotations (hyperlinks)
            try {
                const annotations = await page.getAnnotations();


                for (const annotation of annotations) {


                    // Check if it's a link annotation
                    if (annotation.subtype === 'Link') {
                        let url = annotation.url;

                        // Also check for URI action
                        if (!url && annotation.action && annotation.action.url) {
                            url = annotation.action.url;
                        }

                        // Check for dest (internal links sometimes have external refs)
                        if (!url && annotation.dest) {

                        }

                        if (url) {
                            // Filter out generic/placeholder URLs
                            const genericPatterns = [
                                '/nil',
                                'example.com',
                                'yourname',
                                'username',
                                'user-name'
                            ];

                            const isGeneric = genericPatterns.some(pattern =>
                                url.toLowerCase().includes(pattern)
                            );

                            if (!isGeneric) {
                                extractedLinks.push(url);

                            } else {

                            }
                        }
                    }
                }
            } catch (annotError) {

            }
        }

        // Append extracted links to the text
        if (extractedLinks.length > 0) {
            fullText += '\n\n--- PROFILE LINKS ---\n';
            fullText += extractedLinks.join('\n');

        } else {

        }

        return fullText.trim();
    } catch (error) {
        throw new Error("Failed to extract text from PDF. Please upload a clear PDF file.");
    }
};
