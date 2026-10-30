import { Student, CounselingRecord, AuthSettings } from '../types';
import { getSupabase, isSupabaseConfigured, setSessionToken, getSessionToken } from './supabase';

const DB_NAME = 'CareerArchiveDB_v2';
const DB_VERSION = 1;
const STORE_NAME = 'students';
const AUTH_SETTINGS_KEY = 'career_archive_auth_settings_v3';

export const DEFAULT_AUTH_SETTINGS: AuthSettings = {
  adminCode: 'admin123123',
  viewerCodes: [
    'ubion0112',
    'ubion0212',
    'ubion0312',
    'ubion0412',
    'ubion0512',
    'ubion0612',
    'ubion0712',
    'ubion0812',
    'ubion0912',
    'ubion1012',
  ],
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
  // Server-Side Code Verification & Auth
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
            return { success: false, message: '서버 인증 중 오류가 발생했습니다.' };
          }
          if (data && data.success) {
            setSessionToken(data.session_token);
            return { success: true, role: data.role };
          }
          return { success: false, message: data?.message || '접속 코드가 올바르지 않습니다.' };
        } catch (e) {
          console.error('Supabase authenticate_code exception:', e);
          return { success: false, message: '서버 접속 실패' };
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
          await client.rpc('invalidate_session', { p_token: token });
        } catch (e) {
          // ignore
        }
      }
    }
    setSessionToken(null);
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
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { data, error } = await client.rpc('get_auth_codes_secure');
          if (!error && data) {
            return {
              adminCode: data.adminCode,
              viewerCodes: Array.isArray(data.viewerCodes) ? data.viewerCodes : DEFAULT_AUTH_SETTINGS.viewerCodes,
            };
          }
        } catch (e) {
          console.warn('Remote get_auth_codes_secure failed (viewer or unauthenticated):', e);
        }
      }
    }

    return this.getLocalAuthSettings();
  }

  async saveAuthSettings(settings: AuthSettings): Promise<void> {
    localStorage.setItem(AUTH_SETTINGS_KEY, JSON.stringify(settings));

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          await client.rpc('update_auth_codes_secure', {
            p_admin_code: settings.adminCode,
            p_viewer_codes: settings.viewerCodes,
          });
        } catch (e) {
          console.error('Remote update_auth_codes_secure failed:', e);
        }
      }
    }
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

          if (sError) throw sError;

          if (studentsData) {
            const { data: recordsData, error: rError } = await client
              .from('records')
              .select('*')
              .order('created_at', { ascending: false });

            if (rError) throw rError;

            if (studentsData.length === 0) {
              // Check if local has data to migrate
              const localStudents = await this.getLocalStudentsOnly();
              if (localStudents.length > 0) {
                await this.seedSupabase(localStudents);
                return localStudents;
              }
              return [];
            }

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
                orderNo: s.order_no ?? s.orderNo,
                birthYear: s.birth_year ?? s.birthYear,
                phone: s.phone,
                email: s.email,
                university: s.university,
                major1: s.major1,
                major2: s.major2,
                memo: s.memo,
                records: studentRecords,
              };
            });

            return combined;
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
      await client.from('students').upsert({
        id: s.id,
        name: s.name,
        cohort: s.cohort,
        order_no: s.orderNo,
        birth_year: s.birthYear,
        phone: s.phone,
        email: s.email,
        university: s.university,
        major1: s.major1,
        major2: s.major2,
        memo: s.memo,
        created_at: s.createdAt || new Date().toISOString(),
      });
      for (const r of s.records) {
        await client.from('records').upsert({
          id: r.id,
          student_id: s.id,
          date: r.date,
          title: r.title,
          content: r.content,
          pdfs: r.pdfs || [],
          created_at: new Date().toISOString(),
        });
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
          await client.from('students').insert({
            id: student.id,
            name: student.name,
            cohort: student.cohort,
            order_no: student.orderNo,
            birth_year: student.birthYear,
            phone: student.phone,
            email: student.email,
            university: student.university,
            major1: student.major1,
            major2: student.major2,
            memo: student.memo,
            created_at: new Date().toISOString(),
          });
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
          if (updateObj.birthYear !== undefined) payload.birth_year = updateObj.birthYear;
          if (updateObj.orderNo !== undefined) payload.order_no = updateObj.orderNo;
          if (updateObj.memo !== undefined) payload.memo = updateObj.memo;

          await client
            .from('students')
            .update(payload)
            .eq('id', studentId);
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
          await client.from('students').delete().eq('id', studentId);
        } catch (e) {
          console.error('Supabase deleteStudent error:', e);
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
          await client.from('records').insert({
            id: record.id,
            student_id: studentId,
            date: record.date,
            title: record.title,
            content: record.content,
            pdfs: record.pdfs || [],
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.error('Supabase addRecord failed:', e);
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
