import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2, 
  Maximize2, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { Student, CounselingRecord, PdfAttachment } from '../types';
import { useAuth } from '../context/AuthContext';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  onOpenAddRecordForStudent: (student: Student) => void;
  onDeleteRecord: (studentId: string, recordId: string) => void;
  onOpenPdf: (pdf: PdfAttachment, studentName: string) => void;
}

// Individual Record Item with Collapsible Long Content
const RecordItem: React.FC<{
  record: CounselingRecord;
  isAdmin: boolean;
  onDelete: () => void;
  onOpenPdf: (pdf: PdfAttachment) => void;
}> = ({ record, isAdmin, onDelete, onOpenPdf }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 긴 내용인지 판별 (글자수 120자 이상이거나 줄바꿈 3개 이상)
  const isLongContent = record.content.length > 120 || record.content.split('\n').length > 3;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
      {/* Top: Date and Admin Delete */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{record.date}</span>
        </div>

        {isAdmin && (
          <button
            onClick={onDelete}
            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
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

      {/* Content (본문) with Collapsible */}
      <div className="text-xs text-slate-700 leading-relaxed font-sans">
        <div className={!isExpanded && isLongContent ? 'line-clamp-3' : 'whitespace-pre-line'}>
          {record.content}
        </div>

        {isLongContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 inline-flex items-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 mr-0.5" /> 내용 접기
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 mr-0.5" /> 내용 더보기
              </>
            )}
          </button>
        )}
      </div>

      {/* PDF Small Thumbnail Preview */}
      {record.pdf && (
        <div className="pt-2 border-t border-slate-100">
          <div
            onClick={() => onOpenPdf(record.pdf!)}
            className="group inline-flex items-center space-x-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-lg p-2 cursor-pointer transition-all max-w-sm"
          >
            {/* Mini thumbnail block */}
            <div className="w-8 h-10 bg-white border border-slate-300 rounded shadow-2xs flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>

            <div className="min-w-0 pr-1">
              <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {record.pdf.fileName}
              </p>
              <p className="text-[10px] text-slate-400">
                {record.pdf.fileSize ? `${record.pdf.fileSize} · ` : ''}클릭하여 확대 보기
              </p>
            </div>

            <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onOpenAddRecordForStudent,
  onDeleteRecord,
  onOpenPdf,
}) => {
  const { isAdmin } = useAuth();

  if (!student) return null;

  return (
    <div 
      className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg font-bold text-slate-900">
              {student.name}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {student.cohort}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button
                onClick={() => onOpenAddRecordForStudent(student)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 기록 추가</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Records List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/40">
          {student.records.length > 0 ? (
            student.records.map((rec) => (
              <RecordItem
                key={rec.id}
                record={rec}
                isAdmin={isAdmin}
                onDelete={() => {
                  if (confirm(`'${rec.title}' 기록을 삭제하시겠습니까?`)) {
                    onDeleteRecord(student.id, rec.id);
                  }
                }}
                onOpenPdf={(pdf) => onOpenPdf(pdf, student.name)}
              />
            ))
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              등록된 상담 및 첨삭 기록이 없습니다.
              {isAdmin && (
                <div className="mt-3">
                  <button
                    onClick={() => onOpenAddRecordForStudent(student)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + 첫 번째 기록 등록하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
