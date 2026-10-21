import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, Plus, UserPlus } from 'lucide-react';

interface HeaderProps {
  onOpenAddRecord: () => void;
  onOpenAddStudent: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddRecord, onOpenAddStudent }) => {
  const { switchUser, isAdmin } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Main Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              취업지도 아카이브
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              학생별 상담·첨삭 자료
            </p>
          </div>

          {/* Right Action: Role Toggle & Admin Actions */}
          <div className="flex items-center space-x-2.5">
            {/* Role Toggle Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => switchUser('admin')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  isAdmin
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="관리자: 등록/삭제 가능"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>관리자</span>
              </button>
              <button
                onClick={() => switchUser('viewer')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  !isAdmin
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="팀원: 읽기 전용"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>팀원 (읽기전용)</span>
              </button>
            </div>

            {/* Admin Buttons */}
            {isAdmin && (
              <>
                <button
                  onClick={onOpenAddStudent}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
                  title="학생 이름과 기수만 입력하여 신규 등록"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                  <span>학생 추가</span>
                </button>
                <button
                  onClick={onOpenAddRecord}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
                  title="학생 선택, 제목, 본문, PDF 첨부만으로 빠른 기록 등록"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>기록 등록</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
