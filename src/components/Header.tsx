import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, UserPlus, Search, X, Sparkles, KeyRound, LogOut, Database, Layers, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  searchKeyword: string;
  onSearchChange: (val: string) => void;
  selectedCohort: string;
  onCohortChange: (cohort: string) => void;
  availableCohorts: string[];
  onOpenAddStudent: () => void;
  onOpenSheetImport: () => void;
  onOpenCodeSettings: () => void;
  onOpenDataManagement: () => void;
  cohortCounts?: Record<string, number>;
}

export const Header: React.FC<HeaderProps> = ({
  searchKeyword,
  onSearchChange,
  selectedCohort,
  onCohortChange,
  availableCohorts,
  onOpenAddStudent,
  onOpenSheetImport,
  onOpenCodeSettings,
  onOpenDataManagement,
  cohortCounts = {},
}) => {
  const { isAdmin, isViewer, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2.5 space-y-2.5">
        
        {/* Row 1: Logo & Title + Search Bar + Admin Tools & Logout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Service Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  취업지원 아카이브
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80">
                  기수별 보드
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                디지털금융 기수별 학생 상담·첨삭 기록 보드
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md mx-0 md:mx-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="학생 이름으로 검색..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white focus:border-teal-400 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchKeyword && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Action: Role Badge & Admin Tools & Logout */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* Role Badge */}
            {isAdmin ? (
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>관리자</span>
              </div>
            ) : isViewer ? (
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                <span>열람자</span>
              </div>
            ) : null}

            {/* Admin: Google Sheet / Excel Import Button */}
            {isAdmin && (
              <button
                onClick={onOpenSheetImport}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                title="구글 시트 또는 엑셀의 학생 명부 일괄 가져오기"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">시트 가져오기</span>
              </button>
            )}

            {/* Admin: Data Management Button */}
            {isAdmin && (
              <button
                onClick={onOpenDataManagement}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                title="데이터 백업 및 수파베이스 이관"
              >
                <Database className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">데이터 관리</span>
              </button>
            )}

            {/* Admin: Code Settings Button */}
            {isAdmin && (
              <button
                onClick={onOpenCodeSettings}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                title="관리자 및 열람자 접속 코드 관리"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">코드 관리</span>
              </button>
            )}

            {/* Admin: Add Student Button */}
            {isAdmin && (
              <button
                onClick={onOpenAddStudent}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="새로운 학생 추가"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>학생 추가</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="로그아웃 (접속 코드 재입력)"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Row 2: Prominent Cohort Navigation Tabs (디금융 기수별 분리 단추) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 scrollbar-none">
          <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 shrink-0 mr-1">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">기수 선택:</span>
          </div>

          {/* All Cohorts Button */}
          <button
            onClick={() => onCohortChange('all')}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedCohort === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            전체 보기
          </button>

          {/* Preset & Custom Cohort Buttons */}
          {availableCohorts.map((cohortName) => {
            const isSelected = selectedCohort === cohortName;
            const count = cohortCounts[cohortName] || 0;

            return (
              <button
                key={cohortName}
                onClick={() => onCohortChange(cohortName)}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-500/25'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-800'
                }`}
              >
                <span>{cohortName}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
