import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Paperclip,
  Download,
  Loader2,
  UploadCloud,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Student, CounselingRecord, PdfAttachment, StudentAttachment } from '../types';
import { RecordCard } from './RecordCard';
import { archiveStorage, isSupportedAttachment } from '../services/storage';
import { getFileBadgeInfo } from '../utils/pdfThumbnail';

interface PadletColumnProps {
  student: Student;
  isAdmin: boolean;
  onAddRecord: (student: Student) => void;
  onEditRecord: (student: Student, record: CounselingRecord) => void;
  onDeleteRecord: (studentId: string, recordId: string) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenPdf: (pdf: PdfAttachment, studentName: string) => void;
  onUpdateAttachments?: (studentId: string, attachments: StudentAttachment[]) => void;
}

export const PadletColumn: React.FC<PadletColumnProps> = ({
  student,
  isAdmin,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onEditStudent,
  onDeleteStudent,
  onOpenPdf,
  onUpdateAttachments,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Check if student has '수강포기' anywhere in records or memo
  const isDropped =
    student.records.some((record) => {
      const combined = `${record.title || ''} ${record.content || ''}`.replace(/\s+/g, '');
      return combined.includes('수강포기');
    }) || (student.memo || '').replace(/\s+/g, '').includes('수강포기');

  // Handle Multi-file Upload
  const handleUploadFiles = async (files: File[]) => {
    if (!isAdmin || files.length === 0) return;
    setErrorMessage(null);

    // 1. Validate formats
    const invalidFiles = files.filter((f) => !isSupportedAttachment(f.name));
    if (invalidFiles.length > 0) {
      setErrorMessage(
        `지원하지 않는 파일 형식입니다: ${invalidFiles.map((f) => f.name).join(', ')} (지원 형식: PDF, HWP, HWPX, PNG, JPG, DOC, DOCX)`
      );
      return;
    }

    setIsUploading(true);
    const uploadedAttachments: StudentAttachment[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgressText(`업로드 중... (${i + 1}/${files.length}) ${file.name}`);
      try {
        const att = await archiveStorage.uploadStudentAttachment(student.id, file);
        uploadedAttachments.push(att);
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err);
        errors.push(`${file.name}: ${err.message || '업로드 실패'}`);
      }
    }

    setIsUploading(false);
    setUploadProgressText('');

    if (errors.length > 0) {
      setErrorMessage(`일부 파일 업로드 실패:\n${errors.join('\n')}`);
    }

    if (uploadedAttachments.length > 0) {
      const currentList = student.attachments || [];
      const updatedList = [...uploadedAttachments, ...currentList];
      onUpdateAttachments?.(student.id, updatedList);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(Array.from(e.target.files));
    }
  };

  // Drag & Drop handlers on Card
  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    // Only unset if leaving card bounds
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Preview handler (PDF, Image)
  const handlePreview = async (att: StudentAttachment) => {
    try {
      let dataUrl = att.dataUrl;
      if (!dataUrl) {
        dataUrl = await archiveStorage.getAttachmentDownloadUrl(att);
      }
      onOpenPdf(
        {
          id: att.id,
          fileName: att.fileName,
          fileSize: att.fileSize,
          uploadedAt: att.uploadedAt,
          dataUrl: dataUrl || '',
          thumbnailUrl: att.thumbnailUrl,
        },
        student.name
      );
    } catch (err: any) {
      alert(`파일 미리보기를 불러올 수 없습니다: ${err?.message || ''}`);
    }
  };

  // Download handler (Admin Only)
  const handleDownload = async (att: StudentAttachment) => {
    if (!isAdmin) {
      alert('열람자 권한에서는 보안 정책상 원본 파일 다운로드가 허용되지 않습니다.');
      return;
    }
    try {
      setDownloadingId(att.id);
      await archiveStorage.downloadStudentAttachment(att);
    } catch (err: any) {
      alert(`다운로드 실패: ${err?.message || '네트워크 오류'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete handler (Admin only)
  const handleDeleteAttachment = async (attachmentId: string, fileName: string, storagePath?: string) => {
    if (!isAdmin) return;
    if (!confirm(`'${fileName}' 첨부파일을 삭제하시겠습니까?`)) return;

    try {
      await archiveStorage.deleteStudentAttachment(student.id, attachmentId, storagePath);
      const updatedList = (student.attachments || []).filter((a) => a.id !== attachmentId);
      onUpdateAttachments?.(student.id, updatedList);
    } catch (err: any) {
      alert(`첨부파일 삭제 실패: ${err?.message || ''}`);
    }
  };

  const attachments = student.attachments || [];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full rounded-2xl transition-all ${
        isDropped
          ? 'bg-slate-100/95 backdrop-blur-md border border-slate-300 shadow-2xs hover:shadow-xs hover:border-slate-400'
          : 'bg-white/80 backdrop-blur-md border border-sky-100/90 shadow-2xs hover:shadow-xs hover:border-teal-300'
      } ${isDraggingOver ? 'ring-2 ring-teal-500 border-teal-500 scale-[1.01]' : ''}`}
    >
      {/* Drag & Drop Visual Overlay (Admin Only) */}
      {isDraggingOver && isAdmin && (
        <div className="absolute inset-0 z-30 bg-teal-600/10 border-2 border-dashed border-teal-500 rounded-2xl flex flex-col items-center justify-center p-4 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-150">
          <div className="p-3 bg-white text-teal-700 rounded-2xl shadow-lg border border-teal-200 flex items-center space-x-2.5">
            <UploadCloud className="w-6 h-6 text-teal-600 animate-bounce" />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">
                {student.name} 학생에게 파일 놓기
              </p>
              <p className="text-[10px] text-teal-600">
                놓으면 자동으로 첨부됩니다 (PDF, HWP, Word, 이미지)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Column Header: Student Name + Cohort + Academic & Contact Info */}
      <div
        className={`p-4 pb-3 border-b rounded-t-2xl transition-colors ${
          isDropped
            ? 'border-slate-300/80 bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/60'
            : 'border-sky-100/70 bg-gradient-to-r from-white via-sky-50/30 to-teal-50/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            {student.orderNo && (
              <span
                className={`text-[10px] font-mono px-1 py-0.5 rounded shrink-0 ${
                  isDropped ? 'text-slate-500 bg-slate-200/90' : 'text-slate-400 bg-slate-100'
                }`}
              >
                #{student.orderNo}
              </span>
            )}
            <h3
              className={`text-base font-bold truncate tracking-tight ${
                isDropped
                  ? 'text-slate-600 line-through decoration-slate-400'
                  : 'text-slate-800'
              }`}
            >
              {student.name}
            </h3>

            {/* Cohort Badge */}
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                isDropped
                  ? 'bg-slate-200/90 text-slate-600 border border-slate-300'
                  : 'bg-teal-50 text-teal-700 border border-teal-200/80'
              }`}
            >
              {student.cohort}
            </span>

            {/* Dropped Badge (수강포기 뱃지) */}
            {isDropped && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-300 text-slate-700 border border-slate-400/80 shrink-0 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span>수강포기</span>
              </span>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => onEditStudent(student)}
                className="text-slate-300 hover:text-teal-600 p-1 rounded-md transition-colors cursor-pointer"
                title="학생 정보 수정"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`'${student.name}' 학생의 모든 기록과 카드를 삭제하시겠습니까?`)) {
                    onDeleteStudent(student.id);
                  }
                }}
                className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                title="학생 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Academic Info: University & Majors */}
        {(student.university || student.major1) && (
          <div
            className={`mt-1 text-[11px] truncate flex items-center space-x-1 ${
              isDropped ? 'text-slate-500' : 'text-slate-600'
            }`}
          >
            <span className={isDropped ? 'font-medium text-slate-600' : 'font-semibold text-slate-700'}>
              {student.university}
            </span>
            {student.major1 && <span>· {student.major1}</span>}
            {student.major2 && <span className="text-slate-400">({student.major2})</span>}
          </div>
        )}

        {/* Contact & Birth Info */}
        {(student.phone || student.email || student.birthYear) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
            {student.birthYear && (
              <span
                className={`px-1.5 py-0.5 rounded ${
                  isDropped ? 'bg-slate-200/80 text-slate-600' : 'bg-slate-100/90 text-slate-600'
                }`}
              >
                {student.birthYear}년생
              </span>
            )}
            {student.phone && (
              <a
                href={`tel:${student.phone}`}
                className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
                  isDropped
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-600'
                    : 'bg-slate-100/90 hover:bg-teal-50 hover:text-teal-700 text-slate-600'
                }`}
                title="전화 걸기"
              >
                {student.phone}
              </a>
            )}
            {student.email && (
              <a
                href={`mailto:${student.email}`}
                className={`px-1.5 py-0.5 rounded transition-colors truncate max-w-[140px] ${
                  isDropped
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-600'
                    : 'bg-slate-100/90 hover:bg-teal-50 hover:text-teal-700 text-slate-600'
                }`}
                title={student.email}
              >
                {student.email}
              </a>
            )}
          </div>
        )}
      </div>

      {/* 1. Quick Add Record Button directly under student header (Admin only) */}
      {isAdmin && (
        <div className="px-3.5 pt-3">
          <button
            onClick={() => onAddRecord(student)}
            className={`w-full py-1.5 px-3 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center space-x-1 transition-all shadow-2xs active:scale-[0.99] cursor-pointer ${
              isDropped
                ? 'border-slate-300 hover:border-slate-400 bg-slate-200/60 hover:bg-slate-200 text-slate-600'
                : 'border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-700'
            }`}
            title={`${student.name} 학생에게 새 상담·첨삭 기록 추가`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>기록 추가</span>
          </button>
        </div>
      )}

      {/* 2. File Attachment Button & File List directly below '기록 추가' */}
      <div className="px-3.5 pt-2">
        {/* Hidden File Input for Multiple Uploads */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.hwp,.hwpx,.png,.jpg,.jpeg,.webp,.doc,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* '파일 첨부' Button (Admin Only) */}
        {isAdmin && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-full py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-2xs active:scale-[0.99] cursor-pointer ${
              isUploading
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : isDropped
                ? 'border-slate-300 hover:border-slate-400 bg-white/70 hover:bg-slate-100 text-slate-700'
                : 'border-sky-200 hover:border-teal-400 bg-white/90 hover:bg-teal-50/70 text-slate-700 hover:text-teal-700'
            }`}
            title="PDF, HWP, HWPX, Word, 이미지 파일 첨부 (다중 선택 및 드래그앤드롭 가능)"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span className="truncate">{uploadProgressText || '업로드 중...'}</span>
              </>
            ) : (
              <>
                <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                <span>파일 첨부</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (PDF·HWP·워드·이미지)
                </span>
              </>
            )}
          </button>
        )}

        {/* Error Cause Banner */}
        {errorMessage && (
          <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start justify-between space-x-1.5 animate-in fade-in duration-150">
            <div className="flex items-start space-x-1.5 overflow-hidden">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-tight whitespace-pre-line truncate">
                {errorMessage}
              </span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700 shrink-0 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Attached Files List Container */}
        {attachments.length > 0 && (
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center space-x-1">
                <Paperclip className="w-3 h-3 text-teal-600" />
                <span>첨부파일 ({attachments.length})</span>
              </span>
              {isAdmin ? (
                <span className="text-[10px] text-slate-400 font-normal">
                  드래그하여 추가
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-normal">
                  클릭 시 화면 내 미리보기
                </span>
              )}
            </div>

            {/* List of Thumbnail Cards (Width: w-full, Height: h-14 = 56px approx 48~64px) */}
            <div className="space-y-2">
              {attachments.map((att) => {
                const badge = getFileBadgeInfo(att.fileName);
                const isItemDownloading = downloadingId === att.id;
                const thumbSrc =
                  att.thumbnailUrl ||
                  (att.dataUrl && !att.dataUrl.startsWith('data:application/pdf')
                    ? att.dataUrl
                    : undefined);

                return (
                  <div
                    key={att.id}
                    className="group relative w-full rounded-xl border border-slate-200/90 hover:border-teal-400 bg-white overflow-hidden transition-all shadow-2xs hover:shadow-xs"
                  >
                    {/* 1. Thumbnail Container (w-full, height: 56px approx 48~64px) */}
                    <div
                      onClick={() => handlePreview(att)}
                      className="relative w-full h-14 bg-gradient-to-b from-slate-100 to-slate-200/60 overflow-hidden cursor-pointer flex items-start justify-center border-b border-slate-100"
                      title={`${att.fileName} (클릭하여 크게 미리보기)`}
                    >
                      {thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={att.fileName}
                          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        /* Document page placeholder with title */
                        <div className="w-full h-full p-2 bg-slate-50 flex flex-col justify-center text-left">
                          <div className="flex items-center space-x-1 text-slate-500 mb-0.5">
                            <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="text-[10px] font-mono text-slate-500 truncate">
                              문서 첫 페이지
                            </span>
                          </div>
                          <div className="w-3/4 h-1.5 bg-slate-200 rounded-sm mb-1"></div>
                          <div className="w-1/2 h-1.5 bg-slate-200 rounded-sm"></div>
                        </div>
                      )}

                      {/* Format Badge Overlay (Top-Left) */}
                      <div className="absolute top-1.5 left-1.5 pointer-events-none">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs border backdrop-blur-md ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Admin Only Controls Overlay (Top-Right): Download & Delete */}
                      {isAdmin && (
                        <div className="absolute top-1 right-1 flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(att);
                            }}
                            disabled={isItemDownloading}
                            className="p-1 rounded bg-black/60 hover:bg-black/85 text-white transition-colors cursor-pointer shadow-xs"
                            title="원본 다운로드 (관리자 전용)"
                          >
                            {isItemDownloading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-teal-300" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAttachment(att.id, att.fileName, att.storagePath);
                            }}
                            className="p-1 rounded bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs"
                            title="파일 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. File Name & Details directly below thumbnail */}
                    <div
                      onClick={() => handlePreview(att)}
                      className="p-2 bg-white cursor-pointer hover:bg-slate-50/70 transition-colors"
                    >
                      <p
                        className="text-[11px] font-bold text-slate-800 group-hover:text-teal-700 truncate leading-snug"
                        title={att.fileName}
                      >
                        {att.fileName}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>{att.fileSize}</span>
                        <span>{att.uploadedAt}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Vertical Stack of Records: No inner scrollbar, auto height */}
      <div className="p-3.5 space-y-3">
        {student.records.length > 0 ? (
          student.records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              isAdmin={isAdmin}
              onEdit={() => onEditRecord(student, record)}
              onDelete={() => {
                if (confirm(`'${record.title}' 기록을 삭제하시겠습니까?`)) {
                  onDeleteRecord(student.id, record.id);
                }
              }}
              onOpenPdf={(pdf) => onOpenPdf(pdf, student.name)}
            />
          ))
        ) : (
          <div className="py-6 px-4 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            등록된 기록이 없습니다.
            {isAdmin && (
              <p className="text-[11px] text-teal-600 font-medium mt-1">
                위의 '+ 기록 추가' 버튼을 눌러보세요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
