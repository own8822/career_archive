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

// Generate thumbnail for Word documents
export function generateWordThumbnailUrl(fileName: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 300, 400);

  // Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 300, 400);

  // Header band (Word Blue)
  ctx.fillStyle = '#2b579a';
  ctx.fillRect(0, 0, 300, 56);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Pretendard, sans-serif';
  ctx.fillText('MICROSOFT WORD', 16, 34);

  // Big 'W' Icon
  ctx.fillStyle = '#2b579a';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(100, 100, 100, 100, 16);
  } else {
    ctx.rect(100, 100, 100, 100);
  }
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('W', 150, 172);

  // Document Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px Pretendard, sans-serif';
  const displayTitle = fileName.length > 22 ? fileName.substring(0, 22) + '...' : fileName;
  ctx.fillText(displayTitle, 20, 250);

  // Simulated lines
  ctx.fillStyle = '#e2e8f0';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(20, 275 + i * 16, i % 2 === 0 ? 260 : 200, 6);
  }

  // Footer badge
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(20, 350, 260, 26);
  ctx.fillStyle = '#2b579a';
  ctx.font = 'bold 10px Pretendard, sans-serif';
  ctx.fillText('WORD DOCUMENT (.DOC / .DOCX)', 30, 367);

  return canvas.toDataURL('image/jpeg', 0.85);
}

// Generate thumbnail for Hancom HWP documents
export function generateHwpThumbnailUrl(fileName: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 300, 400);

  // Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 300, 400);

  // Header band (Hancom Cyan/Blue)
  ctx.fillStyle = '#0078d4';
  ctx.fillRect(0, 0, 300, 56);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Pretendard, sans-serif';
  ctx.fillText('한글과컴퓨터 HWP', 16, 34);

  // Big '한' Icon
  ctx.fillStyle = '#0078d4';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(100, 100, 100, 100, 16);
  } else {
    ctx.rect(100, 100, 100, 100);
  }
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('한', 150, 170);

  // Document Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px Pretendard, sans-serif';
  const displayTitle = fileName.length > 22 ? fileName.substring(0, 22) + '...' : fileName;
  ctx.fillText(displayTitle, 20, 250);

  // Simulated lines
  ctx.fillStyle = '#e2e8f0';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(20, 275 + i * 16, i % 2 === 0 ? 260 : 200, 6);
  }

  // Footer badge
  ctx.fillStyle = '#f0f9ff';
  ctx.fillRect(20, 350, 260, 26);
  ctx.fillStyle = '#0078d4';
  ctx.font = 'bold 10px Pretendard, sans-serif';
  ctx.fillText('HANCOM DOCUMENT (.HWP / .HWPX)', 30, 367);

  return canvas.toDataURL('image/jpeg', 0.85);
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
