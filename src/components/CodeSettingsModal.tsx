import React, { useState, useEffect } from 'react';
import { X, KeyRound, Shield, CheckCircle2, AlertTriangle, Copy, Trash2, Plus, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { archiveStorage } from '../services/storage';
import { AccessCodeMeta } from '../types';

interface CodeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeSettingsModal: React.FC<CodeSettingsModalProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'viewers' | 'admin'>('viewers');
  const [codeList, setCodeList] = useState<AccessCodeMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Viewer Code form state
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeVal, setNewCodeVal] = useState('');
  const [issuedCodeDisplay, setIssuedCodeDisplay] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Rotate Admin Code form state
  const [oldAdminCode, setOldAdminCode] = useState('');
  const [newAdminCode, setNewAdminCode] = useState('');
  const [confirmAdminCode, setConfirmAdminCode] = useState('');
  const [adminRotateMsg, setAdminRotateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCodes = async () => {
    setIsLoading(true);
    try {
      const list = await archiveStorage.listAccessCodes();
      setCodeList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadCodes();
      setIssuedCodeDisplay(null);
      setAdminRotateMsg(null);
      setNewCodeName('');
      setNewCodeVal('');
      setOldAdminCode('');
      setNewAdminCode('');
      setConfirmAdminCode('');
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  // Handle Issuing New Viewer Code
  const handleIssueViewerCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim() || !newCodeVal.trim()) {
      alert('코드 식별 이름과 접속 코드를 입력해주세요.');
      return;
    }
    if (newCodeVal.trim().length < 6) {
      alert('접속 코드는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    const res = await archiveStorage.issueViewerCode(newCodeVal, newCodeName);
    setIsLoading(false);

    if (res.success) {
      setIssuedCodeDisplay(newCodeVal.trim());
      setNewCodeName('');
      setNewCodeVal('');
      loadCodes();
    } else {
      alert(res.message || '코드 발급 실패');
    }
  };

  // Handle Revoking Code
  const handleRevoke = async (codeId: string, name: string) => {
    if (!confirm(`'${name}' 코드를 폐기하시겠습니까?\n\n※ 폐기 즉시 이 코드로 로그인된 모든 열람자의 세션이 강제 종료됩니다.`)) {
      return;
    }
    setIsLoading(true);
    const res = await archiveStorage.revokeCode(codeId);
    setIsLoading(false);
    if (res.success) {
      loadCodes();
    } else {
      alert(res.message || '코드 폐기 실패');
    }
  };

  // Handle Rotating Admin Code
  const handleRotateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminRotateMsg(null);

    if (newAdminCode !== confirmAdminCode) {
      setAdminRotateMsg({ type: 'error', text: '새 관리자 코드가 일치하지 않습니다.' });
      return;
    }
    if (newAdminCode.length < 8) {
      setAdminRotateMsg({ type: 'error', text: '새 관리자 코드는 최소 8자 이상이어야 합니다.' });
      return;
    }

    setIsLoading(true);
    const res = await archiveStorage.rotateAdminCode(oldAdminCode, newAdminCode);
    setIsLoading(false);

    if (res.success) {
      setAdminRotateMsg({ type: 'success', text: '관리자 코드가 안전하게 교체되었습니다. 기존 관리자 세션이 갱신되었습니다.' });
      setOldAdminCode('');
      setNewAdminCode('');
      setConfirmAdminCode('');
    } else {
      setAdminRotateMsg({ type: 'error', text: res.message || '관리자 코드 교체 실패' });
    }
  };

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const viewerList = codeList.filter((c) => c.codeType === 'viewer');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50 shrink-0">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">접속 코드 발급 및 권한 관리</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('viewers')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'viewers'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>열람자 코드 관리 ({viewerList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>관리자 코드 교체</span>
          </button>
        </div>

        {/* Tab 1: Viewer Codes */}
        {activeTab === 'viewers' && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
            <p className="text-slate-500 text-[11px] leading-relaxed">
              접속 코드는 보안을 위해 <strong>서버에 단방향 해시(Bcrypt)</strong>로 암호화 저장되므로 원문 재조회가 불가능합니다.
              필요할 때 신규 발급하거나 사용하지 않는 코드를 즉시 폐기하세요.
            </p>

            {/* Issued One-time Banner */}
            {issuedCodeDisplay && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    새 열람자 코드가 발급되었습니다!
                  </span>
                  <button
                    onClick={() => handleCopy(issuedCodeDisplay)}
                    className="px-2 py-1 bg-white border border-emerald-300 rounded text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? '복사됨!' : '코드 복사'}</span>
                  </button>
                </div>
                <p className="font-mono text-sm font-bold text-emerald-950 bg-white/70 p-2 rounded border border-emerald-200/80">
                  {issuedCodeDisplay}
                </p>
                <p className="text-[10px] text-emerald-700">
                  ※ 코드는 지금만 화면에 표시됩니다. 창을 닫기 전에 복사하여 담당자에게 전달하세요.
                </p>
              </div>
            )}

            {/* Form: Issue New Code */}
            <form onSubmit={handleIssueViewerCode} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-teal-600" />
                <span>신규 열람자 코드 발급</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">식별 라벨/이름</label>
                  <input
                    type="text"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value)}
                    placeholder="예: 01호 (홍길동 강사)"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">접속 코드 (최소 6자)</label>
                  <input
                    type="text"
                    value={newCodeVal}
                    onChange={(e) => setNewCodeVal(e.target.value)}
                    placeholder="예: ubion0112"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>발급하기</span>
                </button>
              </div>
            </form>

            {/* List: Registered Viewer Codes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                <span>등록된 열람 코드 목록</span>
                <button onClick={loadCodes} className="hover:text-teal-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>새로고침</span>
                </button>
              </div>

              {viewerList.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  발급된 열람자 코드가 없습니다.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {viewerList.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        item.isActive
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{item.codeName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              item.isActive ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.isActive ? '활성' : '폐기됨'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          생성일: {item.createdAt.substring(0, 10)}
                        </p>
                      </div>

                      {item.isActive && (
                        <button
                          onClick={() => handleRevoke(item.id, item.codeName)}
                          className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="코드 폐기 및 연결된 모든 세션 강제 종료"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>폐기</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Rotate Admin Code */}
        {activeTab === 'admin' && (
          <form onSubmit={handleRotateAdmin} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-sky-900 text-[11px] leading-relaxed">
              <Shield className="w-4 h-4 text-sky-600 inline mr-1" />
              <strong>관리자 코드 교체 안내:</strong>
              <p className="mt-1 text-sky-800">
                기존 관리자 코드를 확인한 뒤 새로운 코드로 교체합니다. 교체 완료 시 구버전 코드로 발급되었던 모든 관리자 세션이 즉시 무효화됩니다.
              </p>
            </div>

            {adminRotateMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                  adminRotateMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {adminRotateMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{adminRotateMsg.text}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">현재 관리자 코드 확인</label>
                <input
                  type="password"
                  value={oldAdminCode}
                  onChange={(e) => setOldAdminCode(e.target.value)}
                  placeholder="현재 사용 중인 관리자 코드"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">새 관리자 코드 (최소 8자)</label>
                <input
                  type="password"
                  value={newAdminCode}
                  onChange={(e) => setNewAdminCode(e.target.value)}
                  placeholder="새로운 관리자 코드 (영문+숫자 혼합 권장)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">새 관리자 코드 확인</label>
                <input
                  type="password"
                  value={confirmAdminCode}
                  onChange={(e) => setConfirmAdminCode(e.target.value)}
                  placeholder="새로운 관리자 코드 재입력"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isLoading ? '교체 처리 중...' : '관리자 코드 교체하기'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
