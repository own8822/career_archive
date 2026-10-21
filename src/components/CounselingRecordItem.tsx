import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Calendar, 
  User as UserIcon, 
  CheckSquare, 
  Maximize2
} from 'lucide-react';
import { CounselingRecord, PdfReview } from '../types';

interface CounselingRecordItemProps {
  record: CounselingRecord;
  sessionIndex: number;
  onOpenPdf: (pdf: PdfReview) => void;
}

export const CounselingRecordItem: React.FC<CounselingRecordItemProps> = ({
  record,
  sessionIndex,
  onOpenPdf,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeBadge = (type: CounselingRecord['type']) => {
    switch (type) {
      case 'resume':
        return { label: '자소서·이력서', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'portfolio':
        return { label: '포트폴리오', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'interview':
        return { label: '모의면접', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      case 'career':
        return { label: '취업로드맵', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
      default:
        return { label: '일반상담', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  const badge = getTypeBadge(record.type);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden">
      
      {/* Record Header */}
      <div className="p-3.5 pb-2.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
              {sessionIndex}회차
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.label}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500 shrink-0">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              {record.date}
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center font-medium text-slate-600">
              <UserIcon className="w-3 h-3 mr-1 text-slate-400" />
              {record.counselorName}
            </span>
          </div>
        </div>

        {/* Title & Short Summary */}
        <h4 className="text-sm font-bold text-slate-900 leading-snug">
          {record.title}
        </h4>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          {record.summary}
        </p>
      </div>

      {/* Expandable Long Content (긴 상담 내용 접기/펼치기) */}
      <div className="px-3.5 pb-3">
        {isExpanded ? (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/80 p-3 rounded-lg border border-slate-200/70 font-sans">
              {record.content}
            </div>

            {/* Action Item Box */}
            {record.actionItem && (
              <div className="mt-2 p-2.5 bg-brand-50/60 border border-brand-200/80 rounded-lg flex items-start space-x-2 text-xs">
                <CheckSquare className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-brand-900">후속 과제:</span>{' '}
                  <span className="text-brand-800">{record.actionItem}</span>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Toggle Button for Long Content */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors py-0.5"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 mr-1" />
              상담 상세 피드백 접기
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 mr-1" />
              상담 상세 피드백 전문 펼쳐보기
            </>
          )}
        </button>

        {/* Tags */}
        {record.tags && record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100">
            {record.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* PDF Review Attachment Card with Thumbnail (PDF 첨삭지 썸네일 및 확대 보기) */}
        {record.pdfReview && (
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div 
              onClick={() => onOpenPdf(record.pdfReview!)}
              className="group bg-gradient-to-r from-rose-50/70 to-slate-50 border border-rose-200/80 hover:border-rose-300 rounded-xl p-2.5 flex items-center space-x-3 cursor-pointer transition-all hover:shadow-xs"
            >
              {/* PDF Mini Thumbnail preview illustration */}
              <div className="relative w-11 h-14 bg-white rounded border border-rose-300 shadow-2xs flex flex-col justify-between p-1.5 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div className="w-3 h-1 bg-slate-300 rounded-xs"></div>
                  <FileText className="w-3 h-3 text-rose-500" />
                </div>
                {/* Simulated red pen markup lines */}
                <div className="space-y-1">
                  <div className="w-full h-0.5 bg-slate-200 rounded"></div>
                  <div className="w-4/5 h-0.5 bg-rose-400 rounded"></div>
                  <div className="w-3/5 h-0.5 bg-slate-200 rounded"></div>
                </div>
                {/* Red pen badge */}
                <div className="w-full text-center bg-rose-500 text-white text-[8px] font-bold rounded-xs py-0.2">
                  PDF
                </div>
              </div>

              {/* PDF Info & Zoom Trigger */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                    첨삭 첨부
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {record.pdfReview.pageCount}p · {record.pdfReview.fileSize}
                  </span>
                </div>
                <h5 className="text-xs font-semibold text-slate-800 truncate group-hover:text-rose-600 transition-colors mt-0.5">
                  {record.pdfReview.title}
                </h5>
                <p className="text-[11px] text-slate-500 truncate">
                  코멘트 {record.pdfReview.annotations.length}건 수록 · 클릭 시 확대보기
                </p>
              </div>

              {/* Zoom Icon button */}
              <div className="p-1.5 rounded-lg bg-white group-hover:bg-rose-500 group-hover:text-white text-slate-400 border border-slate-200 group-hover:border-rose-500 transition-all shrink-0">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
