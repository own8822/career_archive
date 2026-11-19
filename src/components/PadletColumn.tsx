import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  UploadCloud,
} from 'lucide-react';
import { Student, CounselingRecord, PdfAttachment } from '../types';
import { RecordCard } from './RecordCard';

interface PadletColumnProps {
  student: Student;
  isAdmin: boolean;
  onAddRecord: (student: Student, initialFiles?: File[]) => void;
  onEditRecord: (student: Student, record: CounselingRecord) => void;
  onDeleteRecord: (studentId: string, recordId: string) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenPdf: (pdf: PdfAttachment, studentName: string) => void;
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
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Check if student has '수강포기' anywhere in records or memo
  const isDropped =
    student.records.some((record) => {
      const combined = `${record.title || ''} ${record.content || ''}`.replace(/\s+/g, '');
      return combined.includes('수강포기');
    }) || (student.memo || '').replace(/\s+/g, '').includes('수강포기');

  // Drag & Drop handlers on Card: Dropping files directly opens the record modal with those files!
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
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddRecord(student, Array.from(e.dataTransfer.files));
    }
  };

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
                {student.name} 학생에게 상담 기록 및 서류 첨부
              </p>
              <p className="text-[10px] text-teal-600">
                놓으면 기록 추가 창이 열리고 서류가 함께 첨부됩니다
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Column Header: Student Name + Cohort (Personal info stripped for privacy) */}
      <div
        className={`p-4 pb-3 border-b rounded-t-2xl transition-colors ${
          isDropped
            ? 'border-slate-300/80 bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/60'
            : 'border-sky-100/70 bg-gradient-to-r from-white via-sky-50/30 to-teal-50/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
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
      </div>

      {/* Quick Add Record Button (Admin only) */}
      {isAdmin && (
        <div className="px-3.5 pt-3">
          <button
            onClick={() => onAddRecord(student)}
            className={`w-full py-2 px-3 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-2xs active:scale-[0.99] cursor-pointer ${
              isDropped
                ? 'border-slate-300 hover:border-slate-400 bg-slate-200/60 hover:bg-slate-200 text-slate-600'
                : 'border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-700'
            }`}
            title={`${student.name} 학생에게 새 상담 및 서류 첨부 기록 추가`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>기록 추가 (파일 첨부 포함)</span>
          </button>
        </div>
      )}

      {/* Vertical Stack of Records: Each record contains its title, date, content, and attached files */}
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
                위의 '+ 기록 추가' 버튼을 눌러 상담 내용 및 서류를 등록해보세요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
