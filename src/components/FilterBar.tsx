import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { FilterOptions } from '../types';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  availableCohorts: string[];
  totalStudentsCount: number;
  filteredStudentsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableCohorts,
  totalStudentsCount,
  filteredStudentsCount,
}) => {
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchKeyword: e.target.value });
  };

  const handleCohortChange = (cohort: string) => {
    onFilterChange({ ...filters, cohort });
  };

  const handleTypeChange = (counselingType: string) => {
    onFilterChange({ ...filters, counselingType });
  };

  const resetFilters = () => {
    onFilterChange({
      searchKeyword: '',
      cohort: 'all',
      targetRole: 'all',
      counselingType: 'all',
      status: 'all'
    });
  };

  const hasActiveFilters = 
    filters.searchKeyword.trim() !== '' || 
    filters.cohort !== 'all' || 
    filters.counselingType !== 'all';

  return (
    <div className="bg-white border-b border-slate-200/80 shadow-2xs py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input Box */}
          <div className="relative flex-1 max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filters.searchKeyword}
              onChange={handleKeywordChange}
              placeholder="학생명, 기수, 희망 직무, 목표 기업, 상담 키워드 검색..."
              className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            {filters.searchKeyword && (
              <button
                onClick={() => onFilterChange({ ...filters, searchKeyword: '' })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Cohort Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center">
              <Filter className="w-3 h-3 mr-1" />
              기수:
            </span>
            <button
              onClick={() => handleCohortChange('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filters.cohort === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 기수
            </button>
            {availableCohorts.map((c) => (
              <button
                key={c}
                onClick={() => handleCohortChange(c)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filters.cohort === c
                    ? 'bg-brand-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

        </div>

        {/* Counseling Type Filter Chips & Result summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-slate-400 font-medium mr-1">상담 유형:</span>
            {[
              { id: 'all', label: '전체' },
              { id: 'resume', label: '자기소개서·이력서' },
              { id: 'portfolio', label: '포트폴리오' },
              { id: 'interview', label: '모의면접' },
              { id: 'career', label: '취업로드맵' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleTypeChange(item.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filters.counselingType === item.id
                    ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-slate-500">
            <span>
              보드 표시 학생: <strong className="text-slate-900 font-semibold">{filteredStudentsCount}</strong>명
              {totalStudentsCount !== filteredStudentsCount && (
                <span className="text-slate-400 ml-1">(전체 {totalStudentsCount}명)</span>
              )}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-brand-600 hover:text-brand-800 underline font-medium ml-2"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
