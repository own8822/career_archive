import React, { useState } from 'react';
import { X, KeyRound, Shield, CheckCircle2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CodeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeSettingsModal: React.FC<CodeSettingsModalProps> = ({ isOpen, onClose }) => {
  const { authSettings, updateAuthCodes } = useAuth();

  const [adminCode, setAdminCode] = useState(authSettings.adminCode);
  const [viewerCode, setViewerCode] = useState(authSettings.viewerCode);
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setAdminCode(authSettings.adminCode);
      setViewerCode(authSettings.viewerCode);
      setIsSaved(false);
    }
  }, [isOpen, authSettings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode.trim() || !viewerCode.trim()) {
      alert('관리자 코드와 열람자 코드를 모두 입력해주세요.');
      return;
    }

    updateAuthCodes(adminCode.trim(), viewerCode.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">접속 코드(비밀번호) 설정</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <p className="text-slate-500 text-[11px] leading-relaxed">
            관리자(자료 등록·수정 권한)와 열람자(조회 전용 권한)에게 부여할 접속 코드를 직접 설정하고 변경할 수 있습니다.
          </p>

          {/* Admin Code Input */}
          <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-600" />
                <span>관리자 접속 코드</span>
              </label>
              <span className="text-[10px] text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded font-medium">
                등록·수정·삭제 가능
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="예: admin2026!"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          {/* Viewer Code Input */}
          <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>열람자 접속 코드</span>
              </label>
              <span className="text-[10px] text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded font-medium">
                조회 전용
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={viewerCode}
                onChange={(e) => setViewerCode(e.target.value)}
                placeholder="예: viewer2026"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400">
              이 코드를 공유받은 사용자는 자료 조회 및 PDF 다운로드만 가능합니다.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between">
            {isSaved ? (
              <span className="text-emerald-600 font-bold flex items-center space-x-1 text-xs animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>코드가 성공적으로 저장되었습니다!</span>
              </span>
            ) : <span />}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                닫기
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>설정 저장</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
