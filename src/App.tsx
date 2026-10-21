import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { StudentCard } from './components/StudentCard';
import { PdfViewerModal } from './components/PdfViewerModal';
import { AddRecordModal } from './components/AddRecordModal';
import { AccessLogModal } from './components/AccessLogModal';
import { useAuth } from './context/AuthContext';
import { INITIAL_STUDENTS } from './data/mockData';
import { Student, CounselingRecord, PdfReview, FilterOptions } from './types';
import { LayoutGrid, Columns3, AlertCircle } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { logAction } = useAuth();

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchKeyword: '',
    cohort: 'all',
    targetRole: 'all',
    counselingType: 'all',
    status: 'all'
  });

  // Layout mode: 'grid' (Responsive grid) vs 'board' (Padlet horizontal lane)
  const [boardLayout, setBoardLayout] = useState<'grid' | 'board'>('grid');

  // Modals state
  const [selectedPdf, setSelectedPdf] = useState<{ pdf: PdfReview; student: Student } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preselectedStudent, setPreselectedStudent] = useState<Student | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Available cohorts list
  const availableCohorts = useMemo(() => {
    const set = new Set(students.map(s => s.cohort));
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 1. Cohort filter
      if (filters.cohort !== 'all' && student.cohort !== filters.cohort) {
        return false;
      }

      // 2. Counseling type filter
      if (filters.counselingType !== 'all') {
        const hasMatchingRecord = student.records.some(r => r.type === filters.counselingType);
        if (!hasMatchingRecord) return false;
      }

      // 3. Search keyword filter (student name, cohort, role, companies, notes, record title, content, tags)
      const q = filters.searchKeyword.trim().toLowerCase();
      if (!q) return true;

      const inBasicInfo = 
        student.name.toLowerCase().includes(q) ||
        student.cohort.toLowerCase().includes(q) ||
        (student.major && student.major.toLowerCase().includes(q)) ||
        student.targetRole.toLowerCase().includes(q) ||
        student.targetCompanies.some(c => c.toLowerCase().includes(q)) ||
        (student.notes && student.notes.toLowerCase().includes(q));

      if (inBasicInfo) return true;

      const inRecords = student.records.some(r => 
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.counselorName.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q)) ||
        (r.actionItem && r.actionItem.toLowerCase().includes(q)) ||
        (r.pdfReview && r.pdfReview.title.toLowerCase().includes(q))
      );

      return inRecords;
    });
  }, [students, filters]);

  // Handler: Open PDF viewer
  const handleOpenPdf = (pdf: PdfReview, student: Student) => {
    setSelectedPdf({ pdf, student });
    logAction('view_pdf', `${student.name} 학생 [${pdf.title}] 첨삭 열람`);
  };

  // Handler: Add new record to existing student
  const handleSaveRecord = (studentId: string, newRecord: CounselingRecord) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          records: [newRecord, ...s.records],
          updatedAt: new Date().toISOString().substring(0, 10)
        };
      }
      return s;
    }));
  };

  // Handler: Add new student
  const handleAddNewStudent = (newStudent: Student) => {
    setStudents(prev => [newStudent, ...prev]);
  };

  // Handler: Open Add Modal for specific student
  const handleAddRecordForStudent = (student: Student) => {
    setPreselectedStudent(student);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenAddModal={() => {
          setPreselectedStudent(null);
          setIsAddModalOpen(true);
        }}
        onOpenLogModal={() => setIsLogModalOpen(true)}
      />

      {/* Filter and Search Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        availableCohorts={availableCohorts}
        totalStudentsCount={students.length}
        filteredStudentsCount={filteredStudents.length}
      />

      {/* Main Board Sub-header: Padlet view layout switch & quick info */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
          <span>학생 카드별 상담·첨삭 일지 및 PDF 붉은펜 피드백이 누적 보관됩니다.</span>
        </div>

        {/* Board View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 text-xs shadow-2xs">
          <button
            onClick={() => setBoardLayout('grid')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-colors ${
              boardLayout === 'grid'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="격자 카드 뷰 (기본)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">그리드 뷰</span>
          </button>
          <button
            onClick={() => setBoardLayout('board')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-colors ${
              boardLayout === 'board'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="패들렛 가로 스크롤 보드 뷰"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">패들렛 보드 뷰</span>
          </button>
        </div>
      </div>

      {/* Main Padlet Board Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        {filteredStudents.length > 0 ? (
          boardLayout === 'grid' ? (
            /* Responsive Grid Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
              {filteredStudents.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onOpenPdf={handleOpenPdf}
                  onAddRecordForStudent={handleAddRecordForStudent}
                />
              ))}
            </div>
          ) : (
            /* Padlet-style Horizontal Scroll Lane Board Mode */
            <div className="flex space-x-5 overflow-x-auto pb-6 pt-1 items-start">
              {filteredStudents.map(student => (
                <div key={student.id} className="w-[360px] sm:w-[400px] shrink-0">
                  <StudentCard
                    student={student}
                    onOpenPdf={handleOpenPdf}
                    onAddRecordForStudent={handleAddRecordForStudent}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty Search Result */
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">검색된 학생이 없습니다</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              입력하신 검색어 또는 선택한 필터 조건과 일치하는 기록이 없습니다.
            </p>
            <button
              onClick={() => setFilters({
                searchKeyword: '',
                cohort: 'all',
                targetRole: 'all',
                counselingType: 'all',
                status: 'all'
              })}
              className="text-xs font-semibold px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              전체 학생 보기
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <PdfViewerModal
        pdfReview={selectedPdf ? selectedPdf.pdf : null}
        student={selectedPdf ? selectedPdf.student : null}
        onClose={() => setSelectedPdf(null)}
      />

      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        students={students}
        preselectedStudent={preselectedStudent}
        onSaveRecord={handleSaveRecord}
        onAddNewStudent={handleAddNewStudent}
      />

      <AccessLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </div>
  );
};
