import React, { useState, useId } from 'react';
import {
  X,
  FileSpreadsheet,
  ClipboardPaste,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Student, PRESET_COHORTS } from '../types';
import {
  ParsedStudentRow,
  parsePastedText,
  parseSpreadsheetFile,
  convertRowsToStudents,
} from '../utils/sheetParser';
import { archiveStorage } from '../services/storage';

interface SheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents: Student[];
  onImportComplete: (updatedStudents: Student[]) => void;
  defaultCohort?: string;
}

export const SheetImportModal: React.FC<SheetImportModalProps> = ({
  isOpen,
  onClose,
  existingStudents,
  onImportComplete,
  defaultCohort = '디금융 8기',
}) => {
  const fileInputId = useId();
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [selectedCohort, setSelectedCohort] = useState(
    defaultCohort && defaultCohort !== 'all' ? defaultCohort : '디금융 8기'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Text Paste Input Change
  const handleTextChange = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    const rows = parsePastedText(text, selectedCohort);
    setParsedRows(rows);
  };

  // Handle Cohort Change
  const handleCohortChange = (cohort: string) => {
    setSelectedCohort(cohort);
    if (pastedText.trim()) {
      const rows = parsePastedText(pastedText, cohort);
      setParsedRows(rows);
    }
  };

  // Handle File Upload (.xlsx, .xls, .csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    try {
      const rows = await parseSpreadsheetFile(file, selectedCohort);
      setParsedRows(rows);
    } catch (err) {
      console.error(err);
      alert('파일을 읽는 도중 오류가 발생했습니다. 올바른 엑셀 또는 CSV 파일인지 확인해주세요.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // Execute Import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid && r.name.trim());
    if (validRows.length === 0) {
      alert('가져올 수 있는 유효한 학생 데이터가 없습니다.');
      return;
    }

    setIsProcessing(true);
    try {
      const { newStudents, createdCount, updatedCount } = convertRowsToStudents(
        validRows,
        existingStudents
      );

      // Save to IndexedDB (and Supabase)
      await archiveStorage.saveStudentsBatch(newStudents);

      // Notify parent to update react state
      onImportComplete(newStudents);

      alert(
        `🎉 총 ${validRows.length}명의 학생 데이터가 성공적으로 반영되었습니다!\n` +
          `- 새로 등록된 학생: ${createdCount}명\n` +
          `- 기존 학생 확인(상담기록·첨부파일 유지): ${updatedCount}명\n` +
          `※ 개인정보 보호를 위해 성명과 기수만 안전하게 저장되었습니다.`
      );

      // Reset and close
      setPastedText('');
      setParsedRows([]);
      setFileName(null);
      onClose();
    } catch (err) {
      console.error(err);
      alert('데이터 저장 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid && r.name.trim()).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                구글 시트 / 엑셀 학생 명부 가져오기
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  개인정보 보호 적용
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                구글 시트나 엑셀에서 학생 명부를 복사하거나 업로드하여 일괄 등록합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Privacy Security Banner */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start space-x-2 text-emerald-900 text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">🔒 학생 개인정보 보호 조치 안내</p>
              <p className="text-emerald-800 mt-0.5">
                혹시 모를 정보 유출 사고를 방지하기 위해 <strong>기수와 성명(이름)</strong>만 아카이브에 등록됩니다.
                시트 복사 내용이나 파일에 전화번호, 생년, 학교, 이메일 등이 포함되어 있더라도 자동으로 제외(필터링)되어 안전합니다.
              </p>
            </div>
          </div>

          {/* Method Selection Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 px-4 font-bold flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>구글 시트 복사 & 붙여넣기 (Ctrl+V)</span>
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`pb-2.5 px-4 font-bold flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>엑셀 / CSV 파일 업로드</span>
            </button>
          </div>

          {/* Tab 1: Direct Copy & Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 flex items-center space-x-1">
                  <span>구글 시트 표를 드래그하여 복사(Ctrl+C)한 뒤 아래에 붙여넣기(Ctrl+V)하세요:</span>
                </label>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <span>기수 미지정 시 기본 기수:</span>
                  <select
                    value={selectedCohort}
                    onChange={(e) => handleCohortChange(e.target.value)}
                    className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {PRESET_COHORTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`예시 (기수, 성명만 안전하게 추출됩니다):\n기수\t성명\n디금융 8기\t홍길동\n디금융 8기\t김철수`}
                rows={6}
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {/* Tab 2: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">엑셀(.xlsx, .xls) 또는 구글시트 다운로드 파일(.csv):</span>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <span>기수 미지정 시 기본 기수:</span>
                  <select
                    value={selectedCohort}
                    onChange={(e) => handleCohortChange(e.target.value)}
                    className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {PRESET_COHORTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-emerald-50/30 transition-colors">
                <input
                  id={fileInputId}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor={fileInputId}
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-emerald-700 hover:underline">
                      파일 선택하기
                    </span>
                    <span className="text-slate-500"> 또는 여기에 드래그앤드롭</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    구글 시트에서 [파일 &gt; 다운로드 &gt; 쉼표로 구분된 값(.csv)] 또는 [Microsoft Excel(.xlsx)]
                  </p>
                </label>
              </div>

              {fileName && (
                <div className="flex items-center space-x-2 p-2.5 bg-slate-100 rounded-xl text-slate-700 font-medium">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>선택된 파일: {fileName}</span>
                </div>
              )}
            </div>
          )}

          {/* Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">
                    등록 미리보기 (총 {parsedRows.length}명)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    등록 가능: {validCount}명
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                      오류: {invalidCount}명
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  ※ 이미 등록된 학생의 기존 상담기록 및 첨부파일은 안전하게 보존됩니다.
                </span>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 font-bold z-10">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">No</th>
                      <th className="py-2 px-3">기수</th>
                      <th className="py-2 px-4">성명 (이름)</th>
                      <th className="py-2 px-3 text-slate-500 font-normal">개인정보 필터링</th>
                      <th className="py-2 px-3 text-center w-16">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 ${
                          !row.isValid ? 'bg-rose-50/50 text-rose-700' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-teal-800">
                          {row.cohort}
                        </td>
                        <td className="py-2 px-4 font-bold text-slate-900 text-xs">{row.name}</td>
                        <td className="py-2 px-3 text-slate-400 text-[10px]">
                          전화번호·학교·생년 등 제외됨
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center text-emerald-600 font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center text-rose-500 font-medium"
                              title={row.error}
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {parsedRows.length > 0 ? (
              <span>
                준비 완료: <strong>{validCount}명</strong> 등록 예정
              </span>
            ) : (
              <span>구글 시트 데이터를 붙여넣거나 파일을 선택하면 미리보기가 표시됩니다.</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
            >
              취소
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isProcessing}
              className={`px-5 py-2 rounded-xl text-white font-bold flex items-center space-x-1.5 transition-all shadow-xs text-xs ${
                validCount === 0 || isProcessing
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-[0.98]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isProcessing
                  ? '등록 처리 중...'
                  : validCount > 0
                  ? `총 ${validCount}명 아카이브에 등록하기`
                  : '데이터를 입력해주세요'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
