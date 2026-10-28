import React, { useState } from 'react';
import { X, KeyRound, Shield, CheckCircle2, Check, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CodeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeSettingsModal: React.FC<CodeSettingsModalProps> = ({ isOpen, onClose }) => {
  const { authSettings, updateAuthCodes } = useAuth();

  const [adminCode, setAdminCode] = useState(authSettings.adminCode);
  const [viewerCodes, setViewerCodes] = useState<string[]>(authSettings.viewerCodes);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setAdminCode(authSettings.adminCode);
      setViewerCodes(authSettings.viewerCodes);
      setIsSaved(false);
      setCopiedCode(null);
    }
  }, [isOpen, authSettings]);

  if (!isOpen) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleViewerCodeChange = (index: number, val: string) => {
    const updated = [...viewerCodes];
    updated[index] = val;
    setViewerCodes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode.trim()) {
      alert('관리자 코드를 입력해주세요.');
      return;
    }

    const filteredViewerCodes = viewerCodes.map(c => c.trim()).filter(c => c.length > 0);
    if (filteredViewerCodes.length === 0) {
      alert('최소 1개 이상의 열람자 코드가 필요합니다.');
      return;
    }

    updateAuthCodes(adminCode.trim(), filteredViewerCodes);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50 shrink-0">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">관리자 전용 코드 발급 및 관리</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          <p className="text-slate-500 text-[11px] leading-relaxed">
            관리자 본인 전용 코드와 열람자들에게 개별 배포할 10개의 열람 코드를 관리할 수 있습니다.
          </p>

          {/* 1. Admin Code Input */}
          <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-600" />
                <span>관리자 전용 코드 (자료 등록·수정·삭제)</span>
              </label>
              <button
                type="button"
                onClick={() => handleCopy(adminCode)}
                className="text-[10px] text-sky-700 hover:text-sky-900 flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCode === adminCode ? '복사됨!' : '코드 복사'}</span>
              </button>
            </div>
            <input
              type="text"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-sky-500 font-bold"
              required
            />
          </div>

          {/* 2. 10 Viewer Codes List */}
          <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>열람자 접속 코드 목록 ({viewerCodes.length}개)</span>
              </label>
              <span className="text-[10px] text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded font-semibold">
                읽기 전용
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              열람을 원하는 사용자에게 아래 코드 중 하나를 전달하세요. (복사 버튼 지원)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
              {viewerCodes.map((c, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-400 w-5 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => handleViewerCodeChange(idx, e.target.value)}
                    className="flex-1 p-1 text-xs font-mono text-slate-800 font-semibold bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(c)}
                    className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                    title="코드 복사"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedCode === c && (
                    <span className="text-[9px] text-teal-600 font-bold">복사됨!</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-between">
            {isSaved ? (
              <span className="text-emerald-600 font-bold flex items-center space-x-1 text-xs animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>접속 코드가 성공적으로 변경되었습니다!</span>
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
