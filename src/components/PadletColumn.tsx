import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Student, PdfAttachment } from '../types';
import { RecordCard } from './RecordCard';

interface PadletColumnProps {
  student: Student;
  isAdmin: boolean;
  onAddRecord: (student: Student) => void;
  onDeleteRecord: (studentId: string, recordId: string) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenPdf: (pdf: PdfAttachment, studentName: string) => void;
}

export const PadletColumn: React.FC<PadletColumnProps> = ({
  student,
  isAdmin,
  onAddRecord,
  onDeleteRecord,
  onDeleteStudent,
  onOpenPdf,
}) => {
  return (
    <div className="w-80 shrink-0 flex flex-col max-h-full rounded-2xl bg-white/70 backdrop-blur-md border border-sky-100 shadow-xs">
      
      {/* Column Header: Student Name + Cohort + Delete Action */}
      <div className="p-3.5 pb-2 flex items-center justify-between border-b border-sky-100/70">
        <div className="flex items-center space-x-2 truncate">
          <h3 className="text-sm font-bold text-slate-800 truncate tracking-tight">
            {student.name}
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0">
            {student.cohort}
          </span>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              if (confirm(`'${student.name}' 학생의 모든 기록과 열을 삭제하시겠습니까?`)) {
                onDeleteStudent(student.id);
              }
            }}
            className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
            title="학생 열 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Add Button directly under column header (Padlet style '+') */}
      {isAdmin && (
        <div className="px-3 pt-2">
          <button
            onClick={() => onAddRecord(student)}
            className="w-full py-1.5 px-3 rounded-lg border border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-700 text-xs font-semibold flex items-center justify-center space-x-1 transition-all shadow-2xs active:scale-[0.99]"
            title={`${student.name} 학생에게 새 상담·첨삭 기록 추가`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>기록 추가</span>
          </button>
        </div>
      )}

      {/* Vertical Stack of Records */}
      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {student.records.length > 0 ? (
          student.records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              isAdmin={isAdmin}
              onDelete={() => {
                if (confirm(`'${record.title}' 기록을 삭제하시겠습니까?`)) {
                  onDeleteRecord(student.id, record.id);
                }
              }}
              onOpenPdf={(pdf) => onOpenPdf(pdf, student.name)}
            />
          ))
        ) : (
          <div className="py-8 px-4 text-center text-xs text-slate-400 bg-white/50 rounded-xl border border-dashed border-slate-200">
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
