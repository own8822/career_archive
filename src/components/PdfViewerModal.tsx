import React from 'react';
import { X, FileText, Download, Lock } from 'lucide-react';
import { PdfAttachment } from '../types';
import { getFileCategory, getFileBadgeInfo } from '../utils/pdfThumbnail';

interface PdfViewerModalProps {
  pdf: PdfAttachment | null;
  studentName?: string;
  isAdmin?: boolean;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  pdf,
  studentName,
  isAdmin = false,
  onClose,
}) => {
  if (!pdf) return null;

  const cat = getFileCategory(pdf.fileName);
  const badge = getFileBadgeInfo(pdf.fileName);

  // Real download handler (Admin Only)
  const handleDownload = async () => {
    if (!isAdmin) {
      alert('열람자 권한에서는 보안 정책상 원본 파일 다운로드가 허용되지 않습니다.');
      return;
    }

    if (pdf.dataUrl) {
      if (pdf.dataUrl.startsWith('http://') || pdf.dataUrl.startsWith('https://')) {
        try {
          const resp = await fetch(pdf.dataUrl);
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = pdf.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          return;
        } catch {
          // fallback to direct link
        }
      }
      const a = document.createElement('a');
      a.href = pdf.dataUrl;
      a.download = pdf.fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Mock download fallback
      const blob = new Blob(
        [`[Document: ${pdf.fileName}]\n학생: ${studentName || ''}\n등록일: ${pdf.uploadedAt}`],
        { type: 'application/octet-stream' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const hasRealPdfData =
    cat === 'pdf' &&
    !!pdf.dataUrl &&
    (pdf.dataUrl.startsWith('data:application/pdf') ||
      pdf.dataUrl.startsWith('blob:') ||
      pdf.dataUrl.includes('.pdf'));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topbar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                {studentName && (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                    {studentName} 학생
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  {badge.label}
                </span>
                <h3 className="text-sm font-semibold text-slate-100 truncate">
                  {pdf.fileName}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                등록일자: {pdf.uploadedAt} · {pdf.fileSize}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Download Original File Button (Admin Only) */}
            {isAdmin ? (
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="원본 파일 다운로드"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">다운로드</span>
              </button>
            ) : (
              /* Viewer Mode: View-Only Badge (No download provided) */
              <div
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                title="열람자 권한: 화면 내 열람 전용 (다운로드 불가)"
              >
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">열람 전용</span>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main View */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-3 sm:p-6">
          {/* 1. PDF File View */}
          {hasRealPdfData ? (
            <iframe
              src={pdf.dataUrl}
              title={pdf.fileName}
              className="w-full h-full rounded-xl border border-slate-300 shadow-md bg-white"
            />
          ) : cat === 'image' ? (
            /* 2. Image File View (JPG, PNG) */
            <div className="w-full h-full flex flex-col items-center justify-center p-2">
              <img
                src={pdf.dataUrl || pdf.thumbnailUrl}
                alt={pdf.fileName}
                className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-lg border border-slate-200 bg-white"
              />
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {pdf.fileName} ({pdf.fileSize})
              </p>
            </div>
          ) : (
            /* 3. Word, HWP, or Document View (First-Page Rendering) */
            <div className="bg-white shadow-xl border border-sky-100 rounded-2xl w-full max-w-lg p-5 sm:p-7 flex flex-col items-center text-center text-slate-800 max-h-[85vh] overflow-y-auto">
              {/* Document First-Page Preview */}
              {(pdf.thumbnailUrl || pdf.dataUrl) && (
                <div className="mb-4 shadow-md rounded-lg overflow-hidden border border-slate-200 bg-white max-h-[460px]">
                  <img
                    src={pdf.thumbnailUrl || pdf.dataUrl}
                    alt={pdf.fileName}
                    className="w-full h-auto max-h-[440px] object-contain bg-white"
                  />
                </div>
              )}

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border mb-2 ${badge.bg} ${badge.text} ${badge.border}`}
              >
                {badge.desc}
              </span>
              <h4 className="text-base font-bold text-slate-900 mb-1">{pdf.fileName}</h4>
              <p className="text-xs text-slate-400 mb-4">
                {pdf.fileSize} · 등록일: {pdf.uploadedAt}
              </p>

              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-slate-600 space-y-1 mb-4 w-full text-left">
                <p className="font-semibold text-slate-800">■ 문서 열람 안내</p>
                <p>학생: {studentName || '학생'}</p>
                <p className="text-slate-500">
                  {isAdmin
                    ? '관리자는 아래 버튼을 통해 원본 문서를 다운로드하여 전체 내용을 편집 및 열람할 수 있습니다.'
                    : '열람자 권한에서는 보안 정책상 화면 내 첫 페이지 미리보기만 제공되며 원본 파일 다운로드가 제한됩니다.'}
                </p>
              </div>

              {/* Bottom Action: Admin gets Download, Viewer gets Security Notice */}
              {isAdmin ? (
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>원본 파일 다운로드 및 열기</span>
                </button>
              ) : (
                <div className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>열람자 권한: 화면 내 미리보기 전용 (다운로드 제한됨)</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
