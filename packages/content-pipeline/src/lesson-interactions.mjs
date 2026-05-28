import { slugify } from './utils.mjs';

export const interactionDirectiveTypes = new Map([
	['concept-check', 'concept_check'],
	['scenario-choice', 'scenario_choice'],
	['mini-practice', 'mini_practice']
]);

export const interactionQuestionCount = {
	concept_check: { min: 1, max: 1 },
	scenario_choice: { min: 1, max: 1 },
	mini_practice: { min: 2, max: 3 }
};

const directivePattern = /^::([a-z][a-z-]*)\{slug="([^"]+)"\}\s*$/;

function flushMarkdownBlock(blocks, lines) {
	const markdown = lines.join('\n').trim();
	if (markdown) {
		blocks.push({ type: 'markdown', markdown });
	}
	lines.length = 0;
}

export function parseLessonDirectiveBlocks(markdown) {
	const blocks = [];
	const directives = [];
	const markdownLines = [];
	const seenSlugs = new Set();
	const lines = String(markdown).split(/\r?\n/);

	for (const [index, line] of lines.entries()) {
		const directiveMatch = line.trim().match(directivePattern);
		if (!directiveMatch) {
			markdownLines.push(line);
			continue;
		}

		const [, directiveName, rawSlug] = directiveMatch;
		const interactionType = interactionDirectiveTypes.get(directiveName);
		if (!interactionType) {
			throw new Error(`Line ${index + 1}: unsupported lesson directive ${directiveName}.`);
		}

		const slug = slugify(rawSlug);
		if (!slug || slug !== rawSlug) {
			throw new Error(`Line ${index + 1}: directive slug must already be stable kebab-case.`);
		}
		if (seenSlugs.has(slug)) {
			throw new Error(`Line ${index + 1}: duplicate lesson interaction slug ${slug}.`);
		}
		seenSlugs.add(slug);

		flushMarkdownBlock(blocks, markdownLines);
		const directive = {
			type: 'interaction',
			slug,
			interaction_type: interactionType
		};
		blocks.push(directive);
		directives.push(directive);
	}

	flushMarkdownBlock(blocks, markdownLines);
	return { blocks, directives };
}

export function validateLessonInteractionSidecar({ lesson, sidecar }) {
	const failures = [];
	const { blocks, directives } = parseLessonDirectiveBlocks(lesson.body_markdown);
	if (directives.length === 0) {
		failures.push('Lesson must include at least one supported interaction directive.');
	}

	const directiveBySlug = new Map(directives.map((directive) => [directive.slug, directive]));
	const interactions = sidecar?.interactions ?? [];
	const interactionBySlug = new Map();

	for (const interaction of interactions) {
		if (interactionBySlug.has(interaction.slug)) {
			failures.push(`Duplicate sidecar interaction slug ${interaction.slug}.`);
			continue;
		}
		interactionBySlug.set(interaction.slug, interaction);

		const directive = directiveBySlug.get(interaction.slug);
		if (!directive) {
			failures.push(`Sidecar interaction ${interaction.slug} is not referenced by the lesson.`);
			continue;
		}
		if (interaction.type !== directive.interaction_type) {
			failures.push(
				`Interaction ${interaction.slug} type ${interaction.type} does not match directive ${directive.interaction_type}.`
			);
		}

		const rule = interactionQuestionCount[interaction.type];
		const questionCount = interaction.questions?.length ?? 0;
		if (!rule) {
			failures.push(`Unsupported sidecar interaction type ${interaction.type}.`);
		} else if (questionCount < rule.min || questionCount > rule.max) {
			failures.push(
				`Interaction ${interaction.slug} requires ${rule.min === rule.max ? rule.min : `${rule.min}-${rule.max}`} questions, received ${questionCount}.`
			);
		}
	}

	for (const directive of directives) {
		if (!interactionBySlug.has(directive.slug)) {
			failures.push(`Lesson directive ${directive.slug} has no matching sidecar interaction.`);
		}
	}

	if (failures.length > 0) {
		return { success: false, error: failures.join('\n') };
	}

	return {
		success: true,
		data: {
			...lesson,
			render_blocks: blocks,
			interactions
		}
	};
}
