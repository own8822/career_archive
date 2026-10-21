import React, { useState, useEffect } from 'react';
import { X, FileText, UploadCloud, Trash2, Check } from 'lucide-react';
import { Student, CounselingRecord, PdfAttachment } from '../types';
import { generatePdfThumbnail } from '../utils/pdfThumbnail';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preselectedStudent?: Student | null;
  recordToEdit?: CounselingRecord | null;
  onSaveRecord: (studentId: string, record: CounselingRecord, isEditing: boolean) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  students,
  preselectedStudent,
  recordToEdit,
  onSaveRecord,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pdfs, setPdfs] = useState<PdfAttachment[]>([]);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      // Editing Mode
      setSelectedStudentId(recordToEdit.studentId);
      setTitle(recordToEdit.title);
      setContent(recordToEdit.content);
      setPdfs(recordToEdit.pdfs || []);
    } else {
      // Create Mode
      setSelectedStudentId(preselectedStudent?.id || (students[0]?.id || ''));
      setTitle('');
      setContent('');
      setPdfs([]);
    }
  }, [recordToEdit, preselectedStudent, students, isOpen]);

  if (!isOpen) return null;

  // Handle multiple real PDF uploads
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPdf(true);
    const newAttachments: PdfAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert(`${file.name}은(는) PDF 파일이 아닙니다.`);
        continue;
      }

      // Generate real page 1 thumbnail
      const { dataUrl, thumbnailUrl } = await generatePdfThumbnail(file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

      newAttachments.push({
        id: `pdf-${Date.now()}-${i}`,
        fileName: file.name,
        fileSize: `${sizeMb} MB`,
        uploadedAt: new Date().toISOString().substring(0, 10),
        dataUrl,
        thumbnailUrl
      });
    }

    setPdfs((prev) => [...prev, ...newAttachments]);
    setIsProcessingPdf(false);
    e.target.value = ''; // Reset input
  };

  const handleRemovePdf = (pdfId: string) => {
    setPdfs((prev) => prev.filter((p) => p.id !== pdfId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !title.trim() || !content.trim()) {
      alert('학생, 제목, 상담 내용을 입력해주세요.');
      return;
    }

    const today = new Date().toISOString().substring(0, 10);

    const targetRecord: CounselingRecord = {
      id: recordToEdit ? recordToEdit.id : `rec-${Date.now()}`,
      studentId: selectedStudentId,
      date: recordToEdit ? recordToEdit.date : today,
      title: title.trim(),
      content: content.trim(),
      pdfs
    };

    onSaveRecord(selectedStudentId, targetRecord, !!recordToEdit);
    onClose();
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {recordToEdit ? '상담·첨삭 기록 수정' : '상담·첨삭 기록 등록'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentStudent ? `${currentStudent.name} (${currentStudent.cohort}) 열에 보관됩니다.` : '오늘 날짜로 자동 등록됩니다.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* 1. Target Student Selection (disabled if editing) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              학생 열 선택 <span className="text-teal-600">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={!!recordToEdit}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white disabled:opacity-70 disabled:bg-slate-100"
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
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
              required
              autoFocus={!recordToEdit}
            />
          </div>

          {/* 3. Content (Preserves line breaks) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              상담·첨삭 내용 <span className="text-teal-600">*</span>
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상담 결과, 피드백 코멘트, 개선 방향을 작성하세요. 줄바꿈이 그대로 저장됩니다."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white leading-relaxed font-sans"
              required
            />
          </div>

          {/* 4. Multiple PDF Attachments */}
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center">
                <FileText className="w-4 h-4 mr-1 text-teal-600" />
                PDF 첨부자료 ({pdfs.length}개)
              </span>

              {/* Upload Button */}
              <label className="cursor-pointer inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 text-xs font-semibold shadow-2xs transition-all">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>PDF 파일 추가</span>
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
            </div>

            {isProcessingPdf && (
              <p className="text-[11px] text-teal-600 font-medium animate-pulse">
                PDF 첫 페이지 썸네일을 렌더링 중입니다...
              </p>
            )}

            {/* List of attached PDFs */}
            {pdfs.length > 0 ? (
              <div className="space-y-2 pt-1">
                {pdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs"
                  >
                    <div className="flex items-center space-x-2.5 truncate pr-2">
                      {/* Mini Thumbnail */}
                      {pdf.thumbnailUrl ? (
                        <img
                          src={pdf.thumbnailUrl}
                          alt="Thumb"
                          className="w-8 h-10 object-cover rounded border border-slate-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-10 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-rose-500 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate text-xs">
                          {pdf.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {pdf.fileSize} · 첫 페이지 썸네일 생성됨
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePdf(pdf.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                      title="PDF 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 border border-dashed border-sky-200 rounded-lg bg-white/50 text-[11px]">
                첨부된 PDF 파일이 없습니다. 여러 개의 PDF 파일을 업로드할 수 있습니다.
              </div>
            )}
          </div>

          {/* Footer Buttons */}
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
              disabled={isProcessingPdf}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center space-x-1 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{recordToEdit ? '수정 완료' : '기록 저장'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
