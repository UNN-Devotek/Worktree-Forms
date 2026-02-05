import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export interface ImportData {
  headers: string[];
  rows: any[];
}

/**
 * Parse an import file (CSV or Excel) and return standardized data
 */
export const parseImportFile = async (file: File): Promise<ImportData> => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data,
          });
        },
        error: (error) => reject(error),
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            resolve({ headers: [], rows: [] });
            return;
          }

          // Headers are the first row
          const headers = (jsonData[0] as string[]) || []; 
          
          // Rows are the rest, mapped to objects
          const rows = jsonData.slice(1).map((row: any) => {
            const rowObj: any = {};
            headers.forEach((header, index) => {
              rowObj[header] = row[index];
            });
            return rowObj;
          });

          resolve({ headers, rows });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported file type. Please upload .csv, .xlsx, or .xls file.'));
    }
  });
};

/**
 * Export data to CSV
 */
export const exportToCsv = (data: any[], filename: string) => {
  // Flatten data if necessary or assume simple objects
  // If data contains complex objects (images/attachments), we should simplify them for CSV
  const flattenedData = data.map(row => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
          const val = row[key];
          if (typeof val === 'object' && val !== null) {
              if (val.value) newRow[key] = val.value; // For structured cells
              else newRow[key] = JSON.stringify(val);
          } else {
              newRow[key] = val;
          }
      });
      return newRow;
  });

  const csv = Papa.unparse(flattenedData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

/**
 * Export data to Excel
 */
export const exportToExcel = (data: any[], filename: string) => {
  // Flatten data similar to CSV
  const flattenedData = data.map(row => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
          const val = row[key];
           if (typeof val === 'object' && val !== null) {
              if (val.value) newRow[key] = val.value;
              else newRow[key] = JSON.stringify(val);
          } else {
              newRow[key] = val;
          }
      });
      return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};
