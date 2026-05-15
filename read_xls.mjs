import * as XLSX from '../colegio/node_modules/xlsx/xlsx.mjs';

import fs from 'fs';
const buf = fs.readFileSync('C:/Users/Gabriel/Desktop/dev/colegio-33/xls/ASISTENCIA DOCENTE - NOVIEMBRE 2025.xlsx');
const workbook = XLSX.read(buf);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
// Print first 20 rows
for(let i = 0; i < Math.min(20, data.length); i++) {
  console.log(data[i]);
}
