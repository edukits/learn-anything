import katex from 'katex/dist/katex.mjs';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import texmath from 'markdown-it-texmath';

const mathTags = [
	'annotation',
	'eq',
	'eqn',
	'math',
	'mfrac',
	'mi',
	'mmultiscripts',
	'mn',
	'mo',
	'mover',
	'mpadded',
	'mphantom',
	'mroot',
	'mrow',
	'mspace',
	'msqrt',
	'msub',
	'msubsup',
	'msup',
	'mtable',
	'mtd',
	'mtext',
	'mtr',
	'munder',
	'munderover',
	'none',
	'section',
	'semantics'
];

const markdown = new MarkdownIt({
	breaks: false,
	html: false,
	linkify: true,
	typographer: false
}).use(texmath, {
	delimiters: ['dollars', 'brackets'],
	engine: katex,
	katexOptions: {
		output: 'html',
		throwOnError: false,
		trust: false
	}
});

export function renderRichTextMarkdown(value: string) {
	return sanitizeHtml(markdown.render(value), {
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			'*': ['aria-hidden', 'class', 'style'],
			annotation: ['encoding'],
			a: ['href', 'name', 'target'],
			math: ['display', 'xmlns']
		},
		allowedSchemes: ['http', 'https', 'mailto'],
		allowedStyles: {
			'*': {
				'border-bottom-width': [/^[\d.]+em$/],
				height: [/^[\d.]+em$/],
				'margin-left': [/^-?[\d.]+em$/],
				'margin-right': [/^[\d.]+em$/],
				'min-width': [/^[\d.]+em$/],
				'padding-left': [/^[\d.]+em$/],
				position: [/^relative$/],
				top: [/^-?[\d.]+em$/],
				'vertical-align': [/^-?[\d.]+em$/]
			}
		},
		allowedTags: [...sanitizeHtml.defaults.allowedTags, ...mathTags]
	});
}
