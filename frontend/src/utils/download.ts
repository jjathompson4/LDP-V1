/**
 * Triggers a browser download for a given Blob, File, or Data URI string.
 * @param content The Blob, File, or Data URI string to download.
 * @param filename The name to save the file as.
 */
export const downloadFile = (content: Blob | string, filename: string) => {
    const url = typeof content === 'string' ? content : window.URL.createObjectURL(content);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
        if (typeof content !== 'string') {
            window.URL.revokeObjectURL(url);
        }
    }, 100);
};
