import React, { useState, useEffect } from 'react';
import { X, FileText, UploadCloud, Trash2, Check, Paperclip } from 'lucide-react';
import { Student, CounselingRecord, PdfAttachment } from '../types';
import { generateAttachmentThumbnail, getFileBadgeInfo } from '../utils/pdfThumbnail';

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
  const [isProcessingFile, setIsProcessingFile] = useState(false);

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

  if (students.length === 0) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-sky-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">등록된 학생이 없습니다</h3>
          <p className="text-xs text-slate-500 mb-5">
            상담 기록을 작성하기 전에 상단의 [학생 추가] 버튼을 눌러 학생을 먼저 등록해주세요.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  // Handle multiple file uploads (PDF, Word, HWP, Images)
  const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'hwp', 'hwpx', 'jpg', 'jpeg', 'png', 'webp'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);
    const newAttachments: PdfAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.toLowerCase().split('.').pop() || '';
      if (!ALLOWED_EXTS.includes(ext)) {
        alert(
          `${file.name}은(는) 지원되지 않는 파일 형식입니다.\n\n지원 형식: PDF, 워드(.doc/.docx), 한글(.hwp/.hwpx), 이미지(.jpg/.png)`
        );
        continue;
      }

      // Generate preview thumbnail (PDF page 1, real image, or Word/HWP badge)
      const { dataUrl, thumbnailUrl } = await generateAttachmentThumbnail(file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

      newAttachments.push({
        id: `file-${Date.now()}-${i}`,
        fileName: file.name,
        fileSize: `${sizeMb} MB`,
        uploadedAt: new Date().toISOString().substring(0, 10),
        dataUrl,
        thumbnailUrl,
      });
    }

    setPdfs((prev) => [...prev, ...newAttachments]);
    setIsProcessingFile(false);
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

          {/* 4. Multiple File Attachments (PDF, Word, HWP, Images) */}
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-700 flex items-center text-xs">
                  <Paperclip className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  첨부파일 ({pdfs.length}개)
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  PDF, 워드(.doc/.docx), 한글(.hwp/.hwpx), 이미지(.jpg/.png) 지원
                </p>
              </div>

              {/* Upload Button */}
              <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 text-xs font-semibold shadow-2xs transition-all shrink-0">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>파일 추가</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.hwp,.hwpx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {isProcessingFile && (
              <p className="text-[11px] text-teal-600 font-medium animate-pulse">
                첨부파일 썸네일을 생성 및 처리 중입니다...
              </p>
            )}

            {/* List of attached files */}
            {pdfs.length > 0 ? (
              <div className="space-y-2 pt-1">
                {pdfs.map((pdf) => {
                  const badge = getFileBadgeInfo(pdf.fileName);
                  return (
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
                            className="w-8 h-10 object-cover rounded border border-slate-200 shadow-2xs shrink-0 bg-slate-50"
                          />
                        ) : (
                          <div className="w-8 h-10 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-teal-600 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                            <p className="font-semibold text-slate-800 truncate text-xs">
                              {pdf.fileName}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {pdf.fileSize} · {badge.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePdf(pdf.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                        title="파일 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 border border-dashed border-sky-200 rounded-lg bg-white/50 text-[11px]">
                첨부된 파일이 없습니다. 여러 개의 파일(PDF, 워드, 한글, 이미지)을 업로드할 수 있습니다.
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
              disabled={isProcessingFile}
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
