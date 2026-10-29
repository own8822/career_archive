import React, { useState } from 'react';
import { X, Download, Upload, CloudUpload, Check, AlertCircle, Database, FileJson, FileSpreadsheet } from 'lucide-react';
import { archiveStorage } from '../services/storage';
import { isSupabaseConfigured } from '../services/supabase';
import { Student } from '../types';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: (students: Student[]) => void;
  onOpenSheetImport?: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  onOpenSheetImport,
}) => {
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  // 1. Export Backup JSON file
  const handleExportBackup = async () => {
    try {
      const jsonStr = await archiveStorage.exportBackupJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date().toISOString().substring(0, 10);
      a.href = url;
      a.download = `career_archive_backup_${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMsg({
        text: '개인 PC의 모든 자료가 백업 파일(.json)로 안전하게 다운로드되었습니다.',
        type: 'success',
      });
    } catch (e) {
      console.error(e);
      setStatusMsg({ text: '백업 파일 생성 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  // 2. Import Backup JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const jsonStr = reader.result as string;
        const restored = await archiveStorage.importBackupJson(jsonStr);
        onDataRestored(restored);
        setStatusMsg({
          text: `백업 파일로부터 총 ${restored.length}명의 학생 자료가 성공적으로 복원되었습니다!`,
          type: 'success',
        });
      } catch (err) {
        console.error(err);
        setStatusMsg({ text: '올바른 백업 JSON 파일이 아니거나 손상되었습니다.', type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. Migrate Local Data to Supabase
  const handleMigrateToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      setStatusMsg({
        text: '아직 .env 파일에 수파베이스 URL과 Key가 입력되지 않았습니다.',
        type: 'error',
      });
      return;
    }

    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const count = await archiveStorage.syncLocalToSupabase();
      setStatusMsg({
        text: `로컬 PC에 있던 ${count}명의 학생 및 상담 기록 전체가 수파베이스 클라우드로 성공적으로 이관되었습니다!`,
        type: 'success',
      });
    } catch (e) {
      console.error(e);
      setStatusMsg({ text: '수파베이스 이관 중 오류가 발생했습니다. 키 설정을 확인해주세요.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-sky-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-teal-50">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">데이터 백업 및 수파베이스 이관</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Status Message Alert */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border flex items-start space-x-2 animate-in fade-in ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{statusMsg.text}</span>
            </div>
          )}

          {/* 1. Google Sheets / Excel Import */}
          {onOpenSheetImport && (
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900 flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>구글 시트 / 엑셀 데이터 가져오기</span>
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    기수, 연번, 성명, 생년, 휴대폰, 메일, 학교, 학과 등의 스프레드시트 명부를 복사-붙여넣기나 파일로 즉시 일괄 등록합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSheetImport();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>시트 가져오기</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Export to Local JSON File */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <FileJson className="w-4 h-4 text-sky-600" />
                  <span>개인 PC 데이터 백업 파일 다운로드</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  현재 등록된 모든 학생, 상담 기록, PDF 첨부 자료를 단일 백업 파일(.json)로 저장합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center space-x-1 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>백업 받기</span>
              </button>
            </div>
          </div>

          {/* 2. Import from JSON File */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span>백업 파일 복원 / 불러오기</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  다른 PC로 옮기거나 이전에 백업해 둔 JSON 파일을 선택하여 그대로 복원합니다.
                </p>
              </div>
              <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-2xs transition-colors flex items-center space-x-1 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>파일 선택</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 3. Migrate to Supabase (Cloud) */}
          <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5">
                  <CloudUpload className="w-4 h-4 text-teal-700" />
                  <h4 className="font-bold text-teal-900">나중에 수파베이스로 한 번에 옮기기</h4>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">
                    클라우드 이관
                  </span>
                </div>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  개인 PC에 모아둔 자료를 .env 설정 후 수파베이스 클라우드 웹 DB로 원클릭 일괄 전송합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleMigrateToSupabase}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center space-x-1 shrink-0 disabled:opacity-50"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isSyncing ? '이관 중...' : '클라우드 이관'}</span>
              </button>
            </div>
            {!isSupabaseConfigured() && (
              <p className="text-[10px] text-slate-400">
                ※ 현재는 로컬 모드입니다. 나중에 .env 파일에 수파베이스 정보를 입력하시면 이 버튼이 활성화됩니다.
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-white transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
