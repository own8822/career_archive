import React, { useState, useEffect } from 'react';
import { X, FileText, Check } from 'lucide-react';
import { Student, CounselingRecord, PdfAttachment } from '../types';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preselectedStudent?: Student | null;
  onSaveRecord: (studentId: string, newRecord: CounselingRecord) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  students,
  preselectedStudent,
  onSaveRecord,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent?.id || (students[0]?.id || '')
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hasPdf, setHasPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');

  useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudentId(preselectedStudent.id);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [preselectedStudent, students]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !title.trim() || !content.trim()) {
      alert('학생, 제목, 상담 내용을 입력해주세요.');
      return;
    }

    const today = new Date().toISOString().substring(0, 10);

    let pdf: PdfAttachment | undefined = undefined;
    if (hasPdf) {
      const fileName = pdfFileName.trim() || `${title}_첨삭본.pdf`;
      pdf = {
        id: `pdf-${Date.now()}`,
        title: fileName,
        fileName: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        fileSize: '1.6 MB',
        uploadedAt: today,
        previewSnippet: `${content.substring(0, 120)}... (첨삭 메모 포함)`
      };
    }

    const newRecord: CounselingRecord = {
      id: `rec-${Date.now()}`,
      studentId: selectedStudentId,
      date: today, // 오늘 날짜 자동 입력
      title: title.trim(),
      content: content.trim(),
      pdf
    };

    onSaveRecord(selectedStudentId, newRecord);
    setTitle('');
    setContent('');
    setHasPdf(false);
    setPdfFileName('');
    onClose();
  };

  const currentStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50/70 to-teal-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">상담·첨삭 기록 추가</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentStudent ? `${currentStudent.name} (${currentStudent.cohort}) 열에 새 카드가 등록됩니다.` : '오늘 날짜로 자동 등록됩니다.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form: 딱 4가지 항목 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* 1. Student Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              학생 열 선택 <span className="text-teal-600">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
              required
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.cohort})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              제목 <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 현대해상 자기소개서 첨삭"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
              required
              autoFocus
            />
          </div>

          {/* 3. Content */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              상담·첨삭 내용 <span className="text-teal-600">*</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상담 피드백 및 첨삭 내용을 자유롭게 작성하세요."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white leading-relaxed"
              required
            />
          </div>

          {/* 4. PDF Attachment (Optional) */}
          <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPdf}
                onChange={(e) => setHasPdf(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span className="font-semibold text-slate-700 flex items-center">
                <FileText className="w-4 h-4 mr-1 text-teal-600" />
                PDF 첫 페이지 썸네일 첨부
              </span>
            </label>

            {hasPdf && (
              <div className="mt-2.5 pt-2.5 border-t border-sky-200/60">
                <input
                  type="text"
                  value={pdfFileName}
                  onChange={(e) => setPdfFileName(e.target.value)}
                  placeholder="첨부 파일명 (예: 현대해상_자소서_첨삭.pdf)"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>카드 등록</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
