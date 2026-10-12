export function layoutText(text: string, rows: number, columns: number, keepSpaces: boolean, seal = '') {
  const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
  const normalized = text.split(/\r\n?|\n/).map(line => line.trim()).join(' ');
  const cells: { text: string; row: number; column: number; page: number; kind: 'body' | 'seal' }[] = [];
  for (const [source, kind] of [[normalized, 'body'], [seal.trim(), 'seal']] as const) {
    for (const { segment } of segmenter.segment(source)) {
      if (!keepSpaces && /^\s+$/u.test(segment)) continue;
      const index = cells.length;
      cells.push({
        text: segment === '\t' ? ' ' : segment,
        row: index % rows,
        column: Math.floor(index / rows) % columns,
        page: Math.floor(index / (rows * columns)),
        kind,
      });
    }
  }
  return { cells, pages: Math.max(1, (cells.at(-1)?.page ?? 0) + 1) };
}
