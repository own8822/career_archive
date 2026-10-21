import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { Student } from '../types';

interface StudentSimpleCardProps {
  student: Student;
  onClick: () => void;
}

export const StudentSimpleCard: React.FC<StudentSimpleCardProps> = ({ student, onClick }) => {
  // 최근 기록 제목 (가장 최신 기록)
  const latestRecord = student.records.length > 0 ? student.records[0] : null;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between min-h-[190px]"
    >
      {/* Top: Student Name and Cohort Badge */}
      <div className="flex items-start justify-between">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {student.name}
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {student.cohort}
        </span>
      </div>

      {/* Center: Clean Document Icon */}
      <div className="flex items-center justify-center py-4 text-slate-300 group-hover:text-blue-500 transition-colors">
        <div className="p-3.5 rounded-2xl bg-slate-50 group-hover:bg-blue-50 transition-colors">
          <FileText className="w-8 h-8 stroke-[1.5]" />
        </div>
      </div>

      {/* Bottom: Latest Record Title & "기록 보기 ->" */}
      <div className="flex items-end justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-600 truncate max-w-[70%] font-medium">
          {latestRecord ? latestRecord.title : '등록된 기록 없음'}
        </p>

        <span className="text-xs font-semibold text-blue-600 flex items-center group-hover:translate-x-0.5 transition-transform shrink-0">
          기록 보기 <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </span>
      </div>
    </div>
  );
};
