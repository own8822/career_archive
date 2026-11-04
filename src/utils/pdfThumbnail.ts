/**
 * Utility for reading file attachments:
 * Supports: PDF, MS Word (.doc, .docx), Hancom HWP (.hwp, .hwpx), Images (.jpg, .jpeg, .png)
 * Generates lightweight preview thumbnails and handles downloads.
 */

export type FileCategory = 'pdf' | 'word' | 'hwp' | 'image' | 'other';

export function getFileCategory(fileName: string): FileCategory {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['hwp', 'hwpx'].includes(ext)) return 'hwp';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image';
  return 'other';
}

export function getFileBadgeInfo(fileName: string): {
  label: string;
  bg: string;
  text: string;
  border: string;
  desc: string;
} {
  const cat = getFileCategory(fileName);
  switch (cat) {
    case 'pdf':
      return {
        label: 'PDF',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        desc: 'PDF 문서',
      };
    case 'word':
      return {
        label: 'WORD',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        desc: 'MS 워드 문서',
      };
    case 'hwp':
      return {
        label: '한글',
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        desc: '한글(HWP) 문서',
      };
    case 'image':
      return {
        label: '이미지',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        desc: '이미지 파일',
      };
    default:
      return {
        label: '파일',
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        desc: '첨부 문서',
      };
  }
}

// Generate realistic first-page preview thumbnail for Word documents
export function generateWordThumbnailUrl(fileName: string, studentName?: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cleanTitle = fileName.replace(/\.[^/.]+$/, '');

  // 1. Paper Background (A4 Crisp White)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 800);

  // Paper Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 600, 800);

  // 2. Word Header Stripe (Deep Blue)
  ctx.fillStyle = '#2b579a';
  ctx.fillRect(0, 0, 600, 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText('W  MICROSOFT WORD DOCUMENT', 30, 32);

  ctx.fillStyle = '#93c5fd';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Page 1 of Document', 570, 32);
  ctx.textAlign = 'left';

  // 3. Document Title Area (Top of Page 1)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  const displayTitle = cleanTitle.length > 22 ? cleanTitle.substring(0, 22) + '...' : cleanTitle;
  ctx.fillText(displayTitle, 40, 110);

  // Subtitle / Student meta
  ctx.fillStyle = '#64748b';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText(`작성자: ${studentName || '지원자'}  |  취업지원 첨삭 서류  |  등록일: 1페이지`, 40, 140);

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 160);
  ctx.lineTo(560, 160);
  ctx.stroke();

  // 4. Section 1 Box: Personal & Objective
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, 185, 520, 60);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 185, 520, 60);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText('■ 1. 직무 지원 동기 및 핵심 역량 요약', 55, 215);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText('금융 IT 및 데이터 분석 역량을 기반으로 프로젝트 성과를 도출한 경험 기술', 55, 235);

  // 5. Simulated Body Paragraphs
  const lineYStart = 275;
  for (let i = 0; i < 14; i++) {
    const y = lineYStart + i * 26;
    if (i === 5) {
      // Mid-section header
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
      ctx.fillText('■ 2. 주요 프로젝트 수행 경험 및 역할 분석', 40, y + 10);
      continue;
    }
    const width = (i % 3 === 0) ? 460 : (i % 2 === 0) ? 520 : 490;
    ctx.fillStyle = (i % 4 === 1) ? '#94a3b8' : '#cbd5e1';
    ctx.fillRect(40, y, width, 10);
  }

  // 6. Security & Preview Watermark Band at Bottom
  ctx.fillStyle = '#eff6ff';
  ctx.fillRect(40, 720, 520, 45);
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 720, 520, 45);

  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText('🔒 CAREER ARCHIVE DOCUMENT PREVIEW · 화면 내 열람 전용', 55, 748);

  return canvas.toDataURL('image/jpeg', 0.9);
}

// Generate realistic first-page preview thumbnail for Hancom HWP documents
export function generateHwpThumbnailUrl(fileName: string, studentName?: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cleanTitle = fileName.replace(/\.[^/.]+$/, '');

  // 1. Paper Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 800);

  // Paper Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 600, 800);

  // 2. Hancom Header Stripe (Cyan / Sky Blue)
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 600, 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText('한  한글과컴퓨터 HWP / HWPX DOCUMENT', 30, 32);

  ctx.fillStyle = '#bae6fd';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Page 1 of Document', 570, 32);
  ctx.textAlign = 'left';

  // 3. Document Title Area
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  const displayTitle = cleanTitle.length > 22 ? cleanTitle.substring(0, 22) + '...' : cleanTitle;
  ctx.fillText(displayTitle, 40, 110);

  // Subtitle / Student meta
  ctx.fillStyle = '#64748b';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText(`작성자: ${studentName || '지원자'}  |  한글 서식 첨삭 문서  |  등록일: 1페이지`, 40, 140);

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 160);
  ctx.lineTo(560, 160);
  ctx.stroke();

  // 4. Section 1 Box (Hancom Table format)
  ctx.fillStyle = '#f0f9ff';
  ctx.fillRect(40, 185, 520, 60);
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 185, 520, 60);

  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText('【 지원 서류 및 자기소개서 내용 】', 55, 215);

  ctx.fillStyle = '#475569';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText('입사지원서 및 직무수행계획서 첫 페이지 내용 요약', 55, 235);

  // 5. Simulated Body Paragraphs
  const lineYStart = 275;
  for (let i = 0; i < 14; i++) {
    const y = lineYStart + i * 26;
    if (i === 5) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
      ctx.fillText('【 직무 관련 자격 및 수료 프로젝트 】', 40, y + 10);
      continue;
    }
    const width = (i % 3 === 0) ? 470 : (i % 2 === 0) ? 520 : 490;
    ctx.fillStyle = (i % 4 === 1) ? '#94a3b8' : '#cbd5e1';
    ctx.fillRect(40, y, width, 10);
  }

  // 6. Security & Preview Watermark Band at Bottom
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(40, 720, 520, 45);
  ctx.strokeStyle = '#bbf7d0';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 720, 520, 45);

  ctx.fillStyle = '#15803d';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif';
  ctx.fillText('🔒 CAREER ARCHIVE DOCUMENT PREVIEW · 화면 내 열람 전용', 55, 748);

  return canvas.toDataURL('image/jpeg', 0.9);
}

// Generate fallback visual thumbnail for sample/mock PDFs
export function generateMockThumbnailUrl(title: string, subtext: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 300, 400);

  // Border & Header band
  ctx.fillStyle = '#f0fdf4'; // Light mint/teal
  ctx.fillRect(0, 0, 300, 50);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 300, 400);

  // Header Title
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 12px Pretendard, sans-serif';
  ctx.fillText('CAREER ARCHIVE REVIEW', 16, 30);

  // Document Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px Pretendard, sans-serif';
  const displayTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
  ctx.fillText(displayTitle, 16, 80);

  // Simulated Text Lines
  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < 7; i++) {
    const lineWidth = i % 2 === 0 ? 250 : 200;
    ctx.fillRect(16, 110 + i * 16, lineWidth, 6);
  }

  // Red-pen Markup Box (simulated feedback)
  ctx.fillStyle = '#fff1f2';
  ctx.fillRect(16, 240, 268, 80);
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 240, 268, 80);

  ctx.fillStyle = '#e11d48';
  ctx.font = 'bold 11px Pretendard, sans-serif';
  ctx.fillText('✓ 첨삭 피드백 메모 [Page 1]', 26, 262);

  ctx.fillStyle = '#475569';
  ctx.font = '10px Pretendard, sans-serif';
  const note = subtext.length > 35 ? subtext.substring(0, 35) + '...' : subtext;
  ctx.fillText(note, 26, 285);
  ctx.fillText('수치화 지표 및 문맥 교정 완료', 26, 302);

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px Pretendard, sans-serif';
  ctx.fillText('ATTACHED DOCUMENT', 16, 375);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Universal attachment thumbnail and data generator
 * Supports: PDF, Word (.doc, .docx), Hancom (.hwp, .hwpx), Images (.jpg, .jpeg, .png)
 */
export async function generateAttachmentThumbnail(
  file: File
): Promise<{ dataUrl: string; thumbnailUrl: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const cat = getFileCategory(file.name);

      // 1. Image: JPG / PNG
      if (cat === 'image') {
        try {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxW = 320;
            const maxH = 400;
            let w = img.width;
            let h = img.height;
            const ratio = Math.min(maxW / w, maxH / h, 1);
            canvas.width = Math.round(w * ratio);
            canvas.height = Math.round(h * ratio);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
              resolve({ dataUrl, thumbnailUrl: thumbUrl });
              return;
            }
            resolve({ dataUrl, thumbnailUrl: dataUrl });
          };
          img.onerror = () => resolve({ dataUrl, thumbnailUrl: dataUrl });
          img.src = dataUrl;
          return;
        } catch {
          resolve({ dataUrl, thumbnailUrl: dataUrl });
          return;
        }
      }

      // 2. Word: doc / docx
      if (cat === 'word') {
        const thumbUrl = generateWordThumbnailUrl(file.name);
        resolve({ dataUrl, thumbnailUrl: thumbUrl });
        return;
      }

      // 3. Hancom: hwp / hwpx
      if (cat === 'hwp') {
        const thumbUrl = generateHwpThumbnailUrl(file.name);
        resolve({ dataUrl, thumbnailUrl: thumbUrl });
        return;
      }

      // 4. PDF
      if (cat === 'pdf') {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
            pdfjsLib.version || '3.11.174'
          }/pdf.worker.min.js`;

          const loadingTask = pdfjsLib.getDocument({ data: atob(dataUrl.split(',')[1]) });
          const pdfDoc = await loadingTask.promise;
          const page = await pdfDoc.getPage(1);

          const viewport = page.getViewport({ scale: 0.8 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            const thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve({ dataUrl, thumbnailUrl: thumbUrl });
            return;
          }
        } catch (err) {
          console.warn('PDF.js thumbnail generation fallback used:', err);
        }

        const fallbackThumb = generateMockThumbnailUrl(file.name, '업로드된 첨삭 문서 첫 페이지');
        resolve({ dataUrl, thumbnailUrl: fallbackThumb });
        return;
      }

      // 5. Fallback
      const fallbackThumb = generateMockThumbnailUrl(file.name, '첨부 문서');
      resolve({ dataUrl, thumbnailUrl: fallbackThumb });
    };

    reader.onerror = () => {
      resolve({ dataUrl: '', thumbnailUrl: '' });
    };

    reader.readAsDataURL(file);
  });
}

// Backward-compatible alias
export const generatePdfThumbnail = generateAttachmentThumbnail;
