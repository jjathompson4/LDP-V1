import JSZip from 'jszip';

/**
 * Unzips a .zip file and returns an array of File objects for any PDFs found inside.
 * @param file The .zip file to process.
 * @returns A promise that resolves with an array of File objects.
 */
export const unzipPdfsFromFile = async (file: File): Promise<File[]> => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const pdfPromises: Promise<File>[] = [];

    contents.forEach((relativePath: string, zipEntry: JSZip.JSZipObject) => {
        // Ignore directories and non-PDF files, also common junk folders from macOS
        if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.pdf') && !relativePath.startsWith('__MACOSX/')) {
            const promise = zipEntry.async('blob').then((blob: Blob) => {
                return new File([blob], zipEntry.name, { type: 'application/pdf' });
            });
            pdfPromises.push(promise);
        }
    });

    return Promise.all(pdfPromises);
};
