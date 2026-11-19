export type UserRole = 'admin' | 'viewer' | null;

export interface AccessCodeMeta {
  id: string;
  codeType: 'admin' | 'viewer';
  codeName: string;
  createdAt: string;
  revokedAt?: string | null;
  isActive: boolean;
}

export interface AuthSettings {
  adminCode: string;
  viewerCodes: string[];
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

export interface StudentAttachment {
  id: string;
  studentId: string;
  fileName: string;
  fileSize: string;
  fileBytes?: number;
  mimeType: string;
  storagePath?: string;
  dataUrl?: string;
  thumbnailUrl?: string;
  uploadedAt: string;
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
  name: string; // 학생 성명 (개인정보 최소화: 이름과 기수만 보관)
  cohort: string; // e.g. "디금융 1기", "디금융 8기"
  records: CounselingRecord[];
  attachments?: StudentAttachment[]; // 학생별 첨부파일 (PDF, 워드, 한글, 이미지 등)
  createdAt: string;
  isDropped?: boolean; // 수강취소 여부 (true일 경우 학생 박스 옅은 회색 전환)
  status?: string;

  // 개인정보 보호 조치로 아래 필드는 영구 제거됨 (하위 호환성용 optional)
  orderNo?: string | number;
  birthYear?: string;
  phone?: string;
  email?: string;
  university?: string;
  major1?: string;
  major2?: string;
  memo?: string;
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
