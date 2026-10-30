import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await login(code);
      if (!res.success) {
        setErrorMsg(res.message || '접속 코드가 올바르지 않습니다.');
      }
    } catch {
      setErrorMsg('서버 접속 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col items-center justify-center p-4 selection:bg-teal-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-700/20 relative z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Visual Banner */}
        <div className="bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-400 p-6 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">취업지원 아카이브</h2>
            <p className="text-xs text-sky-100 mt-0.5">
              접속 코드를 입력해주세요
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Clean Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                접속 코드 (관리자 / 열람자)
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-teal-600" />
                보안 접속
              </span>
            </div>
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
            disabled={isSubmitting}
            className={`w-full py-2.5 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 text-xs ${
              isSubmitting
                ? 'bg-teal-400 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 cursor-pointer'
            }`}
          >
            <span>{isSubmitting ? '코드 확인 중...' : '입장하기'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-400 mt-6 relative z-10 font-medium">
        취업지원 아카이브 &copy; 인가된 사용자 전용 시스템
      </p>
    </div>
  );
};
