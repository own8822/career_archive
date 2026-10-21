import React from 'react';
import { X, FileText, Download, ZoomIn, ZoomOut } from 'lucide-react';
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
  const [zoom, setZoom] = React.useState(100);

  if (!pdf) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden border border-slate-700/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Topbar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                {studentName && (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    {studentName}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-slate-100 truncate">
                  {pdf.fileName}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                등록일: {pdf.uploadedAt} {pdf.fileSize ? `· ${pdf.fileSize}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs text-slate-300 border border-slate-700">
              <button 
                onClick={() => setZoom(prev => Math.max(75, prev - 25))} 
                className="p-1.5 hover:text-white"
                title="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px]">{zoom}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(150, prev + 25))} 
                className="p-1.5 hover:text-white"
                title="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download */}
            <button
              onClick={() => alert(`'${pdf.fileName}' 다운로드를 시작합니다.`)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="다운로드"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Document Body View */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-100 flex items-center justify-center">
          <div 
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-150 bg-white shadow-xl border border-slate-300 rounded-lg w-full max-w-xl min-h-[560px] p-8 sm:p-10 relative text-slate-800 flex flex-col justify-between"
          >
            <div>
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-3 mb-5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Career Guidance Document</span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">{pdf.title}</h4>
                </div>
                <span className="text-[11px] font-extrabold text-rose-600 border border-rose-400 bg-rose-50 px-2 py-0.5 rounded">
                  첨삭 완료본
                </span>
              </div>

              {/* Document Preview Content */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                <div className="p-3 bg-amber-50/70 border-l-3 border-amber-400 rounded text-slate-800">
                  <p className="font-semibold text-amber-900 mb-1">■ 주요 첨삭 메모 요약</p>
                  <p className="whitespace-pre-line text-slate-700">
                    {pdf.previewText || '첨삭된 본문 및 문맥 교정 내역이 포함되어 있습니다.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-600 space-y-2">
                  <p className="font-medium text-slate-800">■ 세부 교정 체크리스트</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>지원 기업 도메인 맞춤형 핵심 키워드 강조</li>
                    <li>모호한 형용사 배제 및 수치화된 성과 표현으로 정돈</li>
                    <li>두괄식 문장 구조 재배치 완료</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-400 flex justify-between font-mono">
              <span>{studentName || '학생'} 취업지도 첨삭 자료</span>
              <span>{pdf.fileName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
