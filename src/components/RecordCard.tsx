import React, { useState } from 'react';
import { FileText, Trash2, Maximize2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { CounselingRecord, PdfAttachment } from '../types';

interface RecordCardProps {
  record: CounselingRecord;
  isAdmin: boolean;
  onDelete: () => void;
  onOpenPdf: (pdf: PdfAttachment) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  isAdmin,
  onDelete,
  onOpenPdf,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 긴 내용인지 판별
  const isLong = record.content.length > 110 || record.content.split('\n').length > 3;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all overflow-hidden flex flex-col group">
      
      {/* 1. PDF First-page Image Thumbnail (Padlet-style visual preview at top) */}
      {record.pdf && (
        <div 
          onClick={() => onOpenPdf(record.pdf!)}
          className="relative bg-gradient-to-b from-sky-50 to-slate-100 p-3.5 border-b border-slate-100 cursor-pointer overflow-hidden group/pdf"
        >
          {/* Simulated First Page A4 Sheet */}
          <div className="bg-white rounded-lg shadow-2xs border border-slate-200 p-3 transition-transform duration-200 group-hover/pdf:scale-[1.01] flex flex-col justify-between min-h-[140px]">
            <div>
              {/* Document Header Line */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                <span className="text-[9px] font-bold tracking-wider text-teal-700 uppercase">
                  PDF 첨삭자료
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {record.pdf.fileSize || '1.5 MB'}
                </span>
              </div>

              {/* Title inside document */}
              <p className="text-[11px] font-bold text-slate-800 line-clamp-1 mb-1.5">
                {record.pdf.fileName}
              </p>

              {/* Preview Snippet / Simulated Red-pen Markup */}
              <div className="space-y-1 text-[10px] text-slate-500 bg-amber-50/60 p-2 rounded border border-amber-200/60 font-sans">
                <div className="flex items-center space-x-1 text-rose-600 font-semibold text-[9px] mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>첨삭 메모 미리보기:</span>
                </div>
                <p className="line-clamp-2 leading-relaxed text-slate-600">
                  {record.pdf.previewSnippet}
                </p>
              </div>
            </div>

            {/* Bottom Sheet Indicator */}
            <div className="pt-2 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100">
              <span className="flex items-center text-teal-600 font-semibold">
                <FileText className="w-3 h-3 mr-1" />
                첫 페이지 썸네일
              </span>
              <span className="text-slate-400">클릭하여 확대</span>
            </div>
          </div>

          {/* Hover Overlay with Zoom Icon */}
          <div className="absolute inset-0 bg-teal-900/10 opacity-0 group-hover/pdf:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/95 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold shadow-xs flex items-center space-x-1 border border-teal-200">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>확대 열람</span>
            </span>
          </div>
        </div>
      )}

      {/* 2. Card Content Area */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Card Top: Date & Admin Delete button */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center text-slate-400">
              <Calendar className="w-3 h-3 mr-1" />
              {record.date}
            </span>

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-0.5 rounded transition-all"
                title="기록 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-slate-900 leading-snug">
            {record.title}
          </h4>

          {/* Content Body with '더 보기' / '접기' */}
          <div className="text-xs text-slate-600 leading-relaxed font-sans">
            <div className={!isExpanded && isLong ? 'line-clamp-3' : 'whitespace-pre-line'}>
              {record.content}
            </div>

            {isLong && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1.5 inline-flex items-center text-[11px] font-semibold text-teal-600 hover:text-teal-800 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-0.5" /> 접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-0.5" /> 더 보기
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
