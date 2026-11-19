import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParsedStudentRow {
  cohort: string;
  name: string;
  isValid: boolean;
  error?: string;
  raw?: Record<string, any>;
}

// Cohort normalizer: converts "1", "1기", "디금융1기" to "디금융 1기"
export function normalizeCohort(rawCohort: string | number | undefined, defaultCohort = '디금융 8기'): string {
  if (rawCohort === undefined || rawCohort === null) return defaultCohort;
  const str = String(rawCohort).trim();
  if (!str) return defaultCohort;

  // Single number like 1, 2, 8
  if (/^\d+$/.test(str)) {
    return `디금융 ${str}기`;
  }
  // Format like "1기", "8기"
  const m1 = str.match(/^(\d+)기$/);
  if (m1) {
    return `디금융 ${m1[1]}기`;
  }
  // Format like "디금융1기", "디금융 1기"
  const m2 = str.match(/^디금융\s*(\d+)기?$/);
  if (m2) {
    return `디금융 ${m2[1]}기`;
  }

  // If already ends with "기"
  if (str.endsWith('기')) {
    return str;
  }
  return `${str}기`;
}

type ColumnRole = 'cohort' | 'name' | 'ignore';

function detectColumnRole(headerName: string): ColumnRole {
  const h = headerName.trim().toLowerCase().replace(/[\s_\-.]/g, '');
  if (!h) return 'ignore';

  if (/^(기수|코호트|기|cohort)$/i.test(h) || h.includes('기수')) return 'cohort';
  if (/^(성명|이름|학생|학생명|성함|성명\(이름\)|name)$/i.test(h) || h.includes('성명') || h.includes('이름')) return 'name';

  return 'ignore';
}

// 2D Array to Parsed Rows (Extracts ONLY cohort and name for privacy protection)
export function parse2DArray(rows: any[][], defaultCohort = '디금융 8기'): ParsedStudentRow[] {
  if (!rows || rows.length === 0) return [];

  // Filter out completely empty rows
  const cleanRows = rows.filter(
    (row) => row && row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== '')
  );
  if (cleanRows.length === 0) return [];

  const firstRow = cleanRows[0].map((c) => String(c || '').trim());
  
  // Check if first row is header
  const recognizedRoles = firstRow.map((col) => detectColumnRole(col));
  const hasRecognizedHeader = recognizedRoles.some((role) => role === 'name' || role === 'cohort');

  let columnMapping: ColumnRole[] = [];
  let dataRows: any[][] = [];

  if (hasRecognizedHeader) {
    columnMapping = recognizedRoles;
    dataRows = cleanRows.slice(1);
  } else {
    // If no recognizable header:
    // If 1st column is cohort-like and 2nd or 3rd is name-like
    columnMapping = ['cohort', 'ignore', 'name'];
    dataRows = cleanRows;
  }

  // Parse each row
  return dataRows.map((row) => {
    let studentCohort = defaultCohort;
    let studentName = '';

    row.forEach((cell, idx) => {
      const val = cell !== undefined && cell !== null ? String(cell).trim() : '';
      const role = columnMapping[idx] || 'ignore';

      if (role === 'cohort' && val) {
        studentCohort = normalizeCohort(val, defaultCohort);
      } else if (role === 'name' && val) {
        studentName = val;
      }
    });

    // Fallback: If name was not caught by header mapping, look for Korean name pattern or non-empty string in columns
    if (!studentName) {
      for (let i = 0; i < row.length; i++) {
        const val = String(row[i] || '').trim();
        if (columnMapping[i] === 'cohort') continue;
        // Typical Korean name: 2-4 hangul characters, or non-numeric string
        if (/^[가-힣]{2,5}$/.test(val)) {
          studentName = val;
          break;
        }
      }
    }

    let isValid = true;
    let error: string | undefined;

    if (!studentName) {
      isValid = false;
      error = '성명(이름)이 없습니다.';
    }

    return {
      cohort: studentCohort || defaultCohort,
      name: studentName,
      isValid,
      error,
    };
  });
}

// Parse text copied from Google Sheets / Excel (Tab or Comma delimited)
export function parsePastedText(text: string, defaultCohort = '디금융 8기'): ParsedStudentRow[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = tabCount >= commaCount ? '\t' : ',';

  const rows: string[][] = lines.map((line) => {
    if (delimiter === '\t') {
      return line.split('\t');
    }
    // Simple CSV splitter handling quotes
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });

  return parse2DArray(rows, defaultCohort);
}

// Parse Excel / CSV file
export async function parseSpreadsheetFile(file: File, defaultCohort = '디금융 8기'): Promise<ParsedStudentRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  return parse2DArray(rows, defaultCohort);
}

// Convert parsed rows to Student domain objects
// Strips all PII: ONLY saves name, cohort, records, and createdAt
export function convertRowsToStudents(
  rows: ParsedStudentRow[],
  existingStudents: Student[] = []
): { newStudents: Student[]; updatedCount: number; createdCount: number } {
  const validRows = rows.filter((r) => r.isValid && r.name.trim());
  const today = new Date().toISOString().substring(0, 10);

  // Map of existing students by `cohort|name` for fast deduplication & record preservation
  const existingMap = new Map<string, Student>();
  existingStudents.forEach((s) => {
    const key = `${s.cohort.trim()}|${s.name.trim()}`;
    existingMap.set(key, s);
  });

  let createdCount = 0;
  let updatedCount = 0;

  const resultStudents: Student[] = [...existingStudents];

  validRows.forEach((row, idx) => {
    const key = `${row.cohort.trim()}|${row.name.trim()}`;
    const existing = existingMap.get(key);

    if (existing) {
      // Existing student: clean any legacy PII to ensure privacy
      existing.orderNo = undefined;
      existing.birthYear = undefined;
      existing.phone = undefined;
      existing.email = undefined;
      existing.university = undefined;
      existing.major1 = undefined;
      existing.major2 = undefined;
      existing.memo = undefined;
      updatedCount++;
    } else {
      // Create new student with ONLY name, cohort, records, createdAt
      const newStudent: Student = {
        id: `std-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: row.name.trim(),
        cohort: row.cohort,
        records: [],
        createdAt: today,
      };
      resultStudents.push(newStudent);
      existingMap.set(key, newStudent);
      createdCount++;
    }
  });

  return {
    newStudents: resultStudents,
    createdCount,
    updatedCount,
  };
}
