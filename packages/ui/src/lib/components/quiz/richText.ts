export type RichTextSegment = {
	id: string;
	type: 'text' | 'math';
	value: string;
};

function findNextMathDelimiter(value: string, start: number) {
	const parenIndex = value.indexOf('\\(', start);
	const dollarIndex = value.indexOf('$', start);

	if (parenIndex === -1) {
		return dollarIndex === -1 ? null : { index: dollarIndex, open: '$', close: '$' };
	}

	if (dollarIndex === -1 || parenIndex < dollarIndex) {
		return { index: parenIndex, open: '\\(', close: '\\)' };
	}

	return { index: dollarIndex, open: '$', close: '$' };
}

function createSegment(type: RichTextSegment['type'], value: string, start: number) {
	return {
		id: `${type}-${start}-${value.length}`,
		type,
		value
	};
}

export function tokenizeRichText(value: string) {
	const segments: RichTextSegment[] = [];
	let cursor = 0;

	while (cursor < value.length) {
		const delimiter = findNextMathDelimiter(value, cursor);

		if (!delimiter) {
			segments.push(createSegment('text', value.slice(cursor), cursor));
			break;
		}

		if (delimiter.index > cursor) {
			segments.push(createSegment('text', value.slice(cursor, delimiter.index), cursor));
		}

		const contentStart = delimiter.index + delimiter.open.length;
		const contentEnd = value.indexOf(delimiter.close, contentStart);

		if (contentEnd === -1) {
			segments.push(createSegment('text', delimiter.open, delimiter.index));
			cursor = contentStart;
			continue;
		}

		const formula = value.slice(contentStart, contentEnd);
		segments.push(createSegment('math', formula, delimiter.index));
		cursor = contentEnd + delimiter.close.length;
	}

	return segments;
}
