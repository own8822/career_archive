import { Student, CounselingRecord } from '../types';
import { INITIAL_STUDENTS } from '../data/mockData';

const DB_NAME = 'CareerArchiveDB';
const DB_VERSION = 1;
const STORE_NAME = 'students';

/**
 * IndexedDB Wrapper for permanent client-side storage of students, records, and PDF files.
 * Easily swappable with Company-approved cloud databases (e.g. Supabase, Firebase, AWS S3+RDS).
 */
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

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Load all students. If storage is empty, initialize with INITIAL_STUDENTS.
   */
  async getAllStudents(): Promise<Student[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = async () => {
        const result = req.result as Student[];
        if (!result || result.length === 0) {
          // Seed with initial mock students
          await this.saveAllStudents(INITIAL_STUDENTS);
          resolve(INITIAL_STUDENTS);
        } else {
          resolve(result);
        }
      };

      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Save entire students list
   */
  async saveAllStudents(students: Student[]): Promise<void> {
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

  /**
   * Add a new student
   */
  async addStudent(student: Student): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(student);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Update student info (name, cohort)
   */
  async updateStudent(studentId: string, name: string, cohort: string): Promise<void> {
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
          reject(new Error('Student not found'));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Delete a student
   */
  async deleteStudent(studentId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(studentId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Add a counseling record to a student
   */
  async addRecord(studentId: string, record: CounselingRecord): Promise<void> {
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
          reject(new Error('Student not found'));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Update a counseling record
   */
  async updateRecord(studentId: string, updatedRecord: CounselingRecord): Promise<void> {
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
          reject(new Error('Student not found'));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Delete a counseling record
   */
  async deleteRecord(studentId: string, recordId: string): Promise<void> {
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
          reject(new Error('Student not found'));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}

export const archiveStorage = new LocalArchiveStorage();
