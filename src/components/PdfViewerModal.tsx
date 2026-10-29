import React from 'react';
import { X, FileText, Download } from 'lucide-react';
import { PdfAttachment } from '../types';

interface PdfViewerModalProps {
  pdf: PdfAttachment | null;
  studentName?: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  pdf,
  studentName,
  onClose,
}) => {
  if (!pdf) return null;

  // Real download handler
  const handleDownload = () => {
    if (pdf.dataUrl) {
      const a = document.createElement('a');
      a.href = pdf.dataUrl;
      a.download = pdf.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Mock download
      const blob = new Blob([`[PDF Document: ${pdf.fileName}]\n학생: ${studentName || ''}\n등록일: ${pdf.uploadedAt}`], { type: 'application/pdf' });
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

  const hasRealPdfData = !!pdf.dataUrl && pdf.dataUrl.startsWith('data:application/pdf');

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 animate-in fade-in duration-150"
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
            {/* Download Original File Button */}
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
              title="PDF 원본 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">다운로드</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main View: If actual PDF data exists, render real embedded iframe. Otherwise render page 1 graphic. */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-3 sm:p-6">
          {hasRealPdfData ? (
            <iframe
              src={pdf.dataUrl}
              title={pdf.fileName}
              className="w-full h-full rounded-xl border border-slate-300 shadow-md bg-white"
            />
          ) : (
            <div className="bg-white shadow-xl border border-sky-100 rounded-xl w-full max-w-xl min-h-[560px] p-8 sm:p-10 flex flex-col justify-between text-slate-800">
              <div>
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-5 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-teal-700 uppercase">CAREER ARCHIVE DOCUMENT</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{pdf.fileName}</h4>
                  </div>
                  <span className="text-[11px] font-extrabold text-teal-700 border border-teal-300 bg-teal-50 px-2.5 py-0.5 rounded-full">
                    전체 열람 뷰
                  </span>
                </div>

                {/* Page 1 Thumbnail Image */}
                {pdf.thumbnailUrl && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={pdf.thumbnailUrl}
                      alt="Thumbnail"
                      className="max-h-[300px] rounded-lg shadow-xs border border-slate-200 object-contain"
                    />
                  </div>
                )}

                <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-800">■ 첨삭 문서 상세 정보</p>
                  <p>파일명: {pdf.fileName} ({pdf.fileSize})</p>
                  <p>등록 학생: {studentName || '학생'}</p>
                  <p>우측 상단의 [다운로드] 버튼을 눌러 원본 파일을 저장할 수 있습니다.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-400 flex justify-between font-mono">
                <span>{studentName || '학생'} 취업지원 첨삭 자료</span>
                <span>{pdf.fileName}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
