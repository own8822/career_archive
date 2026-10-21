import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { StudentSimpleCard } from './components/StudentSimpleCard';
import { StudentDetailModal } from './components/StudentDetailModal';
import { AddRecordModal } from './components/AddRecordModal';
import { AddStudentModal } from './components/AddStudentModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { useAuth } from './context/AuthContext';
import { INITIAL_STUDENTS } from './data/mockData';
import { Student, CounselingRecord, PdfAttachment } from './types';
import { Search, X, Users } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { logAction } = useAuth();

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');

  // Modals
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [recordTargetStudent, setRecordTargetStudent] = useState<Student | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ pdf: PdfAttachment; studentName: string } | null>(null);

  // Available cohorts list
  const cohorts = useMemo(() => {
    const list = Array.from(new Set(students.map(s => s.cohort)));
    return list.sort();
  }, [students]);

  // Filtered Students (학생 이름 및 기수로 검색)
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedCohort !== 'all' && student.cohort !== selectedCohort) {
        return false;
      }
      const q = searchKeyword.trim().toLowerCase();
      if (!q) return true;
      return (
        student.name.toLowerCase().includes(q) ||
        student.cohort.toLowerCase().includes(q)
      );
    });
  }, [students, searchKeyword, selectedCohort]);

  // Current selected student for detail modal
  const detailStudent = useMemo(() => {
    return students.find(s => s.id === detailStudentId) || null;
  }, [students, detailStudentId]);

  // Handler: Add record
  const handleSaveRecord = (studentId: string, newRecord: CounselingRecord) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          records: [newRecord, ...s.records]
        };
      }
      return s;
    }));
    logAction('create_record', `${newRecord.title} 기록 추가`);
  };

  // Handler: Delete record
  const handleDeleteRecord = (studentId: string, recordId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          records: s.records.filter(r => r.id !== recordId)
        };
      }
      return s;
    }));
    logAction('delete_record', '상담 기록 삭제');
  };

  // Handler: Add new student
  const handleAddStudent = (newStudent: Student) => {
    setStudents(prev => [newStudent, ...prev]);
    logAction('create_student', `${newStudent.name} (${newStudent.cohort}) 학생 등록`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col">
      {/* 1. Header */}
      <Header
        onOpenAddRecord={() => {
          setRecordTargetStudent(null);
          setIsAddRecordOpen(true);
        }}
        onOpenAddStudent={() => setIsAddStudentOpen(true)}
      />

      {/* 2. Main Container */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
        
        {/* Search Bar & Quick Cohort Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="학생 이름 검색"
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Minimal Cohort Filter */}
          <div className="flex items-center space-x-1 text-xs">
            <button
              onClick={() => setSelectedCohort('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCohort === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            {cohorts.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCohort(c)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedCohort === c
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Students Card Grid (Padlet-style cards) */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5 flex-1">
            {filteredStudents.map((student) => (
              <StudentSimpleCard
                key={student.id}
                student={student}
                onClick={() => {
                  setDetailStudentId(student.id);
                  logAction('view_student', `${student.name} 학생 상세 조회`);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">일치하는 학생이 없습니다</p>
            <p className="text-xs text-slate-400 mt-1">학생 이름을 다시 확인해보세요.</p>
          </div>
        )}

        {/* Bottom Helper Guide Text (as shown in user specification) */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          메인 보드는 학생을 찾는 용도로만 사용하고, 상세 기록은 카드를 눌렀을 때 표시하는 구성
        </div>

      </main>

      {/* 4. Modals */}
      {/* Student Detail Modal */}
      <StudentDetailModal
        student={detailStudent}
        onClose={() => setDetailStudentId(null)}
        onOpenAddRecordForStudent={(student) => {
          setRecordTargetStudent(student);
          setIsAddRecordOpen(true);
        }}
        onDeleteRecord={handleDeleteRecord}
        onOpenPdf={(pdf, studentName) => setSelectedPdf({ pdf, studentName })}
      />

      {/* Add Record Modal (Simple 4 inputs) */}
      <AddRecordModal
        isOpen={isAddRecordOpen}
        onClose={() => setIsAddRecordOpen(false)}
        students={students}
        preselectedStudent={recordTargetStudent}
        onSaveRecord={handleSaveRecord}
      />

      {/* Add Student Modal (Name + Cohort) */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAddStudent={handleAddStudent}
      />

      {/* PDF Zoom Viewer Modal */}
      <PdfViewerModal
        pdf={selectedPdf ? selectedPdf.pdf : null}
        studentName={selectedPdf ? selectedPdf.studentName : undefined}
        onClose={() => setSelectedPdf(null)}
      />
    </div>
  );
};
