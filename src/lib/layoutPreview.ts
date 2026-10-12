import { Application, Graphics, Text } from 'pixi.js';
import { layoutText } from './layoutText';

const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const element = (id: string) => document.getElementById(id)!;
const numeric = (id: string, fallback: number, min: number, max: number) => {
  const value = Number(input(id).value);
  return Number.isFinite(value) && input(id).value !== '' ? Math.min(max, Math.max(min, value)) : fallback;
};
const presets: Record<string, [string, number, number, number]> = {
  half: ['반절지', 35, 135, 4], full: ['전지', 70, 135, 8], national: ['국전지', 70, 100, 8],
};
const fontFallbacks = ['Batang', 'AppleMyungjo', 'Noto Serif CJK KR', 'Malgun Gothic', 'Apple SD Gothic Neo', 'sans-serif'];
const fontFamilies: Record<string, string[]> = {
  sj_lck: ['sj_lck', '이철경체', ...fontFallbacks],
  sj_lmk: ['sj_lmk', '이미경체', ...fontFallbacks],
  sj_kch: ['sj_kch', '김충현체', ...fontFallbacks],
  serif: fontFallbacks,
  'sans-serif': ['Malgun Gothic', 'Apple SD Gothic Neo', 'sans-serif'],
};
let page = 0;
let totalPages = 1;
let timer: ReturnType<typeof setTimeout>;
const app = new Application();
const viewport = element('preview-viewport');
const paperPreview = element('paper-preview');
let paperWidth = 0;
let paperHeight = 0;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;

function applyCamera() {
  paperPreview.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
}

function fitPaper() {
  if (!paperWidth || !paperHeight || !viewport.clientWidth || !viewport.clientHeight) return;
  const padding = 32;
  zoom = Math.min(
    (viewport.clientWidth - padding * 2) / paperWidth,
    (viewport.clientHeight - padding * 2) / paperHeight,
  );
  zoom = Math.max(0.05, zoom);
  offsetX = (viewport.clientWidth - paperWidth * zoom) / 2;
  offsetY = (viewport.clientHeight - paperHeight * zoom) / 2;
  applyCamera();
}

function zoomAt(factor: number, x: number, y: number) {
  const nextZoom = Math.min(5, Math.max(0.05, zoom * factor));
  const ratio = nextZoom / zoom;
  offsetX = x - (x - offsetX) * ratio;
  offsetY = y - (y - offsetY) * ratio;
  zoom = nextZoom;
  applyCamera();
}

function setupCamera() {
  const centerZoom = (factor: number) => zoomAt(factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
  element('fit-paper').addEventListener('click', fitPaper);
  element('zoom-in').addEventListener('click', () => centerZoom(1.2));
  element('zoom-out').addEventListener('click', () => centerZoom(1 / 1.2));
  let lastX = 0;
  let lastY = 0;
  let dragging = false;
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('.viewport-controls'))) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    offsetX += event.clientX - lastX;
    offsetY += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    applyCamera();
  });
  viewport.addEventListener('pointerup', () => { dragging = false; });
  viewport.addEventListener('pointercancel', () => { dragging = false; });
  viewport.addEventListener('lostpointercapture', () => { dragging = false; });
  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    const units = [1, 16, viewport.clientHeight][event.deltaMode] ?? 1;
    const deltaX = event.deltaX * units;
    const deltaY = event.deltaY * units;
    if (event.metaKey || event.ctrlKey) {
      const rect = viewport.getBoundingClientRect();
      zoomAt(Math.exp(-deltaY * 0.0015), event.clientX - rect.left, event.clientY - rect.top);
      return;
    }
    if (event.shiftKey) {
      offsetX -= deltaY || deltaX;
    } else {
      offsetX -= deltaX;
      offsetY -= deltaY;
    }
    applyCamera();
  }, { passive: false });
  new ResizeObserver(fitPaper).observe(viewport);
}

function draw() {
  const width = numeric('paper-width', 70, 10, 200);
  const height = numeric('paper-height', 135, 10, 300);
  const rows = Math.floor(numeric('rows', 17, 1, 50));
  const columns = Math.floor(numeric('columns', 8, 1, 30));
  const manuscript = (element('manuscript') as HTMLTextAreaElement).value;
  const seal = input('seal').value;
  const { cells, pages } = layoutText(manuscript, rows, columns, input('spaces').checked, seal);
  totalPages = pages;
  page = Math.min(page, pages - 1);
  const scale = 1000 / Math.max(width, height);
  const w = width * scale;
  const h = height * scale;
  paperWidth = w;
  paperHeight = h;
  const margin = Math.min(w, h) * numeric('margin', 8, 3, 20) / 100;
  const cellWidth = (w - margin * 2) / columns;
  const cellHeight = (h - margin * 2) / rows;
  app.renderer.resize(w, h);
  paperPreview.style.width = `${w}px`;
  paperPreview.style.height = `${h}px`;
  app.canvas.style.width = '100%';
  app.canvas.style.height = 'auto';
  for (const child of app.stage.removeChildren()) child.destroy();
  const grid = new Graphics();
  app.stage.addChild(grid);
  const addText = (text: string, x: number, y: number, fontSize: number, fill: string, fontFamily: string | string[]) => {
    const label = new Text({ text, style: { fontFamily, fontSize, fill } });
    label.anchor.set(0.5);
    label.position.set(x, y);
    app.stage.addChild(label);
  };
  if (input('grid').checked) {
    for (let c = 0; c <= columns; c++) grid.moveTo(margin + c * cellWidth, margin).lineTo(margin + c * cellWidth, h - margin);
    for (let r = 0; r <= rows; r++) grid.moveTo(margin, margin + r * cellHeight).lineTo(w - margin, margin + r * cellHeight);
    grid.stroke({ color: 0x8195ac, alpha: 0.45, width: 1 });
    const numberSize = Math.min(13, margin * .4, cellWidth * .4, cellHeight * .5);
    for (let c = 0; c < columns; c++) addText(String(c + 1), w - margin - (c + .5) * cellWidth, margin * .5, numberSize, '#60738a', 'sans-serif');
    for (let r = 0; r < rows; r++) addText(String(r + 1), w - margin * .5, margin + (r + .5) * cellHeight, numberSize, '#60738a', 'sans-serif');
  }
  const fontSize = Math.min(cellWidth, cellHeight) * numeric('font-size', 70, 30, 95) / 100;
  const sealSize = Math.min(cellWidth, cellHeight) * numeric('seal-size', 50, 20, 95) / 100;
  const fontFamily = fontFamilies[(element('font') as HTMLSelectElement).value] ?? fontFamilies.serif;
  for (const cell of cells) {
    if (cell.page !== page || /^\s+$/u.test(cell.text)) continue;
    addText(cell.text, w - margin - (cell.column + .5) * cellWidth, margin + (cell.row + .5) * cellHeight, cell.kind === 'seal' ? sealSize : fontSize, cell.kind === 'seal' ? '#a62727' : '#24221e', fontFamily);
  }
  app.render();
  const preset = presets[(element('paper') as HTMLSelectElement).value]!;
  element('paper-info').textContent = `${width === preset[1] && height === preset[2] ? preset[0] : '사용자 지정'} · ${width} × ${height} cm`;
  element('page-info').textContent = `${page + 1} / ${pages}장`;
  (element('previous') as HTMLButtonElement).disabled = page === 0;
  (element('next') as HTMLButtonElement).disabled = page === pages - 1;
  element('margin-value').textContent = `${input('margin').value}%`;
  element('font-size-value').textContent = `${input('font-size').value}%`;
  element('seal-size-value').textContent = `${input('seal-size').value}%`;
  element('layout-summary').textContent = `${cells.length.toLocaleString('ko-KR')}칸 사용 · ${columns}열 × ${rows}행 · 장당 ${columns * rows}칸`;
  element('paper-preview').setAttribute('aria-label', `${page + 1}장, ${columns}열 ${rows}행, 오른쪽부터 세로쓰기. ${cells.filter(c => c.page === page).map(c => c.text).join('')}`);
}

async function initialize() {
  try {
    element('render-status').textContent = '캔버스를 초기화하고 있습니다.';
    await app.init({ background: '#fffef8', antialias: true, autoStart: false, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true, preference: 'webgl' });
    element('paper-preview').appendChild(app.canvas);
    element('render-status').hidden = true;
    setupCamera();
    document.querySelectorAll('.controls input, .controls textarea, .controls select').forEach(control => {
      control.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          draw();
          if (control.id === 'paper-width' || control.id === 'paper-height') fitPaper();
        }, 80);
      });
    });
    element('paper').addEventListener('change', () => {
      const [, width, height, columns] = presets[(element('paper') as HTMLSelectElement).value]!;
      input('paper-width').value = String(width);
      input('paper-height').value = String(height);
      input('columns').value = String(columns);
      page = 0;
      draw();
      fitPaper();
    });
    element('previous').addEventListener('click', () => { page = Math.max(0, page - 1); draw(); });
    element('next').addEventListener('click', () => { page = Math.min(totalPages - 1, page + 1); draw(); });
    draw();
    fitPaper();
  } catch (error) {
    element('render-status').hidden = false;
    element('render-status').textContent = '미리보기를 시작하지 못했습니다. 브라우저의 하드웨어 가속을 확인한 뒤 새로고침해 주세요.';
    console.error('Failed to initialize layout preview', error);
  }
}

void initialize();
