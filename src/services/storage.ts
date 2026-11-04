import { Student, CounselingRecord, AuthSettings, AccessCodeMeta, StudentAttachment } from '../types';
import { getSupabase, isSupabaseConfigured, setSessionToken, getSessionToken } from './supabase';
import { generateAttachmentThumbnail } from '../utils/pdfThumbnail';

export const SUPPORTED_ATTACHMENT_EXTENSIONS = [
  'pdf',
  'hwp',
  'hwpx',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'doc',
  'docx',
];

export function isSupportedAttachment(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return SUPPORTED_ATTACHMENT_EXTENSIONS.includes(ext);
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DB_NAME = 'CareerArchiveDB_v2';
const DB_VERSION = 1;
const STORE_NAME = 'students';
const AUTH_SETTINGS_KEY = 'career_archive_auth_settings_v3';

export const DEFAULT_AUTH_SETTINGS: AuthSettings = {
  adminCode: '',
  viewerCodes: [],
};

class LocalArchiveStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      // 기존 더미데이터가 포함된 레거시 DB 정리
      try {
        indexedDB.deleteDatabase('CareerArchiveDB');
      } catch {
        // ignore
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // ==========================================
  // Server-Side Code Verification & Session Auth
  // ==========================================
  async verifyAccessCode(code: string): Promise<{ success: boolean; role?: 'admin' | 'viewer'; message?: string }> {
    const trimmed = code.trim();
    if (!trimmed) {
      return { success: false, message: '접속 코드를 입력해주세요.' };
    }

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { data, error } = await client.rpc('authenticate_code', { p_code: trimmed });
          if (error) {
            console.error('Supabase authenticate_code error:', error);
            return {
              success: false,
              message: error.message || '서버 인증 중 오류가 발생했습니다.',
            };
          }
          if (data && data.success) {
            setSessionToken(data.session_token);
            return { success: true, role: data.role };
          }
          return { success: false, message: data?.message || '접속 코드가 올바르지 않습니다.' };
        } catch (e: any) {
          console.error('Supabase authenticate_code exception:', e);
          return { success: false, message: e?.message || '서버 접속 실패' };
        }
      }
    }

    // Local fallback when Supabase is not configured
    const local = await this.getLocalAuthSettings();
    if (trimmed === local.adminCode) {
      return { success: true, role: 'admin' };
    }
    if (local.viewerCodes.includes(trimmed)) {
      return { success: true, role: 'viewer' };
    }
    return { success: false, message: '접속 코드가 올바르지 않습니다.' };
  }

  async logoutRemote(): Promise<void> {
    const token = getSessionToken();
    if (token && isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          await client.rpc('logout_session', { p_token: token });
        } catch {
          // ignore
        }
      }
    }
    setSessionToken(null);
  }

  // ==========================================
  // Access Code Management (Admin Only, No Plaintext Leaks)
  // ==========================================
  async listAccessCodes(): Promise<AccessCodeMeta[]> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { data, error } = await client.rpc('admin_list_codes');
          if (!error && Array.isArray(data)) {
            return data.map((item: any) => ({
              id: item.id,
              codeType: item.code_type,
              codeName: item.code_name,
              createdAt: item.created_at,
              revokedAt: item.revoked_at,
              isActive: item.is_active,
            }));
          }
        } catch (e) {
          console.warn('Remote admin_list_codes failed:', e);
        }
      }
    }

    // Local fallback list
    const local = await this.getLocalAuthSettings();
    const list: AccessCodeMeta[] = [
      {
        id: 'local-admin',
        codeType: 'admin',
        codeName: '로컬 관리자 마스터',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ];
    local.viewerCodes.forEach((code, idx) => {
      list.push({
        id: `local-viewer-${idx + 1}`,
        codeType: 'viewer',
        codeName: `열람자 ${idx + 1}호 (${code.substring(0, 3)}***)`,
        createdAt: new Date().toISOString(),
        isActive: true,
      });
    });
    return list;
  }

  async issueViewerCode(
    code: string,
    name: string
  ): Promise<{ success: boolean; id?: string; message?: string }> {
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      return { success: false, message: '코드는 최소 6자 이상 입력해주세요.' };
    }
    if (!trimmedName) {
      return { success: false, message: '코드 식별 이름을 입력해주세요.' };
    }

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { data, error } = await client.rpc('admin_issue_viewer_code', {
            p_code: trimmedCode,
            p_name: trimmedName,
          });
          if (error) {
            return { success: false, message: error.message };
          }
          if (data && data.success) {
            return { success: true, id: data.id };
          }
          return { success: false, message: data?.message || '발급 실패' };
        } catch (e: any) {
          return { success: false, message: e?.message || '서버 오류' };
        }
      }
    }

    // Local fallback
    const local = await this.getLocalAuthSettings();
    if (!local.viewerCodes.includes(trimmedCode)) {
      local.viewerCodes.push(trimmedCode);
      await this.saveAuthSettings(local);
    }
    return { success: true, id: `local-${Date.now()}` };
  }

  async revokeCode(codeId: string): Promise<{ success: boolean; message?: string }> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { data, error } = await client.rpc('admin_revoke_code', {
            p_code_id: codeId,
          });
          if (error) {
            return { success: false, message: error.message };
          }
          return { success: data?.success ?? true };
        } catch (e: any) {
          return { success: false, message: e?.message || '서버 오류' };
        }
      }
    }

    // Local fallback
    const local = await this.getLocalAuthSettings();
    const matchIdx = local.viewerCodes.findIndex((_, idx) => `local-viewer-${idx + 1}` === codeId);
    if (matchIdx >= 0) {
      local.viewerCodes.splice(matchIdx, 1);
      await this.saveAuthSettings(local);
    }
    return { success: true };
  }

  async rotateAdminCode(
    oldCode: string,
    newCode: string
  ): Promise<{ success: boolean; message?: string }> {
    const trimmedOld = oldCode.trim();
    const trimmedNew = newCode.trim();
    if (!trimmedOld || !trimmedNew) {
      return { success: false, message: '기존 및 신규 코드를 모두 입력해주세요.' };
    }
    if (trimmedNew.length < 8) {
      return { success: false, message: '신규 관리자 코드는 최소 8자 이상이어야 합니다.' };
    }

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { data, error } = await client.rpc('admin_rotate_code', {
            p_old_code: trimmedOld,
            p_new_code: trimmedNew,
          });
          if (error) {
            return { success: false, message: error.message };
          }
          if (data && data.success) {
            if (data.new_session_token) {
              setSessionToken(data.new_session_token);
            }
            return { success: true };
          }
          return { success: false, message: data?.message || '교체 실패' };
        } catch (e: any) {
          return { success: false, message: e?.message || '서버 오류' };
        }
      }
    }

    // Local fallback
    const local = await this.getLocalAuthSettings();
    if (local.adminCode !== trimmedOld) {
      return { success: false, message: '기존 관리자 코드가 일치하지 않습니다.' };
    }
    local.adminCode = trimmedNew;
    await this.saveAuthSettings(local);
    return { success: true };
  }

  async getLocalAuthSettings(): Promise<AuthSettings> {
    try {
      const raw = localStorage.getItem(AUTH_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.adminCode && Array.isArray(parsed.viewerCodes) && parsed.viewerCodes.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local auth settings', e);
    }
    return DEFAULT_AUTH_SETTINGS;
  }

  async getAuthSettings(): Promise<AuthSettings> {
    return this.getLocalAuthSettings();
  }

  async saveAuthSettings(settings: AuthSettings): Promise<void> {
    localStorage.setItem(AUTH_SETTINGS_KEY, JSON.stringify(settings));
  }

  // ==========================================
  // Attachments (Secure Server Mediated)
  // ==========================================
  async deleteAttachmentSecure(attachmentId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { data, error } = await client.rpc('delete_attachment_secure', {
            p_attachment_id: attachmentId,
          });
          return !error && (data?.success ?? true);
        } catch {
          return false;
        }
      }
    }
    return true;
  }

  // ==========================================
  // Student Attachments (Supabase Storage + DB)
  // ==========================================
  async uploadStudentAttachment(
    studentId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<StudentAttachment> {
    if (!isSupportedAttachment(file.name)) {
      throw new Error('지원하지 않는 파일 형식입니다. (지원 형식: PDF, HWP, HWPX, PNG, JPG, DOC, DOCX)');
    }

    const MAX_BYTES = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_BYTES) {
      throw new Error('파일 크기 한도 초과: 첨부파일은 최대 25MB까지만 업로드할 수 있습니다.');
    }

    onProgress?.(10);

    // 1. 썸네일 및 dataUrl 생성
    let dataUrl = '';
    let thumbnailUrl = '';
    try {
      const res = await generateAttachmentThumbnail(file);
      dataUrl = res.dataUrl;
      thumbnailUrl = res.thumbnailUrl;
    } catch (thumbErr) {
      console.warn('Thumbnail generation warning:', thumbErr);
    }

    onProgress?.(30);

    const cleanExt = file.name.split('.').pop() || 'bin';
    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\-\uAC00-\uD7A3]/g, '_');
    const uniqueId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // 같은 이름의 파일을 올려도 기존 파일을 덮어쓰지 않도록 타임스탬프와 난수 추가
    const storagePath = `${studentId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeBaseName}.${cleanExt}`;
    const fileSizeFormatted = formatAttachmentSize(file.size);
    const nowIso = new Date().toISOString();
    const dateFormatted = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .replace(/\. /g, '.')
      .replace(/\.$/, '');

    let storageUploadSuccess = false;

    // 2. Supabase Storage 비공개 버킷 업로드
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          onProgress?.(50);
          const { error: storageError } = await client.storage
            .from('student-files')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!storageError) {
            storageUploadSuccess = true;
          } else {
            console.warn('Supabase Storage upload warning (fallback to DB):', storageError.message);
          }
        } catch (stErr) {
          console.warn('Supabase Storage exception (fallback to DB):', stErr);
        }

        onProgress?.(70);

        // 3. Supabase DB 메타데이터 등록 (RPC 및 테이블)
        try {
          const payloadData = (!storageUploadSuccess || file.size < 2 * 1024 * 1024) ? dataUrl : null;
          const { error: rpcError } = await client.rpc('upload_student_attachment_secure', {
            p_id: uniqueId,
            p_student_id: studentId,
            p_file_name: file.name,
            p_file_size: fileSizeFormatted,
            p_file_bytes: file.size,
            p_mime_type: file.type || 'application/octet-stream',
            p_storage_path: storagePath,
            p_file_data: payloadData,
          });

          if (rpcError) {
            console.warn('upload_student_attachment_secure RPC warning, trying direct insert:', rpcError.message);
            const { error: insertError } = await client.from('student_attachments').insert({
              id: uniqueId,
              student_id: studentId,
              file_name: file.name,
              file_size: fileSizeFormatted,
              file_bytes: file.size,
              mime_type: file.type || 'application/octet-stream',
              storage_path: storagePath,
              file_data: payloadData,
              created_at: nowIso,
            });
            if (insertError && !storageUploadSuccess) {
              throw new Error(`파일 메타데이터 저장 실패: ${insertError.message}`);
            }
          }
        } catch (dbErr: any) {
          console.error('Database record save error:', dbErr);
          if (!storageUploadSuccess) {
            throw new Error(`서버 저장 실패: ${dbErr?.message || '알 수 없는 오류'}`);
          }
        }
      }
    }

    onProgress?.(90);

    const newAttachment: StudentAttachment = {
      id: uniqueId,
      studentId,
      fileName: file.name,
      fileSize: fileSizeFormatted,
      fileBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      storagePath,
      dataUrl,
      thumbnailUrl,
      uploadedAt: dateFormatted,
    };

    // 4. 로컬 IndexedDB 캐시 업데이트
    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(studentId);
      getReq.onsuccess = () => {
        const student = getReq.result as Student | undefined;
        if (student) {
          student.attachments = [newAttachment, ...(student.attachments || [])];
          store.put(student);
          resolve();
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });

    onProgress?.(100);
    return newAttachment;
  }

  async deleteStudentAttachment(
    studentId: string,
    attachmentId: string,
    storagePath?: string
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { data, error } = await client.rpc('delete_student_attachment_secure', {
            p_attachment_id: attachmentId,
          });
          const pathToDelete = data?.storage_path || storagePath;
          if (pathToDelete) {
            try {
              await client.storage.from('student-files').remove([pathToDelete]);
            } catch {
              // ignore
            }
          }
          if (error) {
            await client.from('student_attachments').delete().eq('id', attachmentId);
            if (storagePath) {
              await client.storage.from('student-files').remove([storagePath]);
            }
          }
        } catch (e) {
          console.warn('Remote deleteStudentAttachment warning:', e);
        }
      }
    }

    // 로컬 IndexedDB 반영
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(studentId);
      getReq.onsuccess = () => {
        const student = getReq.result as Student | undefined;
        if (student && student.attachments) {
          student.attachments = student.attachments.filter((a) => a.id !== attachmentId);
          store.put(student);
          resolve(true);
        } else {
          resolve(true);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async getAttachmentDownloadUrl(attachment: StudentAttachment): Promise<string> {
    if (attachment.dataUrl && (attachment.dataUrl.startsWith('data:') || attachment.dataUrl.startsWith('blob:'))) {
      return attachment.dataUrl;
    }

    if (isSupabaseConfigured() && attachment.storagePath) {
      const client = getSupabase();
      if (client) {
        try {
          // 1. Signed URL 생성 시도 (1시간 유효)
          const { data: signData, error: signError } = await client.storage
            .from('student-files')
            .createSignedUrl(attachment.storagePath, 3600);
          if (!signError && signData?.signedUrl) {
            return signData.signedUrl;
          }

          // 2. 직접 바이너리 다운로드 시도
          const { data: blobData, error: downloadError } = await client.storage
            .from('student-files')
            .download(attachment.storagePath);
          if (!downloadError && blobData) {
            return URL.createObjectURL(blobData);
          }
        } catch (err) {
          console.warn('Storage download failed, falling back to DB RPC:', err);
        }

        // 3. DB RPC 폴백
        try {
          const { data: rpcData, error: rpcError } = await client.rpc('get_student_attachment_secure', {
            p_attachment_id: attachment.id,
          });
          if (!rpcError && rpcData?.attachment?.file_data) {
            return rpcData.attachment.file_data;
          }
        } catch (rpcErr) {
          console.warn('RPC fetch failed:', rpcErr);
        }
      }
    }

    if (attachment.dataUrl) return attachment.dataUrl;
    throw new Error('파일 데이터를 불러올 수 없습니다.');
  }

  async downloadStudentAttachment(attachment: StudentAttachment): Promise<void> {
    const url = await this.getAttachmentDownloadUrl(attachment);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ==========================================
  // Students & Records
  // ==========================================
  async getAllStudents(): Promise<Student[]> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { data: studentsData, error: sError } = await client
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });

          if (sError) {
            console.error('Supabase students fetch error:', sError);
            throw sError;
          }

          if (studentsData) {
            const { data: recordsData, error: rError } = await client
              .from('records')
              .select('*')
              .order('created_at', { ascending: false });

            if (rError) {
              console.error('Supabase records fetch error:', rError);
              throw rError;
            }

            // 학생별 첨부파일 조회 (테이블이 아직 생성되지 않은 경우 예외 방어)
            let attachmentsData: any[] = [];
            try {
              const { data: aData, error: aError } = await client
                .from('student_attachments')
                .select('*')
                .order('created_at', { ascending: false });
              if (!aError && Array.isArray(aData)) {
                attachmentsData = aData;
              }
            } catch (aErr) {
              console.warn('student_attachments fetch warning (migration may be pending):', aErr);
            }

            // 기존 로컬 캐시 확인 (첨부파일 캐시 보존용)
            const localCachedList = await this.getLocalStudentsOnly().catch(() => []);
            const localCacheMap = new Map<string, Student>();
            localCachedList.forEach((s) => localCacheMap.set(s.id, s));

            // Supabase에 데이터가 있으면 안전하게 결합하여 반환
            if (studentsData.length > 0) {
              const combined: Student[] = studentsData.map((s) => {
                const localStudent = localCacheMap.get(s.id);
                const studentRecords = (recordsData || [])
                  .filter((r) => r.student_id === s.id)
                  .map((r) => ({
                    id: r.id,
                    studentId: r.student_id,
                    date: r.date,
                    title: r.title,
                    content: r.content,
                    pdfs: Array.isArray(r.pdfs) ? r.pdfs : [],
                  }));

                // DB에서 불러온 첨부파일
                const remoteAttachments: StudentAttachment[] = attachmentsData
                  .filter((a) => a.student_id === s.id)
                  .map((a) => {
                    const localAtt = (localStudent?.attachments || []).find((la) => la.id === a.id);
                    return {
                      id: a.id,
                      studentId: a.student_id,
                      fileName: a.file_name,
                      fileSize: a.file_size,
                      fileBytes: Number(a.file_bytes) || 0,
                      mimeType: a.mime_type,
                      storagePath: a.storage_path,
                      dataUrl: a.file_data || localAtt?.dataUrl || '',
                      thumbnailUrl: localAtt?.thumbnailUrl,
                      uploadedAt: a.created_at
                        ? new Date(a.created_at)
                            .toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })
                            .replace(/\. /g, '.')
                            .replace(/\.$/, '')
                        : localAtt?.uploadedAt || '',
                    };
                  });

                // 원격 데이터가 없으면 로컬 캐시 첨부파일 유지
                const finalAttachments =
                  remoteAttachments.length > 0
                    ? remoteAttachments
                    : localStudent?.attachments || [];

                return {
                  id: s.id,
                  name: s.name,
                  cohort: s.cohort,
                  createdAt: s.created_at,
                  orderNo: s.order_no != null ? String(s.order_no) : '',
                  birthYear: s.birth_year != null ? String(s.birth_year) : '',
                  phone: s.phone || '',
                  email: s.email || '',
                  university: s.university || '',
                  major1: s.major1 || '',
                  major2: s.major2 || '',
                  memo: s.memo || '',
                  records: studentRecords,
                  attachments: finalAttachments,
                };
              });

              // 로컬 캐시 동기화
              try {
                await this.saveAllStudentsLocal(combined);
              } catch (cacheErr) {
                console.warn('Local cache update skipped:', cacheErr);
              }

              return combined;
            }

            // Supabase에 데이터가 아직 없고 현재 세션이 관리자(admin)인 경우,
            // 로컬에 등록된 학생 데이터를 Supabase 클라우드로 자동 동기화 시도
            const currentRole = sessionStorage.getItem('career_archive_active_role');
            if (currentRole === 'admin') {
              const localStudents = await this.getLocalStudentsOnly();
              if (localStudents.length > 0) {
                console.log(`[Admin] Supabase에 데이터가 없어 로컬 ${localStudents.length}명 데이터를 자동 동기화합니다.`);
                try {
                  await this.seedSupabase(localStudents);
                } catch (seedErr) {
                  console.error('Supabase auto-seed failed:', seedErr);
                }
                return localStudents;
              }
            }

            return [];
          }
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to local IndexedDB', err);
        }
      }
    }

    // Local IndexedDB fallback
    return this.getLocalStudentsOnly();
  }

  async getLocalStudentsOnly(): Promise<Student[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = async () => {
        const result = req.result as Student[];
        resolve(result || []);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async seedSupabase(students: Student[]): Promise<void> {
    const client = getSupabase();
    if (!client) return;

    for (const s of students) {
      const studentPayload = {
        id: s.id,
        name: s.name,
        cohort: s.cohort,
        order_no: s.orderNo != null ? String(s.orderNo) : null,
        birth_year: s.birthYear != null ? String(s.birthYear) : null,
        phone: s.phone || null,
        email: s.email || null,
        university: s.university || null,
        major1: s.major1 || null,
        major2: s.major2 || null,
        memo: s.memo || null,
        created_at: s.createdAt || new Date().toISOString(),
      };

      const { error: sErr } = await client.from('students').upsert(studentPayload);
      if (sErr) {
        console.error('Supabase student upsert failed:', sErr, studentPayload);
        throw sErr;
      }

      for (const r of s.records) {
        const recordPayload = {
          id: r.id,
          student_id: s.id,
          date: r.date,
          title: r.title,
          content: r.content,
          pdfs: r.pdfs || [],
          created_at: new Date().toISOString(),
        };
        const { error: rErr } = await client.from('records').upsert(recordPayload);
        if (rErr) {
          console.error('Supabase record upsert failed:', rErr, recordPayload);
          throw rErr;
        }
      }
    }
  }

  async saveAllStudentsLocal(students: Student[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const s of students) {
        store.put(s);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async addStudent(student: Student): Promise<void> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const studentPayload = {
            id: student.id,
            name: student.name,
            cohort: student.cohort,
            order_no: student.orderNo != null ? String(student.orderNo) : null,
            birth_year: student.birthYear != null ? String(student.birthYear) : null,
            phone: student.phone || null,
            email: student.email || null,
            university: student.university || null,
            major1: student.major1 || null,
            major2: student.major2 || null,
            memo: student.memo || null,
            created_at: new Date().toISOString(),
          };
          const { error } = await client.from('students').insert(studentPayload);
          if (error) {
            console.error('Supabase addStudent error:', error);
          }
        } catch (e) {
          console.error('Supabase addStudent failed:', e);
        }
      }
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(student);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async updateStudent(
    studentId: string,
    updates: Partial<Omit<Student, 'id' | 'records' | 'createdAt'>> | string,
    legacyCohort?: string
  ): Promise<void> {
    const updateObj: Partial<Student> =
      typeof updates === 'string'
        ? { name: updates, cohort: legacyCohort }
        : updates;

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const payload: Record<string, any> = {};
          if (updateObj.name !== undefined) payload.name = updateObj.name;
          if (updateObj.cohort !== undefined) payload.cohort = updateObj.cohort;
          if (updateObj.phone !== undefined) payload.phone = updateObj.phone;
          if (updateObj.email !== undefined) payload.email = updateObj.email;
          if (updateObj.university !== undefined) payload.university = updateObj.university;
          if (updateObj.major1 !== undefined) payload.major1 = updateObj.major1;
          if (updateObj.major2 !== undefined) payload.major2 = updateObj.major2;
          if (updateObj.birthYear !== undefined) payload.birth_year = updateObj.birthYear != null ? String(updateObj.birthYear) : null;
          if (updateObj.orderNo !== undefined) payload.order_no = updateObj.orderNo != null ? String(updateObj.orderNo) : null;
          if (updateObj.memo !== undefined) payload.memo = updateObj.memo;

          const { error } = await client
            .from('students')
            .update(payload)
            .eq('id', studentId);
          if (error) {
            console.error('Supabase updateStudent error:', error);
          }
        } catch (e) {
          console.error('Supabase updateStudent failed:', e);
        }
      }
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(studentId);

      getReq.onsuccess = () => {
        const student = getReq.result as Student | undefined;
        if (student) {
          Object.assign(student, updateObj);
          store.put(student);
          resolve();
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async saveStudentsBatch(students: Student[]): Promise<void> {
    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const s of students) {
        store.put(s);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          await this.seedSupabase(students);
        } catch (e) {
          console.error('Supabase batch save error:', e);
        }
      }
    }
  }

  async deleteStudent(studentId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { error } = await client.from('students').delete().eq('id', studentId);
          if (error) console.error('Supabase deleteStudent error:', error);
        } catch (e) {
          console.error('Supabase deleteStudent exception:', e);
        }
      }
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(studentId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async addRecord(studentId: string, record: CounselingRecord): Promise<void> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { error } = await client.from('records').insert({
            id: record.id,
            student_id: studentId,
            date: record.date,
            title: record.title,
            content: record.content,
            pdfs: record.pdfs || [],
            created_at: new Date().toISOString(),
          });
          if (error) console.error('Supabase addRecord error:', error);
        } catch (e) {
          console.error('Supabase addRecord exception:', e);
        }
      }
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(studentId);

      getReq.onsuccess = () => {
        const student = getReq.result as Student | undefined;
        if (student) {
          student.records = [record, ...student.records];
          store.put(student);
          resolve();
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async updateRecord(studentId: string, updatedRecord: CounselingRecord): Promise<void> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          await client
            .from('records')
            .update({
              date: updatedRecord.date,
              title: updatedRecord.title,
              content: updatedRecord.content,
              pdfs: updatedRecord.pdfs || [],
            })
            .eq('id', updatedRecord.id);
        } catch (e) {
          console.error('Supabase updateRecord failed:', e);
        }
      }
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(studentId);

      getReq.onsuccess = () => {
        const student = getReq.result as Student | undefined;
        if (student) {
          student.records = student.records.map((r) =>
            r.id === updatedRecord.id ? updatedRecord : r
          );
          store.put(student);
          resolve();
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async deleteRecord(studentId: string, recordId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          await client.from('records').delete().eq('id', recordId);
        } catch (e) {
          console.error('Supabase deleteRecord error:', e);
        }
      }
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(studentId);

      getReq.onsuccess = () => {
        const student = getReq.result as Student | undefined;
        if (student) {
          student.records = student.records.filter((r) => r.id !== recordId);
          store.put(student);
          resolve();
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // ==========================================
  // Backup & Restore & Migration Utilities
  // ==========================================
  async exportBackupJson(): Promise<string> {
    const students = await this.getLocalStudentsOnly();
    const auth = await this.getAuthSettings();
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      auth,
      students,
    };
    return JSON.stringify(backupData, null, 2);
  }

  async importBackupJson(jsonString: string): Promise<Student[]> {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.students)) {
      throw new Error('올바른 백업 파일 형식이 아닙니다.');
    }
    await this.saveAllStudentsLocal(parsed.students);
    if (parsed.auth) {
      await this.saveAuthSettings(parsed.auth);
    }

    // If supabase connected, sync to supabase as well
    if (isSupabaseConfigured()) {
      await this.seedSupabase(parsed.students);
      if (parsed.auth) {
        await this.saveAuthSettings(parsed.auth);
      }
    }

    return parsed.students;
  }

  async syncLocalToSupabase(): Promise<number> {
    if (!isSupabaseConfigured()) {
      throw new Error('수파베이스가 .env에 설정되지 않았습니다.');
    }
    const localStudents = await this.getLocalStudentsOnly();
    await this.seedSupabase(localStudents);
    const auth = await this.getAuthSettings();
    await this.saveAuthSettings(auth);
    return localStudents.length;
  }
}

export const archiveStorage = new LocalArchiveStorage();
