// This script relies on the pdf.js library being available in the global scope,
// which is loaded via CDN in index.html.
declare const pdfjsLib: any;

/**
 * Converts the first page of a PDF file to a base64 encoded PNG image string.
 * @param file The PDF file to convert.
 * @returns A promise that resolves with the base64 string (without the 'data:image/png;base64,' prefix), or null if conversion fails.
 */
export const convertPdfToImageBase64 = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error("FileReader failed to read the file."));
            }

            try {
                const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
                // Ensure pdfjsLib is available
                if (typeof pdfjsLib === 'undefined') {
                    return reject(new Error("PDF.js library not loaded."));
                }

                // Set worker source if needed (usually handled by the CDN script automatically or needs explicit setting)
                // pdfjsLib.GlobalWorkerOptions.workerSrc = '...'; 

                const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                const page = await pdf.getPage(1); // Get the first page

                const viewport = page.getViewport({ scale: 1.5 }); // Increase scale for better resolution
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                if (!context) {
                    return reject(new Error("Could not create canvas context."));
                }

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const dataUrl = canvas.toDataURL('image/png');
                // Strip the data URL prefix to get just the base64 content
                const base64Data = dataUrl.split(',')[1];
                resolve(base64Data);
            } catch (error) {
                console.error('Error processing PDF:', error);
                reject(error);
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
};
