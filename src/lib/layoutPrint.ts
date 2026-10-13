export type PrintPaperSize = 'A3' | 'A4';

export function preparePrintWindow(target: Window, size: PrintPaperSize, aspectRatio: number, page: number) {
  const [width, height] = size === 'A3' ? [297, 420] : [210, 297];
  const marginMm = 5 * 25.4 / 96;
  const imageWidth = Math.min(width - marginMm * 2, (height - marginMm * 2) * aspectRatio);
  const imageHeight = imageWidth / aspectRatio;
  const doc = target.document;
  if (!doc.doctype) doc.insertBefore(doc.implementation.createDocumentType('html', '', ''), doc.documentElement);
  doc.documentElement.lang = 'ko';
  doc.head.innerHTML = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
  doc.body.innerHTML = '<div class="tools"><button type="button" disabled>인쇄</button><p role="status">인쇄 이미지를 준비하고 있습니다.</p></div><main><img alt="글자 배치 인쇄 이미지" hidden></main>';
  doc.title = `글자 배치 · ${page}장 · ${size}`;
  const style = doc.createElement('style');
  style.textContent = `
    @page { size: ${size} portrait; margin: 5px; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; }
    .tools { padding: 12px; font: 14px sans-serif; }
    button { padding: 8px 16px; cursor: pointer; }
    main { width: calc(${width}mm - 10px); margin: 5px; display: flex; justify-content: flex-end; align-items: flex-start; }
    img { display: block; width: ${imageWidth}mm; height: ${imageHeight}mm; }
    img[hidden] { display: none; }
    @media print { .tools { display: none; } main { width: 100%; margin: 0; break-inside: avoid; } }
  `;
  doc.head.appendChild(style);
  const button = doc.querySelector('button')!;
  button.addEventListener('click', () => { target.focus(); target.print(); });
  return {
    async show(blob: Blob) {
      const image = doc.querySelector('img')!;
      const url = URL.createObjectURL(blob);
      try {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('Failed to load print image'));
          image.src = url;
        });
        if (target.closed) return;
        image.hidden = false;
        button.disabled = false;
        doc.querySelector('p')!.textContent = '자동으로 인쇄 창이 열리지 않으면 인쇄 버튼을 눌러 주세요.';
        target.requestAnimationFrame(() => target.requestAnimationFrame(() => {
          if (!target.closed) { target.focus(); target.print(); }
        }));
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    fail() {
      if (!target.closed) doc.querySelector('p')!.textContent = '인쇄 이미지를 준비하지 못했습니다. 이 창을 닫고 다시 시도해 주세요.';
    },
  };
}
