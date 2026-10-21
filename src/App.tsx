import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { PadletColumn } from './components/PadletColumn';
import { AddRecordModal } from './components/AddRecordModal';
import { AddStudentModal } from './components/AddStudentModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { useAuth } from './context/AuthContext';
import { INITIAL_STUDENTS } from './data/mockData';
import { Student, CounselingRecord, PdfAttachment } from './types';
import { Plus, Users } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { isAdmin, logAction } = useAuth();

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');

  // Modals
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [targetStudentForRecord, setTargetStudentForRecord] = useState<Student | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ pdf: PdfAttachment; studentName: string } | null>(null);

  // Available cohorts list
  const availableCohorts = useMemo(() => {
    const set = new Set(students.map((s) => s.cohort));
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students (학생 이름 및 기수 필터)
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
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

  // Handler: Add new record to specific student
  const handleSaveRecord = (studentId: string, newRecord: CounselingRecord) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            records: [newRecord, ...s.records],
          };
        }
        return s;
      })
    );
    logAction('create_record', `${newRecord.title} 기록 추가`);
  };

  // Handler: Delete record
  const handleDeleteRecord = (studentId: string, recordId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            records: s.records.filter((r) => r.id !== recordId),
          };
        }
        return s;
      })
    );
    logAction('delete_record', '상담 기록 삭제');
  };

  // Handler: Add new student column
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
    logAction('create_student', `${newStudent.name} (${newStudent.cohort}) 열 추가`);
  };

  // Handler: Delete student column
  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    logAction('delete_record', '학생 열 삭제');
  };

  // Quick open Add Record modal for specific student column
  const handleOpenAddRecordForColumn = (student: Student) => {
    setTargetStudentForRecord(student);
    setIsAddRecordOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-teal-50/40 text-slate-800 font-sans flex flex-col selection:bg-teal-500 selection:text-white">
      {/* 1. Sticky Header with Search & Filter & Role Switcher */}
      <Header
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        selectedCohort={selectedCohort}
        onCohortChange={setSelectedCohort}
        availableCohorts={availableCohorts}
        onOpenAddStudent={() => setIsAddStudentOpen(true)}
      />

      {/* 2. Main Padlet Shelf Canvas (Horizontal Scroll Lane) */}
      <main className="flex-1 overflow-x-auto p-4 sm:p-6 flex items-start space-x-5">
        {filteredStudents.length > 0 ? (
          <>
            {filteredStudents.map((student) => (
              <PadletColumn
                key={student.id}
                student={student}
                isAdmin={isAdmin}
                onAddRecord={handleOpenAddRecordForColumn}
                onDeleteRecord={handleDeleteRecord}
                onDeleteStudent={handleDeleteStudent}
                onOpenPdf={(pdf, studentName) => setSelectedPdf({ pdf, studentName })}
              />
            ))}

            {/* End of Columns: Add Column Tile (Admin Only) */}
            {isAdmin && (
              <div
                onClick={() => setIsAddStudentOpen(true)}
                className="w-72 shrink-0 rounded-2xl border-2 border-dashed border-sky-200 hover:border-teal-400 bg-white/40 hover:bg-white/80 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[160px] group"
              >
                <div className="w-10 h-10 rounded-full bg-teal-50 group-hover:bg-teal-100 text-teal-600 flex items-center justify-center mb-2 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
                  새 학생 열 추가
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  클릭하여 새 학생의 세로 열을 생성합니다.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-white shadow-2xs border border-sky-100 flex items-center justify-center text-teal-500 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">검색된 학생 열이 없습니다</p>
            <p className="text-xs text-slate-400 mt-1">학생 이름이나 기수 필터를 다시 확인해보세요.</p>
          </div>
        )}
      </main>

      {/* 3. Modals */}
      {/* Add Record Modal */}
      <AddRecordModal
        isOpen={isAddRecordOpen}
        onClose={() => setIsAddRecordOpen(false)}
        students={students}
        preselectedStudent={targetStudentForRecord}
        onSaveRecord={handleSaveRecord}
      />

      {/* Add Student Column Modal */}
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
