import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Visual Banner (No password text exposed) */}
        <div className="bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-400 p-6 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">취업지도 아카이브</h2>
            <p className="text-xs text-sky-100 mt-0.5">
              접속 코드를 입력해주세요
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Clean Login Form (Zero password exposure) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              접속 코드
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-teal-600" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="코드를 입력하세요"
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400 font-mono transition-all"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? '코드 가리기' : '코드 보기'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 text-xs"
          >
            <span>입장하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
