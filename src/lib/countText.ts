const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });

export function countText(text: string) {
	let characters = 0;
	let withoutSpaces = 0;

	for (const { segment } of segmenter.segment(text)) {
		characters += 1;
		if (!/^\s+$/u.test(segment)) withoutSpaces += 1;
	}

	return {
		characters,
		withoutSpaces,
		words: text.match(/\S+/gu)?.length ?? 0,
	};
}
