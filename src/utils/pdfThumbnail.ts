/**
 * Utility for reading PDF files and generating real page 1 image thumbnails
 */

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
  ctx.fillText('PAGE 1 / ATTACHED PDF', 16, 375);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Generate a thumbnail from an uploaded File using FileReader & pdfjs if available,
 * or Canvas document rendering.
 */
export async function generatePdfThumbnail(file: File): Promise<{ dataUrl: string; thumbnailUrl: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        // Attempt PDF.js rendering if library is loaded
        const pdfjsLib = await import('pdfjs-dist');
        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

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

      // Fallback thumbnail generator
      const fallbackThumb = generateMockThumbnailUrl(file.name, '업로드된 첨삭 문서 첫 페이지');
      resolve({ dataUrl, thumbnailUrl: fallbackThumb });
    };

    reader.onerror = () => {
      const fallbackThumb = generateMockThumbnailUrl(file.name, '첨삭 문서');
      resolve({ dataUrl: '', thumbnailUrl: fallbackThumb });
    };

    reader.readAsDataURL(file);
  });
}
