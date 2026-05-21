declare module 'markdown-it-texmath' {
	import type MarkdownIt from 'markdown-it';
	import type katex from 'katex';

	type Delimiter = 'beg_end' | 'brackets' | 'dollars' | 'doxygen' | 'gitlab' | 'julia' | 'kramdown';

	type TexmathOptions = {
		delimiters?: Delimiter | Delimiter[];
		engine?: typeof katex;
		katexOptions?: katex.KatexOptions;
		macros?: katex.KatexOptions['macros'];
		outerSpace?: boolean;
	};

	export default function texmath(markdown: MarkdownIt, options?: TexmathOptions): void;
}
