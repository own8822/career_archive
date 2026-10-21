import React from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Student, CounselingRecord, PdfAttachment } from '../types';
import { RecordCard } from './RecordCard';

interface PadletColumnProps {
  student: Student;
  isAdmin: boolean;
  onAddRecord: (student: Student) => void;
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
  return (
    <div className="break-inside-avoid mb-5 w-full rounded-2xl bg-white/80 backdrop-blur-md border border-sky-100/90 shadow-2xs hover:shadow-xs transition-shadow">
      
      {/* Column Header: Student Name + Cohort + Admin Edit/Delete */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-sky-100/70 bg-gradient-to-r from-white via-sky-50/30 to-teal-50/20 rounded-t-2xl">
        <div className="flex items-center space-x-2 truncate">
          <h3 className="text-base font-bold text-slate-800 truncate tracking-tight">
            {student.name}
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0">
            {student.cohort}
          </span>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEditStudent(student)}
              className="text-slate-300 hover:text-teal-600 p-1 rounded-md transition-colors"
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
              className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
              title="학생 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Button directly under student header (Admin only) */}
      {isAdmin && (
        <div className="px-3.5 pt-3">
          <button
            onClick={() => onAddRecord(student)}
            className="w-full py-1.5 px-3 rounded-xl border border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-700 text-xs font-semibold flex items-center justify-center space-x-1 transition-all shadow-2xs active:scale-[0.99]"
            title={`${student.name} 학생에게 새 상담·첨삭 기록 추가`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>기록 추가</span>
          </button>
        </div>
      )}

      {/* Vertical Stack of Records: No inner scrollbar, auto height */}
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
                위의 '+ 기록 추가' 버튼을 눌러보세요.
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
