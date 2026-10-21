import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Eye, 
  History, 
  PlusCircle, 
  FolderGit2,
  Lock,
  Unlock
} from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenLogModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal, onOpenLogModal }) => {
  const { currentUser, switchUser, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Service Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">취업지도 아카이브</h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  보드 뷰
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                학생별 상담·첨삭 히스토리 및 피드백 누적 보드
              </p>
            </div>
          </div>

          {/* Right Action Controls: Role switch, Access log, Add record */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => switchUser('admin')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  isAdmin
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="관리자 모드: 학생 및 상담 기록 등록/수정 가능"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>관리자</span>
                {isAdmin && <Unlock className="w-3 h-3 text-brand-500 ml-0.5" />}
              </button>

              <button
                onClick={() => switchUser('viewer')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  !isAdmin
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="팀원 모드: 읽기 전용으로 조회만 가능"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>팀원 (읽기전용)</span>
                {!isAdmin && <Lock className="w-3 h-3 text-amber-500 ml-0.5" />}
              </button>
            </div>

            {/* Access Log Modal Button */}
            <button
              onClick={onOpenLogModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
              title="시스템 접속 및 활동 이력 확인"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">접속 이력</span>
            </button>

            {/* Add Record (Admin Only) */}
            {isAdmin ? (
              <button
                onClick={onOpenAddModal}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>기록 등록</span>
              </button>
            ) : (
              <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md hidden lg:flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>읽기 모드 활성화됨</span>
              </div>
            )}

            {/* Current User Badge */}
            <div className="hidden xl:flex items-center pl-2 border-l border-slate-200 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
              <span className="font-medium text-slate-800">{currentUser.name}</span>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
