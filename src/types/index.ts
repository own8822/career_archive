export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
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
  cohort: string; // e.g. "7기", "8기"
  records: CounselingRecord[];
  createdAt: string;
}
