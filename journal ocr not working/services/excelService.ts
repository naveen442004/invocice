import type { RawRow, LedgerEntry } from '../types';

declare const XLSX: any;

export const getExcelSheetNames = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (!event.target?.result) {
                    return reject(new Error("File could not be read."));
                }
                const data = new Uint8Array(event.target.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                resolve(workbook.SheetNames);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const parseExcelFile = (file: File, sheetName: string): Promise<{ rawData: RawRow[]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
            return reject(new Error("File could not be read."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.includes(sheetName)) {
            return reject(new Error(`Sheet "${sheetName}" not found in the workbook.`));
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          return reject(new Error("Excel sheet must have a header row and at least one data row."));
        }

        const headers: string[] = jsonData[0].map(String);
        const rawData: RawRow[] = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== '')).map((row) => {
          const rowData: RawRow = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index];
          });
          return rowData;
        });
        
        resolve({ rawData, headers });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const exportToExcel = (data: LedgerEntry[], fileName: string): void => {
    const exportData = data.map(row => ({
        'Voucher Date': row.voucherDate,
        'Voucher Type Name': row.voucherTypeName,
        'Voucher Number': row.voucherNumber,
        'Ledger Name': row.ledgerName,
        'Ledger Amount': parseFloat(row.ledgerAmount),
        'Dr/Cr': row.ledgerAmountDrCr,
        'Narration': row.narration,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    worksheet['!cols'] = [
        { wch: 12 }, 
        { wch: 20 },
        { wch: 15 },
        { wch: 35 },
        { wch: 15 },
        { wch: 10 },
        { wch: 40 },
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LedgerImport');
    
    XLSX.writeFile(workbook, fileName);
};