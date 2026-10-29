import React, { useState, useEffect } from 'react';
import { X, Edit2, Check, User, Phone, Mail, GraduationCap, Calendar, Hash, FileText } from 'lucide-react';
import { Student, PRESET_COHORTS } from '../types';

interface EditStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (updatedStudent: Student) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaveStudent,
}) => {
  const [name, setName] = useState('');
  const [cohort, setCohort] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [major1, setMajor1] = useState('');
  const [major2, setMajor2] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setCohort(student.cohort || '');
      setOrderNo(student.orderNo !== undefined ? String(student.orderNo) : '');
      setBirthYear(student.birthYear || '');
      setPhone(student.phone || '');
      setEmail(student.email || '');
      setUniversity(student.university || '');
      major1 ? setMajor1(student.major1 || '') : setMajor1(student.major1 || '');
      setMajor2(student.major2 || '');
      setMemo(student.memo || '');
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

    const updated: Student = {
      ...student,
      name: name.trim(),
      cohort: cleanCohort,
      orderNo: orderNo.trim() ? orderNo.trim() : undefined,
      birthYear: birthYear.trim() ? birthYear.trim() : undefined,
      phone: phone.trim() ? phone.trim() : undefined,
      email: email.trim() ? email.trim() : undefined,
      university: university.trim() ? university.trim() : undefined,
      major1: major1.trim() ? major1.trim() : undefined,
      major2: major2.trim() ? major2.trim() : undefined,
      memo: memo.trim() ? memo.trim() : undefined,
    };

    onSaveStudent(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50 shrink-0">
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

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Name & Cohort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>성명 (이름) <span className="text-teal-600">*</span></span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <span>기수 <span className="text-teal-600">*</span></span>
              </label>
              <input
                type="text"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="예: 디금융 8기"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white text-xs"
                required
              />
            </div>
          </div>

          {/* Quick Cohort Select Chips */}
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">빠른 기수 변경:</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COHORTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCohort(c)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    cohort === c
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 border border-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1 text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
              <span>학적 및 인적사항 (구글 시트 연동 항목)</span>
            </h4>

            {/* Row 2: OrderNo & BirthYear */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span>연번</span>
                </label>
                <input
                  type="text"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder="예: 1"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>생년</span>
                </label>
                <input
                  type="text"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="예: 1998"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Row 3: Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>휴대폰 번호</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>이메일 주소</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="예: student@email.com"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Row 4: University & Majors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">학교</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="예: 한국대학교"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">학과1 (주전공)</label>
                <input
                  type="text"
                  value={major1}
                  onChange={(e) => setMajor1(e.target.value)}
                  placeholder="예: 경영학과"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">학과2 (복수전공)</label>
                <input
                  type="text"
                  value={major2}
                  onChange={(e) => setMajor2(e.target.value)}
                  placeholder="예: 컴퓨터공학"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Row 5: Memo */}
            <div>
              <label className="block font-medium text-slate-600 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>비고 / 메모</span>
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="학생 관련 특이사항이나 메모"
                rows={2}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
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
              <span>수정 완료</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
