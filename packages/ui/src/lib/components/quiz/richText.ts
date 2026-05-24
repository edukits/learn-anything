import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const sanitizeSchema = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		code: [
			['className', /^language-./, 'math-inline', 'math-display'],
			...(defaultSchema.attributes?.code ?? []).filter((attribute) => {
				return !(Array.isArray(attribute) && attribute[0] === 'className');
			})
		],
		div: [...(defaultSchema.attributes?.div ?? []), ['className', 'math', 'math-display']],
		span: [...(defaultSchema.attributes?.span ?? []), ['className', 'math', 'math-inline']]
	}
} satisfies typeof defaultSchema;

const markdown = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkMath)
	.use(remarkRehype)
	.use(rehypeSanitize, sanitizeSchema)
	.use(rehypeKatex, {
		output: 'html',
		trust: false
	})
	.use(rehypeStringify);

function normalizeMathDelimiters(value: string) {
	return value
		.replace(/\$\$([\s\S]*?)\$\$/g, (_match, math: string) => {
			return math.includes('\n') ? `$$${math}$$` : `$$\n${math.trim()}\n$$`;
		})
		.replace(/\$([^\n$]+?)\$/g, (_match, math: string) => {
			return `$${math}$`;
		})
		.replace(/\\\[([\s\S]*?)\\\]/g, (_match, math: string) => {
			return `\n$$\n${math.trim()}\n$$\n`;
		})
		.replace(/\\\(([^\n]*?)\\\)/g, (_match, math: string) => {
			return `$${math}$`;
		});
}

export function renderRichTextMarkdown(value: string) {
	return String(markdown.processSync(normalizeMathDelimiters(value)));
}
