export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: 'login' | 'view_student' | 'view_pdf' | 'create_record' | 'delete_record' | 'create_student';
  targetInfo?: string;
  timestamp: string;
  ipAddress: string;
}

export interface PdfAttachment {
  id: string;
  title: string;
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  previewText?: string;
}

export interface CounselingRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD (자동 입력)
  title: string;
  content: string; // 긴 상담 및 첨삭 내용 (접기/펼치기 대상)
  pdf?: PdfAttachment; // 선택적 PDF 첨부
}

export interface Student {
  id: string;
  name: string;
  cohort: string; // e.g. "7기", "8기" (최초 등록 시 1회 입력)
  records: CounselingRecord[];
  createdAt: string;
}
