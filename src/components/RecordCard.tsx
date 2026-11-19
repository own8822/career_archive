import React, { useState } from 'react';
import { FileText, Trash2, Edit2, Maximize2, ChevronDown, ChevronUp, Calendar, Download } from 'lucide-react';
import { CounselingRecord, PdfAttachment } from '../types';
import { getFileBadgeInfo } from '../utils/pdfThumbnail';

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

  // 수강취소 / 수강포기 기록인지 확인
  const isDropRecord =
    `${record.title || ''} ${record.content || ''}`.replace(/\s+/g, '').includes('수강취소') ||
    `${record.title || ''} ${record.content || ''}`.replace(/\s+/g, '').includes('수강포기');

  // 관리자 직접 다운로드 핸들러
  const handleDirectDownload = (pdf: PdfAttachment) => {
    if (!isAdmin) {
      alert('열람자 권한에서는 보안 정책상 원본 파일 다운로드가 허용되지 않습니다.');
      return;
    }
    if (pdf.dataUrl) {
      const a = document.createElement('a');
      a.href = pdf.dataUrl;
      a.download = pdf.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div
      className={`rounded-xl border shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col group ${
        isDropRecord
          ? 'bg-slate-100/90 border-slate-300/80 hover:border-slate-400'
          : 'bg-white border-slate-200/90 hover:border-teal-300'
      }`}
    >
      {/* 1. Attached Files inside Record (Thumbnails: w-full, h-14 = 56px, filename below) */}
      {record.pdfs && record.pdfs.length > 0 && (
        <div className="bg-gradient-to-b from-sky-50/70 to-slate-50/40 p-3 border-b border-sky-100/70 space-y-2.5">
          {record.pdfs.map((pdf) => {
            const badge = getFileBadgeInfo(pdf.fileName);
            const thumbSrc =
              pdf.thumbnailUrl ||
              (pdf.dataUrl && !pdf.dataUrl.startsWith('data:application/pdf')
                ? pdf.dataUrl
                : undefined);

            return (
              <div
                key={pdf.id}
                className="group/thumb relative w-full rounded-xl border border-slate-200/90 hover:border-teal-400 bg-white overflow-hidden transition-all shadow-2xs hover:shadow-xs"
              >
                {/* 1) Thumbnail Area: Full card width (w-full), height approx 48~64px (h-14 = 56px) */}
                <div
                  onClick={() => onOpenPdf(pdf)}
                  className="relative w-full h-14 bg-gradient-to-b from-slate-100 to-slate-200/60 overflow-hidden cursor-pointer flex items-start justify-center border-b border-slate-100"
                  title={`${pdf.fileName} (클릭하여 크게 미리보기)`}
                >
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt={pdf.fileName}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/thumb:scale-105"
                    />
                  ) : (
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

                  {/* Admin Only Quick Download Button (Top-Right) */}
                  {isAdmin && (
                    <div className="absolute top-1 right-1 flex items-center space-x-1 opacity-90 group-hover/thumb:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectDownload(pdf);
                        }}
                        className="p-1 rounded bg-black/60 hover:bg-black/85 text-white transition-colors cursor-pointer shadow-xs"
                        title="원본 다운로드 (관리자 전용)"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2) File Name & Details directly below thumbnail */}
                <div
                  onClick={() => onOpenPdf(pdf)}
                  className="p-2 bg-white cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <p
                    className="text-[11px] font-bold text-slate-800 group-hover/thumb:text-teal-700 truncate leading-snug"
                    title={pdf.fileName}
                  >
                    {pdf.fileName}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{pdf.fileSize}</span>
                    <span className="flex items-center text-teal-600 font-medium">
                      <Maximize2 className="w-2.5 h-2.5 mr-0.5" />
                      {isAdmin ? '미리보기 / 다운로드' : '화면 내 미리보기'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Card Content Area */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Card Top: Date & Admin Actions (Edit + Delete) */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="flex items-center text-slate-400">
                <Calendar className="w-3 h-3 mr-1" />
                {record.date}
              </span>
              {isDropRecord && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 border border-slate-300">
                  수강취소
                </span>
              )}
            </div>

            {isAdmin && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                  title="기록 수정"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                className="mt-1.5 inline-flex items-center text-[11px] font-semibold text-teal-600 hover:text-teal-800 transition-colors cursor-pointer"
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
