import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, UploadCloud, Trash2, Check, Paperclip, Loader2 } from 'lucide-react';
import { Student, CounselingRecord, PdfAttachment } from '../types';
import { generateAttachmentThumbnail, getFileBadgeInfo } from '../utils/pdfThumbnail';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preselectedStudent?: Student | null;
  recordToEdit?: CounselingRecord | null;
  initialFiles?: File[];
  onSaveRecord: (studentId: string, record: CounselingRecord, isEditing: boolean) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  students,
  preselectedStudent,
  recordToEdit,
  initialFiles,
  onSaveRecord,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pdfs, setPdfs] = useState<PdfAttachment[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Supported extensions: PDF, Word, Hancom HWP/HWPX, Images
  const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'hwp', 'hwpx', 'jpg', 'jpeg', 'png', 'webp'];

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);
    const newAttachments: PdfAttachment[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.toLowerCase().split('.').pop() || '';
      if (!ALLOWED_EXTS.includes(ext)) {
        errors.push(`${file.name}: 지원되지 않는 파일 형식입니다. (지원: PDF, Word, HWP, HWPX, 이미지)`);
        continue;
      }

      try {
        // Generate preview thumbnail (PDF page 1, real image, or Word/HWP badge)
        const { dataUrl, thumbnailUrl } = await generateAttachmentThumbnail(file);
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

        newAttachments.push({
          id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          fileName: file.name,
          fileSize: `${sizeMb} MB`,
          uploadedAt: new Date().toISOString().substring(0, 10),
          dataUrl,
          thumbnailUrl,
        });
      } catch (err) {
        console.error('File thumbnail generation failed:', err);
        errors.push(`${file.name}: 파일 처리 실패`);
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newAttachments.length > 0) {
      setPdfs((prev) => [...prev, ...newAttachments]);
    }
    setIsProcessingFile(false);
  };

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
      if (initialFiles && initialFiles.length > 0) {
        processFiles(initialFiles);
      }
    }
  }, [recordToEdit, preselectedStudent, students, isOpen, initialFiles]);

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
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
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
      pdfs,
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {recordToEdit ? '상담·첨삭 기록 수정' : '상담·첨삭 기록 등록'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentStudent ? `${currentStudent.name} (${currentStudent.cohort}) 카드에 파일과 함께 보관됩니다.` : '오늘 날짜로 자동 등록됩니다.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* 1. Target Student Selection (disabled if editing) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              학생 선택 <span className="text-teal-600">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={!!recordToEdit}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white disabled:opacity-70 disabled:bg-slate-100 font-medium"
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
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                기록 제목 <span className="text-teal-600">*</span>
              </label>
              <div className="flex items-center gap-1">
                {['1차 취업상담', '이력서·자소서 첨삭', '면접 코칭', '최종 합격', '수강포기'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setTitle(preset);
                      if (preset === '수강포기' && !content) {
                        setContent('수강포기');
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      preset === '수강포기'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/70'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 현대해상 자기소개서 첨삭 또는 1차 상담"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
              required
              autoFocus={!recordToEdit}
            />
            {title.replace(/\s+/g, '').includes('수강포기') && (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>'수강포기' 기록이 저장되면 해당 학생의 박스가 <strong>옅은 회색</strong>으로 전환됩니다.</span>
              </p>
            )}
          </div>

          {/* 3. Content (Preserves line breaks) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              상담 및 첨삭 내용 <span className="text-teal-600">*</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상담 결과, 피드백 코멘트, 개선 방향을 작성하세요. 줄바꿈이 그대로 보존됩니다."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white leading-relaxed font-sans"
              required
            />
          </div>

          {/* 4. File Attachment Area inside Record */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-4 rounded-xl border transition-all ${
              isDraggingOver
                ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-400'
                : 'bg-sky-50/50 border-sky-100'
            }`}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.hwp,.hwpx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <span className="font-semibold text-slate-800 flex items-center text-xs">
                  <Paperclip className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  기록 첨부파일 ({pdfs.length}개)
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  PDF, 워드(.doc/.docx), 한글(.hwp/.hwpx), 이미지 지원 (드래그앤드롭 가능)
                </p>
              </div>

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 text-xs font-semibold shadow-2xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isProcessingFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>파일 첨부</span>
                  </>
                )}
              </button>
            </div>

            {/* Drag & Drop Visual Hint */}
            {isDraggingOver && (
              <div className="py-3 px-4 mb-2 bg-teal-100/70 border border-dashed border-teal-400 rounded-xl text-center text-teal-800 font-semibold text-xs flex items-center justify-center space-x-2 animate-in fade-in">
                <UploadCloud className="w-4 h-4 text-teal-600 animate-bounce" />
                <span>여기에 파일을 놓으면 기록에 자동 첨부됩니다</span>
              </div>
            )}

            {/* List of attached files */}
            {pdfs.length > 0 ? (
              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                {pdfs.map((pdf) => {
                  const badge = getFileBadgeInfo(pdf.fileName);
                  return (
                    <div
                      key={pdf.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-teal-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 truncate pr-2">
                        {/* Mini Thumbnail */}
                        {pdf.thumbnailUrl ? (
                          <img
                            src={pdf.thumbnailUrl}
                            alt="Thumb"
                            className="w-8 h-10 object-cover object-top rounded border border-slate-200 shadow-2xs shrink-0 bg-slate-50"
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
                            <p className="font-semibold text-slate-800 truncate text-xs" title={pdf.fileName}>
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
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                        title="파일 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-4 text-center text-slate-400 border border-dashed border-sky-200 hover:border-teal-300 rounded-lg bg-white/60 hover:bg-white text-[11px] cursor-pointer transition-colors"
              >
                클릭하거나 파일을 드래그하여 상담 서류(PDF, 자소서, 이력서 등)를 첨부하세요.
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isProcessingFile}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{recordToEdit ? '기록 수정 완료' : '기록 등록 완료'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
