import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  FileText
} from 'lucide-react';
import { Student, CounselingRecord, CounselingType, PdfReview } from '../types';
import { useAuth } from '../context/AuthContext';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preselectedStudent?: Student | null;
  onSaveRecord: (studentId: string, newRecord: CounselingRecord) => void;
  onAddNewStudent: (newStudent: Student) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  students,
  preselectedStudent,
  onSaveRecord,
  onAddNewStudent,
}) => {
  const { currentUser, logAction } = useAuth();

  const [mode, setMode] = useState<'record' | 'student'>('record');
  
  // Record Form States
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent?.id || (students[0]?.id || '')
  );
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [counselorName, setCounselorName] = useState<string>(currentUser.name);
  const [type, setType] = useState<CounselingType>('resume');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [actionItem, setActionItem] = useState('');
  
  // Optional PDF Attachment state
  const [hasPdf, setHasPdf] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSummary, setPdfSummary] = useState('');

  // New Student Form States
  const [newStudentName, setNewStudentName] = useState('');
  const [newCohort, setNewCohort] = useState('8기');
  const [newMajor, setNewMajor] = useState('');
  const [newTargetRole, setNewTargetRole] = useState('');
  const [newCompanies, setNewCompanies] = useState('');

  if (!isOpen) return null;

  const handleSubmitRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !selectedStudentId) {
      alert('상담 제목과 상담 상세 내용을 입력해주세요.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => t.length > 0);

    let pdfReview: PdfReview | undefined = undefined;
    if (hasPdf) {
      pdfReview = {
        id: `pdf-${Date.now()}`,
        title: pdfTitle.trim() || `${title} 첨삭본.pdf`,
        originalFileName: `${newStudentName || '학생'}_문서_첨삭.pdf`,
        fileSize: '2.4 MB',
        pageCount: 3,
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        summary: pdfSummary.trim() || '담당 컨설턴트 주요 첨삭 및 교정 피드백 수록',
        annotations: [
          {
            id: `ann-${Date.now()}-1`,
            page: 1,
            type: 'improve',
            quote: '핵심 성과 문맥 보강 요청',
            comment: '직무 연관성을 입증할 수 있도록 수치화된 성과 지표를 추가하세요.',
            author: counselorName
          },
          {
            id: `ann-${Date.now()}-2`,
            page: 2,
            type: 'praise',
            quote: '문제 해결 프로세스 전개',
            comment: '갈등 해결 및 커뮤니케이션 극복 과정이 구체적이고 설득력 있습니다.',
            author: counselorName
          }
        ]
      };
    }

    const newRecord: CounselingRecord = {
      id: `rec-${Date.now()}`,
      studentId: selectedStudentId,
      date,
      counselorName,
      type,
      title,
      summary: summary || title,
      content,
      tags: tags.length > 0 ? tags : ['취업상담', '피드백'],
      actionItem: actionItem.trim() || undefined,
      pdfReview
    };

    onSaveRecord(selectedStudentId, newRecord);
    const targetStudent = students.find(s => s.id === selectedStudentId);
    logAction('create_record', `${targetStudent?.name} 학생에 대한 신규 [${title}] 기록 등록 완료`);
    onClose();
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newTargetRole.trim()) {
      alert('학생명과 희망 직무는 필수 입력 항목입니다.');
      return;
    }

    const companies = newCompanies
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-purple-600', 'bg-rose-600', 'bg-teal-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const createdStudent: Student = {
      id: `std-${Date.now()}`,
      name: newStudentName.trim(),
      cohort: newCohort,
      major: newMajor.trim() || undefined,
      targetRole: newTargetRole.trim(),
      targetCompanies: companies.length > 0 ? companies : ['미정'],
      status: '준비중',
      avatarColor: randomColor,
      records: [],
      createdAt: new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10)
    };

    onAddNewStudent(createdStudent);
    logAction('create_student', `신규 학생 [${createdStudent.name} (${createdStudent.cohort})] 등록 완료`);
    setSelectedStudentId(createdStudent.id);
    setMode('record');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-brand-500/20 text-brand-400 rounded-lg">
              <Plus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'record' ? '상담 및 첨삭 기록 등록' : '신규 학생 추가'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'record' 
                  ? '관리자 전용: 학생별 카드에 누적될 새로운 지도 일지를 작성합니다.' 
                  : '관리자 전용: 보드에 추가할 새로운 취업 준비생 정보를 등록합니다.'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('record')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              mode === 'record'
                ? 'border-brand-600 text-brand-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            상담·첨삭 일지 기록
          </button>
          <button
            type="button"
            onClick={() => setMode('student')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              mode === 'student'
                ? 'border-brand-600 text-brand-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            + 새 학생 등록
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {mode === 'record' ? (
            <form onSubmit={handleSubmitRecord} className="space-y-4">
              
              {/* Target Student Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    대상 학생 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                    required
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.cohort} / {s.targetRole})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    상담 일자
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Counselor & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    담당 컨설턴트/멘토
                  </label>
                  <input
                    type="text"
                    value={counselorName}
                    onChange={(e) => setCounselorName(e.target.value)}
                    placeholder="예: 김선임 컨설턴트"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    상담 유형
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CounselingType)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="resume">자기소개서·이력서 첨삭</option>
                    <option value="portfolio">포트폴리오 코칭</option>
                    <option value="interview">모의면접 피드백</option>
                    <option value="career">취업 로드맵·진로상담</option>
                    <option value="general">일반 상담</option>
                  </select>
                </div>
              </div>

              {/* Title & Summary */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  상담 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 카카오 1차 기술면접 대비 모의면접 피드백"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  한 줄 요약
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="카드 목록에 간략히 노출될 핵심 요약 1줄"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Detailed Long Content (접기/펼치기 대상) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  상담 상세 피드백 내용 (전문) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="구체적인 문항별 피드백, 면접 질의응답 분석, 지도 사항 등 상세한 내용을 입력하세요. (카드에서 접기/펼치기로 열람 가능합니다)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500 leading-relaxed font-sans"
                  required
                />
              </div>

              {/* Action Item & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    후속 과제 (Action Item)
                  </label>
                  <input
                    type="text"
                    value={actionItem}
                    onChange={(e) => setActionItem(e.target.value)}
                    placeholder="예: 2차 이력서 수정본 금요일까지 제출"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    키워드 태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="예: 모의면접, 기술스택, 포트폴리오링크"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* PDF Attachment Toggle Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <div>
                      <span className="font-bold text-slate-800">PDF 첨삭지 첨부</span>
                      <p className="text-[11px] text-slate-500">붉은펜 첨삭 썸네일 및 모달 뷰어 제공</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasPdf}
                    onChange={(e) => setHasPdf(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                </div>

                {hasPdf && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    <div>
                      <label className="block font-medium text-slate-600 mb-0.5">
                        첨삭 파일명
                      </label>
                      <input
                        type="text"
                        value={pdfTitle}
                        onChange={(e) => setPdfTitle(e.target.value)}
                        placeholder="예: 2026_하반기_이력서_첨삭본.pdf"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-0.5">
                        첨삭 요약 안내
                      </label>
                      <input
                        type="text"
                        value={pdfSummary}
                        onChange={(e) => setPdfSummary(e.target.value)}
                        placeholder="예: 1~3페이지 구조 개선 메모 및 문장 교정 포함"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  기록 저장 및 누적
                </button>
              </div>

            </form>
          ) : (
            /* Mode === student */
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    학생 성명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    기수 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newCohort}
                    onChange={(e) => setNewCohort(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="7기">7기</option>
                    <option value="8기">8기</option>
                    <option value="9기">9기 (신규)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    전공 학과
                  </label>
                  <input
                    type="text"
                    value={newMajor}
                    onChange={(e) => setNewMajor(e.target.value)}
                    placeholder="예: 컴퓨터공학전공"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    희망 직무 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTargetRole}
                    onChange={(e) => setNewTargetRole(e.target.value)}
                    placeholder="예: 프론트엔드 개발자"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  목표 기업 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={newCompanies}
                  onChange={(e) => setNewCompanies(e.target.value)}
                  placeholder="예: 네이버, 카카오, 라인"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMode('record')}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  학생 등록 후 기록 작성
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
