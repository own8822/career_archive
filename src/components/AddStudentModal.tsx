import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Student } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudent: Student) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
}) => {
  const [name, setName] = useState('');
  const [cohort, setCohort] = useState('8기');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      name: name.trim(),
      cohort: cohort.trim().endsWith('기') ? cohort.trim() : `${cohort.trim()}기`,
      records: [],
      createdAt: new Date().toISOString().substring(0, 10),
    };

    onAddStudent(newStudent);
    setName('');
    setCohort('8기');
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
            <UserPlus className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">새 학생 열(Column) 추가</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
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
              placeholder="예: 홍길동"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              기수 <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              placeholder="예: 7기, 8기"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white"
              required
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>열 추가</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
