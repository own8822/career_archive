import React, { useState } from 'react';
import { KeyRound, Shield, Eye, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = login(code);
    if (!res.success) {
      setErrorMsg(res.message || '접속 코드가 올바르지 않습니다.');
    }
  };

  const handleQuickFill = (fillCode: string) => {
    setCode(fillCode);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Visual Banner */}
        <div className="bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-400 p-7 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">취업지도 아카이브</h2>
            <p className="text-xs text-sky-100 mt-1">
              발급받은 접속 코드를 입력하여 입장해주세요.
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              접속 코드 (Access Code)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-teal-600" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="관리자 또는 열람자 코드를 입력하세요"
                className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400 font-medium transition-all"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-2 flex items-center space-x-1.5 text-xs text-rose-600 font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 text-sm active:scale-[0.99]"
          >
            <span>확인 및 입장</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Guide & Preset Helper */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 text-center">
              초기 기본 접속 코드 안내
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin1234')}
                className="p-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center space-x-1 text-slate-700 group-hover:text-sky-700 font-bold mb-0.5">
                  <Shield className="w-3.5 h-3.5 text-sky-600" />
                  <span>관리자 코드</span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">admin1234</p>
                <p className="text-[10px] text-slate-400 mt-0.5">등록·수정·삭제 가능</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('viewer1234')}
                className="p-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center space-x-1 text-slate-700 group-hover:text-teal-700 font-bold mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>열람자 코드</span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">viewer1234</p>
                <p className="text-[10px] text-slate-400 mt-0.5">조회 및 다운로드만</p>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              ※ 관리자 코드로 입장 후 상단 메뉴에서 코드를 언제든 원하는 비밀번호로 변경할 수 있습니다.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
