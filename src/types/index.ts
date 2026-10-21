export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface PdfAttachment {
  id: string;
  title: string;
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  previewSnippet: string;
}

export interface CounselingRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string; // 긴 상담 및 첨삭 내용 (접기/펼치기 대상)
  pdf?: PdfAttachment;
}

export interface Student {
  id: string;
  name: string;
  cohort: string; // e.g. "7기", "8기"
  records: CounselingRecord[];
  createdAt: string;
}
