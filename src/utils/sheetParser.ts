import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParsedStudentRow {
  cohort: string;
  orderNo?: string | number;
  name: string;
  birthYear?: string;
  phone?: string;
  email?: string;
  university?: string;
  major1?: string;
  major2?: string;
  memo?: string;
  isValid: boolean;
  error?: string;
  raw: Record<string, any>;
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

// Phone number normalizer
export function normalizePhone(rawPhone: string | number | undefined): string {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^\d]/g, '');
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith('01')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 10 && digits.startsWith('10')) {
    return `0${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return String(rawPhone).trim();
}

type ColumnRole =
  | 'cohort'
  | 'orderNo'
  | 'name'
  | 'birthYear'
  | 'phone'
  | 'email'
  | 'university'
  | 'major1'
  | 'major2'
  | 'memo'
  | 'unknown';

function detectColumnRole(headerName: string): ColumnRole {
  const h = headerName.trim().toLowerCase().replace(/[\s_\-.]/g, '');
  if (!h) return 'unknown';

  if (/^(기수|코호트|기|cohort)$/i.test(h) || h.includes('기수')) return 'cohort';
  if (/^(연번|순번|번호|no|id|순서)$/i.test(h) || h.includes('연번')) return 'orderNo';
  if (/^(성명|이름|학생|학생명|성함|성명\(이름\)|name)$/i.test(h) || h.includes('성명') || h.includes('이름')) return 'name';
  if (/^(생년|생년월일|출생|출생년도|출생연도|나이|생일|birth|birthyear)$/i.test(h) || h.includes('생년') || h.includes('생년월일')) return 'birthYear';
  if (/^(휴대폰|핸드폰|전화|전화번호|연락처|모바일|hp|phone|tel|mobile)$/i.test(h) || h.includes('휴대폰') || h.includes('연락처') || h.includes('전화')) return 'phone';
  if (/^(메일|이메일|email|mail|e-mail)$/i.test(h) || h.includes('메일') || h.includes('이메일')) return 'email';
  if (/^(학교|대학교|대학|출신교|출신대학|univ|university|school)$/i.test(h) || h.includes('대학교') || h.includes('학교')) return 'university';
  if (/^(학과1|학과|전공1|전공|주전공|major1|major)$/i.test(h) || h.includes('학과1') || h.includes('주전공')) return 'major1';
  if (/^(학과2|전공2|복수전공|부전공|이중전공|major2)$/i.test(h) || h.includes('학과2') || h.includes('복수전공') || h.includes('부전공')) return 'major2';
  if (/^(비고|메모|참고|비고사항|note|memo)$/i.test(h) || h.includes('비고') || h.includes('메모')) return 'memo';

  return 'unknown';
}

// 2D Array to Parsed Rows
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
  const hasRecognizedHeader = recognizedRoles.some(
    (role) => role === 'name' || role === 'cohort' || role === 'phone' || role === 'orderNo'
  );

  let columnMapping: ColumnRole[] = [];
  let dataRows: any[][] = [];

  if (hasRecognizedHeader) {
    columnMapping = recognizedRoles;
    dataRows = cleanRows.slice(1);
  } else {
    // Default positional mapping based on user's spec:
    // [기수, 연번, 성명, 생년, 휴대폰, 메일, 학교, 학과1, 학과2]
    columnMapping = [
      'cohort',
      'orderNo',
      'name',
      'birthYear',
      'phone',
      'email',
      'university',
      'major1',
      'major2',
      'memo',
    ];
    dataRows = cleanRows;
  }

  // Parse each row
  return dataRows.map((row) => {
    const raw: Record<string, any> = {};
    const studentData: Partial<ParsedStudentRow> = {
      cohort: defaultCohort,
      isValid: true,
    };

    row.forEach((cell, idx) => {
      const val = cell !== undefined && cell !== null ? String(cell).trim() : '';
      const role = columnMapping[idx] || 'unknown';
      const headerKey = firstRow[idx] || `col_${idx + 1}`;
      raw[headerKey] = val;

      switch (role) {
        case 'cohort':
          studentData.cohort = normalizeCohort(val, defaultCohort);
          break;
        case 'orderNo':
          studentData.orderNo = val;
          break;
        case 'name':
          studentData.name = val;
          break;
        case 'birthYear':
          studentData.birthYear = val;
          break;
        case 'phone':
          studentData.phone = normalizePhone(val);
          break;
        case 'email':
          studentData.email = val;
          break;
        case 'university':
          studentData.university = val;
          break;
        case 'major1':
          studentData.major1 = val;
          break;
        case 'major2':
          studentData.major2 = val;
          break;
        case 'memo':
          studentData.memo = val;
          break;
      }
    });

    if (!studentData.name) {
      studentData.isValid = false;
      studentData.error = '성명(이름)이 없습니다.';
    }

    if (!studentData.cohort) {
      studentData.cohort = defaultCohort;
    }

    return {
      cohort: studentData.cohort || defaultCohort,
      orderNo: studentData.orderNo,
      name: studentData.name || '',
      birthYear: studentData.birthYear,
      phone: studentData.phone,
      email: studentData.email,
      university: studentData.university,
      major1: studentData.major1,
      major2: studentData.major2,
      memo: studentData.memo,
      isValid: studentData.isValid ?? true,
      error: studentData.error,
      raw,
    };
  });
}

// Parse text copied from Google Sheets / Excel (Tab or Comma delimited)
export function parsePastedText(text: string, defaultCohort = '디금융 8기'): ParsedStudentRow[] {
  if (!text || !text.trim()) return [];

  // Determine delimiter: Google Sheets copy is always tab '\t', CSV is ','
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
      // Update existing student's roster info while keeping counseling records intact!
      existing.orderNo = row.orderNo || existing.orderNo;
      existing.birthYear = row.birthYear || existing.birthYear;
      existing.phone = row.phone || existing.phone;
      existing.email = row.email || existing.email;
      existing.university = row.university || existing.university;
      existing.major1 = row.major1 || existing.major1;
      existing.major2 = row.major2 || existing.major2;
      existing.memo = row.memo || existing.memo;
      updatedCount++;
    } else {
      // Create new student
      const newStudent: Student = {
        id: `std-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: row.name.trim(),
        cohort: row.cohort,
        orderNo: row.orderNo,
        birthYear: row.birthYear,
        phone: row.phone,
        email: row.email,
        university: row.university,
        major1: row.major1,
        major2: row.major2,
        memo: row.memo,
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
