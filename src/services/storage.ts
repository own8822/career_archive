import { Student, CounselingRecord, AuthSettings } from '../types';
import { INITIAL_STUDENTS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from './supabase';

const DB_NAME = 'CareerArchiveDB';
const DB_VERSION = 1;
const STORE_NAME = 'students';
const AUTH_SETTINGS_KEY = 'career_archive_auth_settings_v2';

export const DEFAULT_AUTH_SETTINGS: AuthSettings = {
  adminCode: 'admin123123',
  viewerCodes: [
    'viewer01',
    'viewer02',
    'viewer03',
    'viewer04',
    'viewer05',
    'viewer06',
    'viewer07',
    'viewer08',
    'viewer09',
    'viewer10',
  ],
};

class LocalArchiveStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
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
  // Auth Settings
  // ==========================================
  async getAuthSettings(): Promise<AuthSettings> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('auth_settings')
          .select('admin_code, viewer_codes')
          .eq('id', 'global_auth')
          .single();

        if (!error && data) {
          return {
            adminCode: data.admin_code,
            viewerCodes: Array.isArray(data.viewer_codes) ? data.viewer_codes : DEFAULT_AUTH_SETTINGS.viewerCodes,
          };
        }
      } catch (e) {
        console.warn('Supabase auth load failed, falling back to local storage', e);
      }
    }

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

  async saveAuthSettings(settings: AuthSettings): Promise<void> {
    localStorage.setItem(AUTH_SETTINGS_KEY, JSON.stringify(settings));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('auth_settings')
          .upsert({
            id: 'global_auth',
            admin_code: settings.adminCode,
            viewer_codes: settings.viewerCodes,
            updated_at: new Date().toISOString(),
          });
      } catch (e) {
        console.error('Failed to sync auth settings to Supabase', e);
      }
    }
  }

  // ==========================================
  // Students & Records
  // ==========================================
  async getAllStudents(): Promise<Student[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: studentsData, error: sError } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        if (sError) throw sError;

        if (studentsData) {
          const { data: recordsData, error: rError } = await supabase
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
            await this.seedSupabase(INITIAL_STUDENTS);
            return INITIAL_STUDENTS;
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
              records: studentRecords,
            };
          });

          return combined;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local IndexedDB', err);
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
        if (!result || result.length === 0) {
          await this.saveAllStudentsLocal(INITIAL_STUDENTS);
          resolve(INITIAL_STUDENTS);
        } else {
          resolve(result);
        }
      };

      req.onerror = () => reject(req.error);
    });
  }

  async seedSupabase(students: Student[]): Promise<void> {
    if (!supabase) return;
    for (const s of students) {
      await supabase.from('students').upsert({
        id: s.id,
        name: s.name,
        cohort: s.cohort,
        created_at: s.createdAt || new Date().toISOString(),
      });
      for (const r of s.records) {
        await supabase.from('records').upsert({
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
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('students').insert({
          id: student.id,
          name: student.name,
          cohort: student.cohort,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Supabase addStudent failed:', e);
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

  async updateStudent(studentId: string, name: string, cohort: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('students')
          .update({ name, cohort })
          .eq('id', studentId);
      } catch (e) {
        console.error('Supabase updateStudent failed:', e);
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
          student.name = name;
          student.cohort = cohort;
          store.put(student);
          resolve();
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async deleteStudent(studentId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('students').delete().eq('id', studentId);
      } catch (e) {
        console.error('Supabase deleteStudent error:', e);
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
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('records').insert({
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
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
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
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('records').delete().eq('id', recordId);
      } catch (e) {
        console.error('Supabase deleteRecord error:', e);
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
    if (isSupabaseConfigured() && supabase) {
      await this.seedSupabase(parsed.students);
      if (parsed.auth) {
        await this.saveAuthSettings(parsed.auth);
      }
    }

    return parsed.students;
  }

  async syncLocalToSupabase(): Promise<number> {
    if (!isSupabaseConfigured() || !supabase) {
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
