import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { PadletColumn } from './components/PadletColumn';
import { RecordModal } from './components/RecordModal';
import { AddStudentModal } from './components/AddStudentModal';
import { EditStudentModal } from './components/EditStudentModal';
import { CodeSettingsModal } from './components/CodeSettingsModal';
import { DataManagementModal } from './components/DataManagementModal';
import { LoginModal } from './components/LoginModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { useAuth } from './context/AuthContext';
import { archiveStorage } from './services/storage';
import { isSupabaseConfigured } from './services/supabase';
import { Student, CounselingRecord, PdfAttachment, PRESET_COHORTS } from './types';
import { Plus, Users, Database } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [targetStudentForRecord, setTargetStudentForRecord] = useState<Student | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<CounselingRecord | null>(null);

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isCodeSettingsOpen, setIsCodeSettingsOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);

  const [selectedPdf, setSelectedPdf] = useState<{ pdf: PdfAttachment; studentName: string } | null>(null);

  // 1. Initial Load from storage (Only when authenticated!)
  useEffect(() => {
    if (!isAuthenticated) {
      setStudents([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const loadStoredData = async () => {
      setIsLoading(true);
      try {
        const loadedStudents = await archiveStorage.getAllStudents();
        if (isMounted) {
          setStudents(loadedStudents);
        }
      } catch (err) {
        console.error('Failed to load students from permanent storage:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadStoredData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Available cohorts list (PRESET_COHORTS + any custom cohorts)
  const availableCohorts = useMemo(() => {
    const custom = students
      .map((s) => s.cohort)
      .filter((c) => !PRESET_COHORTS.includes(c));
    const uniqueCustom = Array.from(new Set(custom)).sort();
    return [...PRESET_COHORTS, ...uniqueCustom];
  }, [students]);

  // Cohort Counts map
  const cohortCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      counts[s.cohort] = (counts[s.cohort] || 0) + 1;
    });
    return counts;
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

  // Handler: Add or Update Record
  const handleSaveRecord = async (
    studentId: string,
    record: CounselingRecord,
    isEditing: boolean
  ) => {
    try {
      if (isEditing) {
        await archiveStorage.updateRecord(studentId, record);
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === studentId) {
              return {
                ...s,
                records: s.records.map((r) => (r.id === record.id ? record : r)),
              };
            }
            return s;
          })
        );
      } else {
        await archiveStorage.addRecord(studentId, record);
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === studentId) {
              return {
                ...s,
                records: [record, ...s.records],
              };
            }
            return s;
          })
        );
      }
    } catch (err) {
      console.error('Failed to save record to storage:', err);
      alert('기록 저장 중 오류가 발생했습니다.');
    }
  };

  // Handler: Delete Record
  const handleDeleteRecord = async (studentId: string, recordId: string) => {
    try {
      await archiveStorage.deleteRecord(studentId, recordId);
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
    } catch (err) {
      console.error('Failed to delete record from storage:', err);
      alert('기록 삭제 중 오류가 발생했습니다.');
    }
  };

  // Handler: Add new student
  const handleAddStudent = async (newStudent: Student) => {
    try {
      await archiveStorage.addStudent(newStudent);
      setStudents((prev) => [...prev, newStudent]);
    } catch (err) {
      console.error('Failed to add student to storage:', err);
      alert('학생 등록 중 오류가 발생했습니다.');
    }
  };

  // Handler: Update student
  const handleSaveStudent = async (studentId: string, name: string, cohort: string) => {
    try {
      await archiveStorage.updateStudent(studentId, name, cohort);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, name, cohort } : s))
      );
    } catch (err) {
      console.error('Failed to update student in storage:', err);
      alert('학생 정보 수정 중 오류가 발생했습니다.');
    }
  };

  // Handler: Delete student
  const handleDeleteStudent = async (studentId: string) => {
    try {
      await archiveStorage.deleteStudent(studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      console.error('Failed to delete student from storage:', err);
      alert('학생 삭제 중 오류가 발생했습니다.');
    }
  };

  // Quick Open Modal Helpers
  const handleOpenAddRecord = (student: Student) => {
    setTargetStudentForRecord(student);
    setRecordToEdit(null);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditRecord = (student: Student, record: CounselingRecord) => {
    setTargetStudentForRecord(student);
    setRecordToEdit(record);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsEditStudentOpen(true);
  };

  // 비로그인 상태일 경우 메인 대시보드 및 학생 데이터를 전혀 렌더링하지 않고 전용 로그인 화면만 표시
  if (!isAuthenticated) {
    return <LoginModal />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-teal-600 font-semibold text-sm">
          <Database className="w-5 h-5 animate-spin" />
          <span>저장소를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-teal-50/40 text-slate-800 font-sans flex flex-col selection:bg-teal-500 selection:text-white">
      {/* 1. Header with Search & Filter & Admin Tools */}
      <Header
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        selectedCohort={selectedCohort}
        onCohortChange={setSelectedCohort}
        availableCohorts={availableCohorts}
        cohortCounts={cohortCounts}
        onOpenAddStudent={() => setIsAddStudentOpen(true)}
        onOpenCodeSettings={() => setIsCodeSettingsOpen(true)}
        onOpenDataManagement={() => setIsDataManagementOpen(true)}
      />

      {/* 2. Main Masonry Container (Pinterest-style Multi-column) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        
        {/* Top Info Notice */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>
              {selectedCohort === 'all' ? (
                <>
                  총 <strong className="text-slate-800 font-semibold">{filteredStudents.length}</strong>명의 취업지원 박스 (전체 기수)
                </>
              ) : (
                <>
                  <strong className="text-teal-700 font-bold">{selectedCohort}</strong> 게시판 :{' '}
                  <strong className="text-slate-800 font-semibold">{filteredStudents.length}</strong>명
                </>
              )}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-full font-medium">
              {isAdmin ? '🛡️ 관리자 권한 (전체 편집 가능)' : '👁️ 열람자 권한 (조회 및 다운로드 전용)'}
            </span>
            <span
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {isSupabaseConfigured() ? '☁️ 수파베이스 클라우드 연결됨' : '💾 개인 PC 로컬 저장 모드'}
            </span>
          </div>
        </div>

        {students.length === 0 ? (
          /* Empty state: No students yet */
          <div className="w-full flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-100 to-teal-100 border border-teal-200/60 flex items-center justify-center text-teal-600 mb-4 shadow-2xs">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">등록된 학생이 없습니다</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
              {isAdmin
                ? '새로운 학생을 등록하고 상담 및 첨삭 기록(PDF, 워드, 한글, 이미지)을 작성해보세요.'
                : '현재 등록된 학생 데이터가 없습니다. 관리자가 학생을 등록하면 이곳에 표시됩니다.'}
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>첫 학생 등록하기</span>
              </button>
            )}
          </div>
        ) : filteredStudents.length > 0 ? (
          /* Responsive Masonry Multi-column: 1 col on mobile -> 2 on sm -> 3 on lg -> 4 on xl */
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
            {filteredStudents.map((student) => (
              <PadletColumn
                key={student.id}
                student={student}
                isAdmin={isAdmin}
                onAddRecord={handleOpenAddRecord}
                onEditRecord={handleOpenEditRecord}
                onDeleteRecord={handleDeleteRecord}
                onEditStudent={handleOpenEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onOpenPdf={(pdf, studentName) => setSelectedPdf({ pdf, studentName })}
              />
            ))}

            {/* Quick Add Student Tile in Masonry Stream (Admin Only) */}
            {isAdmin && (
              <div
                onClick={() => setIsAddStudentOpen(true)}
                className="break-inside-avoid mb-5 w-full rounded-2xl border-2 border-dashed border-sky-200 hover:border-teal-400 bg-white/50 hover:bg-white/80 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[160px] group shadow-2xs hover:shadow-xs"
              >
                <div className="w-10 h-10 rounded-full bg-teal-50 group-hover:bg-teal-100 text-teal-600 flex items-center justify-center mb-2 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
                  {selectedCohort !== 'all' ? `${selectedCohort} 학생 추가` : '새 학생 추가'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  클릭하여 새 학생 박스를 보드에 생성합니다.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Filtered empty state */
          <div className="w-full flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 border border-teal-200/60 shadow-2xs">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {selectedCohort !== 'all'
                ? `${selectedCohort}에 등록된 학생이 없습니다`
                : '검색 결과와 일치하는 학생이 없습니다'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
              {selectedCohort !== 'all'
                ? isAdmin
                  ? `${selectedCohort}의 학생을 추가하여 상담 및 첨삭 기록을 관리해보세요.`
                  : `${selectedCohort}에 등록된 학생이 아직 없습니다.`
                : '학생 이름 검색어를 다시 확인해보세요.'}
            </p>
            {isAdmin && selectedCohort !== 'all' && (
              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{selectedCohort} 학생 등록하기</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* 3. Modals */}
      {/* Data Management Modal (Backup & Supabase Sync) */}
      <DataManagementModal
        isOpen={isDataManagementOpen}
        onClose={() => setIsDataManagementOpen(false)}
        onDataRestored={(restoredStudents) => setStudents(restoredStudents)}
      />

      {/* Code Settings Modal */}
      <CodeSettingsModal
        isOpen={isCodeSettingsOpen}
        onClose={() => setIsCodeSettingsOpen(false)}
      />

      {/* Create / Edit Record Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordToEdit(null);
        }}
        students={students}
        preselectedStudent={targetStudentForRecord}
        recordToEdit={recordToEdit}
        onSaveRecord={handleSaveRecord}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAddStudent={handleAddStudent}
        defaultCohort={selectedCohort !== 'all' ? selectedCohort : '디금융 8기'}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditStudentOpen}
        student={studentToEdit}
        onClose={() => {
          setIsEditStudentOpen(false);
          setStudentToEdit(null);
        }}
        onSaveStudent={handleSaveStudent}
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
