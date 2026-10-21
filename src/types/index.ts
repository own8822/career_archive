export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
  department: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: 'login' | 'view_student' | 'view_pdf' | 'create_record' | 'create_student' | 'export_data';
  targetInfo?: string;
  timestamp: string;
  ipAddress: string;
}

export type CounselingType = 'resume' | 'portfolio' | 'interview' | 'career' | 'general';

export interface PdfAnnotation {
  id: string;
  page: number;
  type: 'praise' | 'improve' | 'grammar' | 'question';
  quote: string;
  comment: string;
  author: string;
}

export interface PdfReview {
  id: string;
  title: string;
  originalFileName: string;
  fileSize: string;
  pageCount: number;
  uploadedAt: string;
  previewImageUrl?: string;
  summary: string;
  annotations: PdfAnnotation[];
}

export interface CounselingRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  counselorName: string;
  type: CounselingType;
  title: string;
  summary: string;
  content: string; // 긴 상담 내용 (접기/펼치기 대상)
  tags: string[];
  pdfReview?: PdfReview;
  actionItem?: string; // 학생 과제/후속 조치
}

export type EmploymentStatus = '준비중' | '서류전형' | '면접전형' | '최종합격' | '재직중';

export interface Student {
  id: string;
  name: string;
  cohort: string; // e.g. "5기", "6기"
  major?: string;
  targetRole: string; // e.g. "프론트엔드 개발자", "UI/UX 디자이너"
  targetCompanies: string[]; // e.g. ["당근", "토스", "라인"]
  status: EmploymentStatus;
  notes?: string;
  avatarColor: string;
  records: CounselingRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  searchKeyword: string;
  cohort: string; // 'all' or specific cohort
  targetRole: string; // 'all' or specific role
  counselingType: string; // 'all' or specific type
  status: string; // 'all' or specific status
}
