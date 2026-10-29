import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, ChevronDown, ChevronUp, GraduationCap, Phone, Mail, Hash, Calendar } from 'lucide-react';
import { Student, PRESET_COHORTS } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudent: Student) => void;
  defaultCohort?: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  defaultCohort = '디금융 8기',
}) => {
  const [name, setName] = useState('');
  const [cohort, setCohort] = useState(defaultCohort);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Optional fields
  const [orderNo, setOrderNo] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [major1, setMajor1] = useState('');
  const [major2, setMajor2] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCohort(defaultCohort && defaultCohort !== 'all' ? defaultCohort : '디금융 8기');
      setName('');
      setOrderNo('');
      setBirthYear('');
      setPhone('');
      setEmail('');
      setUniversity('');
      setMajor1('');
      setMajor2('');
      setShowOptionalFields(false);
    }
  }, [isOpen, defaultCohort]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }
    if (!cohort.trim()) {
      alert('기수를 선택하거나 입력해주세요.');
      return;
    }

    const cleanCohort = cohort.trim().endsWith('기') ? cohort.trim() : `${cohort.trim()}기`;

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      name: name.trim(),
      cohort: cleanCohort,
      records: [],
      createdAt: new Date().toISOString().substring(0, 10),
      orderNo: orderNo.trim() ? orderNo.trim() : undefined,
      birthYear: birthYear.trim() ? birthYear.trim() : undefined,
      phone: phone.trim() ? phone.trim() : undefined,
      email: email.trim() ? email.trim() : undefined,
      university: university.trim() ? university.trim() : undefined,
      major1: major1.trim() ? major1.trim() : undefined,
      major2: major2.trim() ? major2.trim() : undefined,
    };

    onAddStudent(newStudent);
    setName('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50 shrink-0">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">새 학생 추가</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              학생 이름 <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
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

          {/* Collapsible Optional Academic & Contact Fields */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-slate-700 font-semibold cursor-pointer transition-colors"
            >
              <span className="flex items-center space-x-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                <span>추가 인적사항 (연락처, 학교, 전공 등) 입력</span>
              </span>
              {showOptionalFields ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {showOptionalFields && (
              <div className="p-3.5 space-y-3 bg-white border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-slate-400" />
                      <span>연번</span>
                    </label>
                    <input
                      type="text"
                      value={orderNo}
                      onChange={(e) => setOrderNo(e.target.value)}
                      placeholder="예: 1"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>생년</span>
                    </label>
                    <input
                      type="text"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      placeholder="예: 1998"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>휴대폰</span>
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-1234-5678"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>이메일</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@email.com"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">학교</label>
                    <input
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="한국대"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">학과1</label>
                    <input
                      type="text"
                      value={major1}
                      onChange={(e) => setMajor1(e.target.value)}
                      placeholder="경영학"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">학과2</label>
                    <input
                      type="text"
                      value={major2}
                      onChange={(e) => setMajor2(e.target.value)}
                      placeholder="컴퓨터"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>학생 추가</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
