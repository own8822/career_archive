import React from 'react';
import { 
  Building2, 
  Briefcase, 
  GraduationCap, 
  Plus
} from 'lucide-react';
import { Student, PdfReview } from '../types';
import { CounselingRecordItem } from './CounselingRecordItem';
import { useAuth } from '../context/AuthContext';

interface StudentCardProps {
  student: Student;
  onOpenPdf: (pdf: PdfReview, student: Student) => void;
  onAddRecordForStudent: (student: Student) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onOpenPdf,
  onAddRecordForStudent,
}) => {
  const { isAdmin } = useAuth();

  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case '최종합격':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case '면접전형':
        return 'bg-brand-100 text-brand-800 border-brand-300';
      case '서류전형':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case '재직중':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full card-transition hover:border-slate-300 hover:shadow-md">
      
      {/* Student Profile Header (패들렛 컬럼 상단) */}
      <div className="bg-white p-4 rounded-t-2xl border-b border-slate-200/80">
        <div className="flex items-start justify-between gap-2 mb-2">
          
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl ${student.avatarColor} text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0`}>
              {student.name.substring(0, 1)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {student.name}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {student.cohort}
                </span>
              </div>
              {student.major && (
                <p className="text-xs text-slate-500 flex items-center mt-0.5">
                  <GraduationCap className="w-3 h-3 mr-1 text-slate-400" />
                  {student.major}
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(student.status)}`}>
            {student.status}
          </span>
        </div>

        {/* Target Role & Target Companies */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
          <div className="flex items-center text-slate-700">
            <Briefcase className="w-3.5 h-3.5 mr-1.5 text-brand-600 shrink-0" />
            <span className="font-semibold text-slate-900 mr-1.5">희망 직무:</span>
            <span className="text-slate-800">{student.targetRole}</span>
          </div>

          <div className="flex items-start text-slate-700">
            <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="font-semibold text-slate-900 mr-1.5 shrink-0">목표 기업:</span>
            <div className="flex flex-wrap gap-1">
              {student.targetCompanies.map((company, i) => (
                <span 
                  key={i} 
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded text-[11px]"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>

        {student.notes && (
          <div className="mt-2.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed italic">
            "{student.notes}"
          </div>
        )}
      </div>

      {/* Accumulated Counseling & Review Records List (상담·첨삭 기록 누적) */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[680px]">
        {student.records.length > 0 ? (
          student.records.map((record, index) => (
            <CounselingRecordItem
              key={record.id}
              record={record}
              sessionIndex={index + 1}
              onOpenPdf={(pdf) => onOpenPdf(pdf, student)}
            />
          ))
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            등록된 상담 및 첨삭 기록이 없습니다.
          </div>
        )}
      </div>

      {/* Card Bottom: Admin Quick Add Button */}
      {isAdmin && (
        <div className="p-3 pt-0">
          <button
            onClick={() => onAddRecordForStudent(student)}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-brand-300 hover:border-brand-500 bg-brand-50/50 hover:bg-brand-50 text-brand-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>이 학생에게 새 상담·첨삭 기록 추가</span>
          </button>
        </div>
      )}

    </div>
  );
};
