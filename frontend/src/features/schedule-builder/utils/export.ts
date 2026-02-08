import type { Fixture, ColumnConfig } from '../types';
import * as XLSX from 'xlsx';
import { API_BASE_URL as API_URL } from '../../../config';

/**
 * Exports an array of Fixture objects to an XLSX file, preserving column widths and row heights.
 * @param fixtures The array of fixture data to export.
 * @param columns The array of column configurations to determine headers and order.
 * @param fileName The desired name of the output file (without extension).
 * @param columnWidths A map of column keys to their pixel widths.
 * @param rowHeights A map of fixture IDs to their pixel heights.
 */
export const exportToXLSX = (
    fixtures: Fixture[],
    columns: ColumnConfig[],
    fileName: string,
    columnWidths: { [key: string]: number },
    rowHeights: { [key: string]: number }
): void => {
    // Define the headers from the visible columns, plus the Source File
    const headers = [...columns.map(c => c.label), 'Source File'];

    // Map the fixture data to an array of arrays
    const dataToExport = [
        headers,
        ...fixtures.map(fixture => {
            const row = columns.map(col => fixture[col.key] || '');
            row.push(fixture.sourceFile); // Add source file at the end
            return row;
        })
    ];

    // Create a new workbook and a worksheet
    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();

    // Set column widths
    const cols = columns.map(c => ({ wpx: columnWidths[String(c.key)] || 120 }));
    cols.push({ wpx: 250 }); // Set a width for the 'Source File' column
    ws['!cols'] = cols;

    // Set row heights
    const rows = [{ hpx: 30 }]; // Header row height
    fixtures.forEach(fixture => {
        rows.push({ hpx: rowHeights[fixture.id] || 60 });
    });
    ws['!rows'] = rows;

    // Robustly enable text wrapping for ALL data cells.
    // This iterates through every cell in the data range to ensure styling is applied.
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1");
    // Start from row 1 (R=1) to skip the header row.
    for (let R = 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);

            let cell = ws[cell_ref];

            // If a cell object doesn't exist for this address, create one.
            if (!cell) {
                ws[cell_ref] = { t: 's', v: '' };
                cell = ws[cell_ref];
            }

            // Ensure the style object 's' exists.
            // Note: SheetJS Community Edition doesn't support cell styling (colors, fonts, etc.) in the write operation directly without Pro build or hacks.
            // However, basic properties might be preserved or ignored. 
            // The original code used a CDN version which might have had different capabilities or it was just ignored.
            // We'll keep the logic but be aware it might not render in Excel without Pro.
            if (!cell.s) {
                cell.s = {};
            }

            // Ensure the alignment object exists within the style.
            if (!cell.s.alignment) {
                cell.s.alignment = {};
            }

            // Forcefully set the text wrapping and vertical alignment properties.
            cell.s.alignment.wrapText = true;
            cell.s.alignment.vertical = 'top';
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');

    // Generate Base64 string
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    // Submit to proxy
    // Submit to proxy
    // const API_URL was moved to import


    submitForm(`${API_URL}/download-proxy`, {
        filename: `${fileName}.xlsx`,
        content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64_data: wbout
    });
};

const submitForm = (url: string, data: Record<string, string>) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = '_blank';

    for (const key in data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};
