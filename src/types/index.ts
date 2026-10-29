export type UserRole = 'admin' | 'viewer' | null;

export interface AuthSettings {
  adminCode: string;
  viewerCodes: string[]; // ubion0112 ~ ubion1012
}

export interface PdfAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  dataUrl: string; // Base64 data URL or Blob URL for full viewing and downloading
  thumbnailUrl?: string; // Rendered image data URL of page 1
  pageCount?: number;
}

export interface CounselingRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string; // 긴 상담 및 첨삭 내용 (줄바꿈 보존)
  pdfs: PdfAttachment[]; // 여러 개 PDF 첨부 지원
}

export interface Student {
  id: string;
  name: string;
  cohort: string; // e.g. "디금융 1기", "디금융 8기"
  records: CounselingRecord[];
  createdAt: string;

  // 구글 시트 / 엑셀 명부 연동 인적사항
  orderNo?: string | number; // 연번
  birthYear?: string;        // 생년
  phone?: string;            // 휴대폰
  email?: string;            // 이메일
  university?: string;       // 학교
  major1?: string;           // 학과1 (주전공)
  major2?: string;           // 학과2 (복수/부전공)
  memo?: string;             // 비고 / 메모
  extra?: Record<string, any>;
}

export const PRESET_COHORTS = [
  '디금융 1기',
  '디금융 2기',
  '디금융 3기',
  '디금융 5기',
  '디금융 7기',
  '디금융 8기',
  '디금융 9기',
];
