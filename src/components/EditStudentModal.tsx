import React, { useState, useEffect } from 'react';
import { X, Edit2, Check } from 'lucide-react';
import { Student, PRESET_COHORTS } from '../types';

interface EditStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (studentId: string, name: string, cohort: string) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaveStudent,
}) => {
  const [name, setName] = useState('');
  const [cohort, setCohort] = useState('');

  useEffect(() => {
    if (student) {
      setName(student.name);
      setCohort(student.cohort);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cohort.trim()) {
      alert('이름과 기수를 입력해주세요.');
      return;
    }
    const cleanCohort = cohort.trim().endsWith('기') ? cohort.trim() : `${cohort.trim()}기`;
    onSaveStudent(student.id, name.trim(), cleanCohort);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50">
          <div className="flex items-center space-x-2">
            <Edit2 className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">학생 정보 수정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              학생 이름 <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white text-xs"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              기수 선택 <span className="text-teal-600">*</span>
            </label>

            {/* Quick Cohort Select Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_COHORTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCohort(c)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    cohort === c
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 border border-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              placeholder="예: 디금융 8기"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white text-xs"
              required
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>수정 완료</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
