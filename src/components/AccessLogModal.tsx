import React from 'react';
import { X, History, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AccessLog } from '../types';

interface AccessLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessLogModal: React.FC<AccessLogModalProps> = ({ isOpen, onClose }) => {
  const { accessLogs } = useAuth();

  if (!isOpen) return null;

  const getActionBadge = (action: AccessLog['action']) => {
    switch (action) {
      case 'login':
        return { label: '로그인', bg: 'bg-slate-100 text-slate-700' };
      case 'create_record':
        return { label: '상담기록 등록', bg: 'bg-emerald-100 text-emerald-800' };
      case 'create_student':
        return { label: '학생 등록', bg: 'bg-blue-100 text-blue-800' };
      case 'view_pdf':
        return { label: 'PDF 열람', bg: 'bg-rose-100 text-rose-800' };
      case 'view_student':
        return { label: '학생 조회', bg: 'bg-purple-100 text-purple-800' };
      default:
        return { label: '활동', bg: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-800 text-brand-400 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>보안 및 접속 이력 관리</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  Audit Trail
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                컨설턴트 및 팀원의 시스템 접근, 학생 정보 열람, 첨삭 PDF 다운로드 활동이 안전하게 기록됩니다.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">접속 일시</th>
                  <th className="py-3 px-3">사용자 / 권한</th>
                  <th className="py-3 px-3">활동 유형</th>
                  <th className="py-3 px-3">상세 내용</th>
                  <th className="py-3 px-3 text-right">IP 주소</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accessLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-900">{log.userName}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            log.role === 'admin'
                              ? 'bg-brand-50 text-brand-700 border border-brand-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {log.role === 'admin' ? '관리자' : '팀원(읽기전용)'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium">
                        {log.targetInfo || '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>총 {accessLogs.length}건의 감사 로그가 보관 중입니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
