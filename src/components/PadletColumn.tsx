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
  // Check if student has '수강포기' anywhere in records or memo
  const isDropped =
    student.records.some((record) => {
      const combined = `${record.title || ''} ${record.content || ''}`.replace(/\s+/g, '');
      return combined.includes('수강포기');
    }) || (student.memo || '').replace(/\s+/g, '').includes('수강포기');

  return (
    <div
      className={`break-inside-avoid mb-5 w-full rounded-2xl transition-all ${
        isDropped
          ? 'bg-slate-100/95 backdrop-blur-md border border-slate-300 shadow-2xs hover:shadow-xs hover:border-slate-400'
          : 'bg-white/80 backdrop-blur-md border border-sky-100/90 shadow-2xs hover:shadow-xs hover:border-teal-300'
      }`}
    >
      {/* Column Header: Student Name + Cohort + Academic & Contact Info */}
      <div
        className={`p-4 pb-3 border-b rounded-t-2xl transition-colors ${
          isDropped
            ? 'border-slate-300/80 bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/60'
            : 'border-sky-100/70 bg-gradient-to-r from-white via-sky-50/30 to-teal-50/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            {student.orderNo && (
              <span
                className={`text-[10px] font-mono px-1 py-0.5 rounded shrink-0 ${
                  isDropped ? 'text-slate-500 bg-slate-200/90' : 'text-slate-400 bg-slate-100'
                }`}
              >
                #{student.orderNo}
              </span>
            )}
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

        {/* Academic Info: University & Majors */}
        {(student.university || student.major1) && (
          <div
            className={`mt-1 text-[11px] truncate flex items-center space-x-1 ${
              isDropped ? 'text-slate-500' : 'text-slate-600'
            }`}
          >
            <span className={isDropped ? 'font-medium text-slate-600' : 'font-semibold text-slate-700'}>
              {student.university}
            </span>
            {student.major1 && <span>· {student.major1}</span>}
            {student.major2 && <span className="text-slate-400">({student.major2})</span>}
          </div>
        )}

        {/* Contact & Birth Info */}
        {(student.phone || student.email || student.birthYear) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
            {student.birthYear && (
              <span
                className={`px-1.5 py-0.5 rounded ${
                  isDropped ? 'bg-slate-200/80 text-slate-600' : 'bg-slate-100/90 text-slate-600'
                }`}
              >
                {student.birthYear}년생
              </span>
            )}
            {student.phone && (
              <a
                href={`tel:${student.phone}`}
                className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
                  isDropped
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-600'
                    : 'bg-slate-100/90 hover:bg-teal-50 hover:text-teal-700 text-slate-600'
                }`}
                title="전화 걸기"
              >
                {student.phone}
              </a>
            )}
            {student.email && (
              <a
                href={`mailto:${student.email}`}
                className={`px-1.5 py-0.5 rounded transition-colors truncate max-w-[140px] ${
                  isDropped
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-600'
                    : 'bg-slate-100/90 hover:bg-teal-50 hover:text-teal-700 text-slate-600'
                }`}
                title={student.email}
              >
                {student.email}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Button directly under student header (Admin only) */}
      {isAdmin && (
        <div className="px-3.5 pt-3">
          <button
            onClick={() => onAddRecord(student)}
            className={`w-full py-1.5 px-3 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center space-x-1 transition-all shadow-2xs active:scale-[0.99] cursor-pointer ${
              isDropped
                ? 'border-slate-300 hover:border-slate-400 bg-slate-200/60 hover:bg-slate-200 text-slate-600'
                : 'border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-700'
            }`}
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
