import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles
} from 'lucide-react';
import { PdfReview, Student } from '../types';

interface PdfViewerModalProps {
  pdfReview: PdfReview | null;
  student: Student | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  pdfReview,
  student,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!pdfReview || !student) return null;

  const totalPages = pdfReview.pageCount || 1;
  const pageAnnotations = pdfReview.annotations.filter(a => a.page === currentPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleZoomIn = () => {
    if (zoomLevel < 150) setZoomLevel(prev => prev + 25);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 75) setZoomLevel(prev => prev - 25);
  };

  const handleDownload = () => {
    alert(`[가상 다운로드] '${pdfReview.originalFileName}' 첨삭본 파일 다운로드가 시작되었습니다.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-700/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {student.name} ({student.cohort})
                </span>
                <h3 className="text-sm font-semibold text-slate-100 truncate">
                  {pdfReview.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 truncate">
                원본 파일: {pdfReview.originalFileName} ({pdfReview.fileSize}) · 업로드: {pdfReview.uploadedAt}
              </p>
            </div>
          </div>

          {/* Controls: Zoom, Page nav, Download, Close */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 text-xs text-slate-300 border border-slate-700">
              <button 
                onClick={handleZoomOut} 
                disabled={zoomLevel <= 75}
                className="p-1.5 hover:text-white disabled:opacity-40" 
                title="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono">{zoomLevel}%</span>
              <button 
                onClick={handleZoomIn} 
                disabled={zoomLevel >= 150}
                className="p-1.5 hover:text-white disabled:opacity-40" 
                title="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs text-slate-300 border border-slate-700">
              <button 
                onClick={handlePrevPage} 
                disabled={currentPage <= 1}
                className="p-1.5 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={handleNextPage} 
                disabled={currentPage >= totalPages}
                className="p-1.5 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="첨삭 PDF 다운로드"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
              title="닫기 (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body (Document Area + Feedback Panel) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
          
          {/* PDF Page Canvas Preview Container */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center">
            <div 
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="transition-transform duration-150 bg-white shadow-xl border border-slate-300 rounded-lg w-full max-w-2xl min-h-[640px] p-8 sm:p-12 relative text-slate-800 flex flex-col justify-between"
            >
              {/* Document Header stamp */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Career Mentoring Archive</span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{student.name} - {student.targetRole} 지원 서류</h2>
                    <p className="text-xs text-slate-500 mt-0.5">희망 기업: {student.targetCompanies.join(', ')} | 첨삭일: {pdfReview.uploadedAt.split(' ')[0]}</p>
                  </div>
                  <div className="border-2 border-rose-500 text-rose-600 font-extrabold text-xs px-2.5 py-1 rounded rotate-[-6deg] uppercase tracking-wider">
                    첨삭 완료 [Page {currentPage}]
                  </div>
                </div>
              </div>

              {/* Document Mock Page Body */}
              <div className="space-y-6 text-sm leading-relaxed flex-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1. 직무 수행 경험 및 핵심 역량</h4>
                  <div className="p-3 bg-amber-50/70 border-l-4 border-amber-400 rounded-r text-slate-700 relative">
                    <p className="italic">
                      "{pageAnnotations[0]?.quote || '사용자 관점에서 출발하여 문제의 본질을 분석하고, 주도적으로 성능 개선을 이끌어냈습니다.'}"
                    </p>
                    <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                      1
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    실제 서비스 운영 환경에서 발생할 수 있는 네트워크 지연 및 데이터 일관성 문제를 다각도로 검토하였으며, 이를 방지하기 위한 캐싱 정책과 예외 처리 로직을 체계적으로 수립하였습니다.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">2. 협업 및 문제 해결 과정</h4>
                  <div className="p-3 bg-blue-50/70 border-l-4 border-blue-400 rounded-r text-slate-700 relative">
                    <p className="italic">
                      "{pageAnnotations[1]?.quote || '팀원들과의 주간 기술 공유 세션을 신설하여 개발 스펙에 대한 이견을 조율하고 지연을 방지하였습니다.'}"
                    </p>
                    {pageAnnotations.length > 1 && (
                      <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                        2
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    프로젝트 마감 기한이 임박했던 시점, 서로 다른 도메인 간의 인터페이스 충돌 문제를 해결하기 위해 공통 명세서를 신속히 작성하고 테스트 코드를 보강함으로써 성공적으로 배포를 완수했습니다.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold text-slate-700">첨삭 요약 안내</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {pdfReview.summary}
                  </p>
                </div>
              </div>

              {/* Document Page Footer */}
              <div className="border-t border-slate-200 pt-4 mt-8 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <span>CONFIDENTIAL - CAREER ARCHIVE</span>
                <span>- {currentPage} -</span>
                <span>{pdfReview.originalFileName}</span>
              </div>
            </div>
          </div>

          {/* Right Feedback / Annotations Sidebar */}
          <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  컨설턴트 첨삭 코멘트 ({pdfReview.annotations.length}건)
                </h4>
                <p className="text-[11px] text-slate-500">
                  현재 {currentPage}페이지 관련 코멘트: {pageAnnotations.length}건
                </p>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-100 text-rose-700 rounded-full">
                피드백 마킹
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pdfReview.annotations.map((ann, idx) => {
                const isCurrentPage = ann.page === currentPage;
                return (
                  <div 
                    key={ann.id}
                    onClick={() => setCurrentPage(ann.page)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isCurrentPage
                        ? 'border-brand-500 bg-brand-50/40 shadow-xs ring-1 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">
                          {ann.page}페이지
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        ann.type === 'praise'
                          ? 'bg-emerald-100 text-emerald-700'
                          : ann.type === 'improve'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {ann.type === 'praise' ? '칭찬/강점' : ann.type === 'improve' ? '보완 필요' : '어조/문맥'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 bg-slate-100/80 p-2 rounded border border-slate-200/60 font-serif italic mb-2 line-clamp-2">
                      "{ann.quote}"
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {ann.comment}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>작성: {ann.author}</span>
                      {isCurrentPage && <span className="text-brand-600 font-semibold">현재 페이지 보기 중</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <p className="text-[11px] text-slate-500">
                코멘트를 클릭하면 해당 페이지로 바로 이동합니다.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
