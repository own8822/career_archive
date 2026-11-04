import { Student, CounselingRecord, AuthSettings, AccessCodeMeta } from '../types';
import { getSupabase, isSupabaseConfigured, setSessionToken, getSessionToken } from './supabase';

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

            // Supabase에 데이터가 있으면 안전하게 결합하여 반환
            if (studentsData.length > 0) {
              const combined: Student[] = studentsData.map((s) => {
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
