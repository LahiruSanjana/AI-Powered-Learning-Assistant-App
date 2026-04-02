const normalizeText = (input) => {
	return String(input || '')
		.replace(/\r\n/g, '\n')
		.replace(/\t/g, ' ')
		.replace(/\u00a0/g, ' ')
		.replace(/[ ]{2,}/g, ' ')
		.trim();
};

const splitIntoPages = (text) => {
	const pages = text.split('\f').map((page) => page.trim()).filter(Boolean);
	if (pages.length > 0) {
		return pages;
	}
	return [text];
};

const findBestBreak = (text, start, maxEnd, minEnd) => {
	const slice = text.slice(start, maxEnd);

	// Prefer sentence boundaries first: ., ?, ! then optional quotes/brackets and whitespace
	const sentenceRegex = /[.!?]["')\]]?\s+/g;
	let sentenceMatch;
	let lastSentenceBreak = -1;

	while ((sentenceMatch = sentenceRegex.exec(slice)) !== null) {
		lastSentenceBreak = sentenceMatch.index + sentenceMatch[0].length;
	}

	if (lastSentenceBreak >= (minEnd - start)) {
		return start + lastSentenceBreak;
	}

	const lastDoubleNewline = slice.lastIndexOf('\n\n');
	if (lastDoubleNewline >= (minEnd - start)) {
		return start + lastDoubleNewline + 2;
	}

	const lastNewline = slice.lastIndexOf('\n');
	if (lastNewline >= (minEnd - start)) {
		return start + lastNewline + 1;
	}

	const lastSpace = slice.lastIndexOf(' ');
	if (lastSpace >= (minEnd - start)) {
		return start + lastSpace + 1;
	}

	return maxEnd;
};

export const chunkText = (text, options = {}) => {
	const {
		chunkSize = 1000,
		overlap = 200,
		minChunkLength = 100
	} = options;

	if (typeof text !== 'string' || text.trim().length === 0) {
		return [];
	}

	if (chunkSize <= 0) {
		throw new Error('chunkSize must be greater than 0');
	}

	if (overlap < 0 || overlap >= chunkSize) {
		throw new Error('overlap must be >= 0 and less than chunkSize');
	}

	const normalized = normalizeText(text);
	const pages = splitIntoPages(normalized);
	const chunks = [];
	let globalChunkIndex = 0;

	pages.forEach((pageText, pageIdx) => {
		let cursor = 0;
		const pageNumber = pageIdx + 1;
		const minPreferredEnd = Math.floor(chunkSize * 0.6);

		while (cursor < pageText.length) {
			const maxEnd = Math.min(cursor + chunkSize, pageText.length);
			const end = maxEnd < pageText.length
				? findBestBreak(pageText, cursor, maxEnd, cursor + minPreferredEnd)
				: maxEnd;

			const content = pageText.slice(cursor, end).trim();
			if (content.length >= minChunkLength || end === pageText.length) {
				chunks.push({
					content,
					pageNumber,
					chunkIndex: globalChunkIndex
				});
				globalChunkIndex += 1;
			}

			if (end === pageText.length) {
				break;
			}

			cursor = Math.max(0, end - overlap);
		}
	});

	return chunks;
};

export default chunkText;
