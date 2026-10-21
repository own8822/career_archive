import React, { useState } from 'react';
import { FileText, Trash2, Edit2, Maximize2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { CounselingRecord, PdfAttachment } from '../types';

interface RecordCardProps {
  record: CounselingRecord;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onOpenPdf: (pdf: PdfAttachment) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  isAdmin,
  onEdit,
  onDelete,
  onOpenPdf,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 긴 내용인지 판별
  const isLong = record.content.length > 120 || record.content.split('\n').length > 3;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-teal-300 transition-all overflow-hidden flex flex-col group">
      
      {/* 1. PDF Attachments List (First page thumbnails) */}
      {record.pdfs && record.pdfs.length > 0 && (
        <div className="bg-gradient-to-b from-sky-50/80 to-slate-50/50 p-3 border-b border-sky-100/70 space-y-2">
          {record.pdfs.map((pdf) => (
            <div
              key={pdf.id}
              onClick={() => onOpenPdf(pdf)}
              className="relative bg-white rounded-lg p-2.5 border border-sky-200/80 hover:border-teal-400 shadow-2xs cursor-pointer transition-all flex items-center space-x-3 group/thumb"
            >
              {/* Real Page 1 Image Thumbnail */}
              <div className="w-12 h-16 bg-slate-50 rounded border border-slate-200 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                {pdf.thumbnailUrl ? (
                  <img
                    src={pdf.thumbnailUrl}
                    alt={pdf.fileName}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                  />
                ) : (
                  <FileText className="w-6 h-6 text-rose-500" />
                )}
              </div>

              {/* PDF Info & Zoom label */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5 mb-0.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                    PDF 1p
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pdf.fileSize}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 truncate group-hover/thumb:text-teal-700 transition-colors">
                  {pdf.fileName}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center mt-0.5">
                  <Maximize2 className="w-3 h-3 mr-1 text-teal-600" />
                  클릭하여 전체 확대 열람
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Card Content Area */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Card Top: Date & Admin Actions (Edit + Delete) */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center text-slate-400">
              <Calendar className="w-3 h-3 mr-1" />
              {record.date}
            </span>

            {isAdmin && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  title="기록 수정"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="기록 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-slate-900 leading-snug">
            {record.title}
          </h4>

          {/* Content Body with '더 보기' / '접기' (Preserves Line breaks) */}
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
