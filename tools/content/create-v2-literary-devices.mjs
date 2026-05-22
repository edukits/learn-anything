#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const runId = 'run_2026_05_22_english_literary_devices_v2';
const outDir = resolve('curriculum-artifacts/runs', runId);
const sourceRefs = [{ source_id: 'source_english_literary_devices_notes_v2' }];

const devices = [
	['metaphor', 'Metaphor', 'Identify and explain direct comparisons that do not use like or as.'],
	['simile', 'Simile', 'Identify comparisons that use like or as to connect two unlike things.'],
	['personification', 'Personification', 'Recognize moments when human actions or traits are given to nonhuman things.'],
	['imagery', 'Imagery', 'Notice sensory details that help readers picture, hear, smell, taste, or feel a scene.'],
	['alliteration', 'Alliteration', 'Recognize repeated initial consonant sounds close together.'],
	['hyperbole', 'Hyperbole', 'Identify deliberate exaggeration used for emphasis.'],
	['irony', 'Irony', 'Recognize contrast between expectation and reality or between literal words and intended meaning.'],
	['symbolism', 'Symbolism', 'Explain how an object, image, color, or action represents a larger idea.'],
	['foreshadowing', 'Foreshadowing', 'Identify hints that suggest what may happen later.'],
	['onomatopoeia', 'Onomatopoeia', 'Recognize words that imitate sounds.']
];

const examples = {
	metaphor: 'The final exam was a locked gate at the end of the hallway.',
	simile: 'The rumor moved through the cafeteria like spilled ink.',
	personification: 'The old floorboards groaned under each careful step.',
	imagery: 'Rain tapped the tin roof while the room smelled of wet wool and chalk.',
	alliteration: 'Silver stars shimmered softly above the silent street.',
	hyperbole: 'I have carried this backpack for a million miles.',
	irony: 'The fire station burned down during the safety parade.',
	symbolism: 'The cracked compass in his pocket stood for his lost sense of direction.',
	foreshadowing: 'Before leaving, Maya noticed the boat rope had begun to fray.',
	onomatopoeia: 'The keys clinked, the door clicked, and the hallway went still.'
};

function jsonl(rows) {
	return `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
}

function skillId(device) {
	return `skill_${device}`;
}

function choice(id, label) {
	return { id, label };
}

function question(id, device, question_type, difficulty, prompt, choices, correct_choice_id, explanation) {
	return {
		id,
		version: 1,
		topic_area_id: 'topic_literary_devices',
		skill_id: skillId(device),
		device,
		question_type,
		difficulty,
		prompt,
		choices,
		correct_choice_id,
		explanation,
		content_run_id: runId,
		schema_version: 1,
		source_refs: sourceRefs
	};
}

const recognitionPrompts = devices.flatMap(([device, name], index) => [
	question(
		`question_lit_devices_v2_recognize_${device}_1`,
		device,
		'recognition',
		index % 3 === 0 ? 'easy' : 'medium',
		`Which literary device is used in this sentence?\n\n_${examples[device]}_`,
		[
			choice(device, name),
			choice(devices[(index + 1) % devices.length][0], devices[(index + 1) % devices.length][1]),
			choice(devices[(index + 3) % devices.length][0], devices[(index + 3) % devices.length][1]),
			choice(devices[(index + 5) % devices.length][0], devices[(index + 5) % devices.length][1])
		],
		device,
		`The sentence is an example of ${name.toLowerCase()} because it matches the device's defining move.`
	),
	question(
		`question_lit_devices_v2_recognize_${device}_2`,
		device,
		'recognition',
		'medium',
		`A student says the example mainly shows **${name.toLowerCase()}**. What is the best reason?\n\n_${examples[device]}_`,
		[
			choice('definition', `It uses the defining pattern of ${name.toLowerCase()}.`),
			choice('rhyme', 'It depends on end rhyme.'),
			choice('setting', 'It only names the setting.'),
			choice('dialogue', 'It mainly reveals a speaker through dialogue.')
		],
		'definition',
		`The strongest explanation connects the example to the defining pattern of ${name.toLowerCase()}.`
	)
]);

function hallwayRevisionChoices(device) {
	const correctByDevice = {
		metaphor: 'The hallway was a sleeping tunnel.',
		simile: 'The hallway was as quiet as a sealed jar.',
		personification: 'The hallway held its breath.',
		imagery: 'Cold light spilled across the silent blue lockers.',
		alliteration: 'Silent shadows stretched across the still hallway.',
		hyperbole: 'The hallway was so quiet I could hear the dust land.',
		irony: 'The hallway marked "Quiet Zone" echoed with a crashing locker.',
		symbolism: 'The empty hallway became a symbol of everything she had left behind.',
		foreshadowing: 'The hallway was quiet except for the faint crack spreading across the ceiling.',
		onomatopoeia: 'Click, clack, click went her shoes through the quiet hallway.'
	};

	return [
		choice('a', correctByDevice[device]),
		choice('b', 'The hallway had lockers.'),
		choice('c', 'The hallway was long.'),
		choice('d', 'The hallway was outside the gym.')
	];
}

const applicationPrompts = devices.flatMap(([device, name], index) => [
	question(
		`question_lit_devices_v2_apply_${device}_1`,
		device,
		'application',
		index % 2 === 0 ? 'medium' : 'hard',
		`Which revision best adds **${name.toLowerCase()}** to this plain sentence?\n\n_The hallway was quiet._`,
		hallwayRevisionChoices(device),
		'a',
		`The correct revision deliberately adds ${name.toLowerCase()} rather than only adding neutral detail.`
	),
	question(
		`question_lit_devices_v2_apply_${device}_2`,
		device,
		'application',
		'medium',
		`Which sentence most clearly uses **${name.toLowerCase()}**?`,
		applicationChoices(device),
		applicationCorrectChoice(device),
		`The correct choice uses ${name.toLowerCase()} in a way that changes how the reader experiences the moment.`
	)
]);

function applicationChoices(device) {
	const byDevice = {
		metaphor: [
			choice('a', 'Her apology was a thin sheet of ice.'),
			choice('b', 'Her apology was like a note.'),
			choice('c', 'Her apology arrived after lunch.'),
			choice('d', 'Her apology sounded polite.')
		],
		simile: [
			choice('a', 'The moon was a coin.'),
			choice('b', 'The moon hung like a coin above the trees.'),
			choice('c', 'The moon rose at nine.'),
			choice('d', 'The moon disappeared.')
		],
		personification: [
			choice('a', 'The calendar warned us with its empty squares.'),
			choice('b', 'The calendar was paper.'),
			choice('c', 'The calendar showed June.'),
			choice('d', 'The calendar hung by the desk.')
		],
		imagery: [
			choice('a', 'The kitchen smelled of cinnamon, smoke, and oranges.'),
			choice('b', 'The kitchen was important.'),
			choice('c', 'The kitchen was in the house.'),
			choice('d', 'The kitchen was useful.')
		],
		alliteration: [
			choice('a', 'Bright birds balanced beyond the bridge.'),
			choice('b', 'Birds flew over the bridge.'),
			choice('c', 'The bridge crossed water.'),
			choice('d', 'Many birds were nearby.')
		],
		hyperbole: [
			choice('a', 'I waited for centuries at the bus stop.'),
			choice('b', 'I waited twelve minutes at the bus stop.'),
			choice('c', 'I waited beside a bench.'),
			choice('d', 'I waited because I was early.')
		],
		irony: [
			choice('a', 'The waterproof tent leaked first.'),
			choice('b', 'The tent was green.'),
			choice('c', 'The tent stood near the trail.'),
			choice('d', 'The tent had two doors.')
		],
		symbolism: [
			choice('a', 'The locked gate represented the town refusing to change.'),
			choice('b', 'The gate was made of iron.'),
			choice('c', 'The gate opened at sunrise.'),
			choice('d', 'The gate needed paint.')
		],
		foreshadowing: [
			choice('a', 'The first crack in the dam appeared before the storm began.'),
			choice('b', 'The dam was tall.'),
			choice('c', 'The dam was built in 1952.'),
			choice('d', 'The dam held water.')
		],
		onomatopoeia: [
			choice('a', 'The bacon sizzled and popped in the pan.'),
			choice('b', 'The bacon cooked quickly.'),
			choice('c', 'The bacon was salty.'),
			choice('d', 'The bacon was ready.')
		]
	};
	return byDevice[device];
}

function applicationCorrectChoice(device) {
	return device === 'simile' ? 'b' : 'a';
}

const mixedPrompts = devices.map(([device, name], index) =>
	question(
		`question_lit_devices_v2_mixed_${device}_1`,
		device,
		index % 2 === 0 ? 'recognition' : 'application',
		index % 3 === 0 ? 'hard' : 'medium',
		`In a paragraph about a character facing change, why might a writer use **${name.toLowerCase()}**?`,
		[
			choice('purpose', `To make the idea more vivid through ${name.toLowerCase()}.`),
			choice('grammar', 'To correct the grammar of the sentence.'),
			choice('citation', 'To add a source citation.'),
			choice('format', 'To change the page layout.')
		],
		'purpose',
		`${name} is a meaning-making choice, not a formatting or citation tool.`
	)
);

const extraMixed = [
	question(
		'question_lit_devices_v2_mixed_compare_1',
		'metaphor',
		'application',
		'hard',
		'Which explanation best distinguishes metaphor from simile?',
		[
			choice('a', 'A metaphor states the comparison directly; a simile signals it with like or as.'),
			choice('b', 'A metaphor must rhyme; a simile never compares.'),
			choice('c', 'A metaphor is always literal; a simile is always ironic.'),
			choice('d', 'A metaphor uses sound words; a simile uses symbols.')
		],
		'a',
		'Metaphor and simile both compare, but they signal the comparison differently.'
	),
	question(
		'question_lit_devices_v2_mixed_sound_1',
		'alliteration',
		'application',
		'medium',
		'Which pair of devices is most connected to sound?',
		[
			choice('a', 'Alliteration and onomatopoeia'),
			choice('b', 'Symbolism and foreshadowing'),
			choice('c', 'Irony and imagery'),
			choice('d', 'Metaphor and hyperbole')
		],
		'a',
		'Alliteration repeats initial sounds, and onomatopoeia imitates sounds.'
	),
	question(
		'question_lit_devices_v2_mixed_hint_1',
		'foreshadowing',
		'application',
		'medium',
		'Which detail most clearly foreshadows trouble?',
		[
			choice('a', 'A character notices smoke under a closed laboratory door.'),
			choice('b', 'A character eats breakfast.'),
			choice('c', 'A character ties a shoe.'),
			choice('d', 'A character reads the date.')
		],
		'a',
		'Smoke under a closed door hints at a likely problem before it fully appears.'
	),
	question(
		'question_lit_devices_v2_mixed_meaning_1',
		'symbolism',
		'application',
		'hard',
		'Which question helps identify symbolism?',
		[
			choice('a', 'Does this object stand for a larger idea beyond itself?'),
			choice('b', 'Does this word imitate a sound?'),
			choice('c', 'Does this sentence use like or as?'),
			choice('d', 'Does this detail exaggerate a number?')
		],
		'a',
		'Symbolism asks readers to connect a concrete object or action with a larger idea.'
	),
	question(
		'question_lit_devices_v2_mixed_strategy_1',
		'imagery',
		'application',
		'medium',
		'When a question asks how language affects the reader, what should you do first?',
		[
			choice('a', 'Identify the device and explain the effect of the specific words.'),
			choice('b', 'Ignore the passage and choose the longest answer.'),
			choice('c', 'Only name the author.'),
			choice('d', 'Count every comma.')
		],
		'a',
		'Strong analysis names the device and connects exact language to reader effect.'
	)
];

const questions = [...recognitionPrompts.slice(0, 15), ...applicationPrompts.slice(0, 15), ...mixedPrompts, ...extraMixed];

const quizIds = [
	'quiz_lit_devices_recognition_practice',
	'quiz_lit_devices_application_practice',
	'quiz_lit_devices_mixed_review'
];

const lessons = [
	{
		id: 'lesson_lit_devices_intro',
		version: 2,
		topic_area_id: 'topic_literary_devices',
		slug: 'literary-devices-intro',
		title: 'Intro to Literary Devices',
		summary: 'Learn the core purpose of literary devices and recognize the first ten devices in context.',
		body_markdown: '# Intro to Literary Devices\n\nWriters use literary devices to make meaning stick. A device can sharpen an image, create a sound pattern, hint at what is coming, or make a simple sentence carry a bigger idea.\n\n## How to read for devices\n\nStart with what the words are doing. Are they comparing, exaggerating, hinting, making a sound, or pointing to a larger idea? Then name the device and explain the effect.\n\n## Devices in this path\n\nMetaphor, simile, personification, imagery, alliteration, hyperbole, irony, symbolism, foreshadowing, and onomatopoeia.',
		skill_ids: devices.map(([device]) => skillId(device)),
		estimated_minutes: 4,
		sort_order: 1
	},
	{
		id: 'lesson_lit_devices_application',
		version: 1,
		topic_area_id: 'topic_literary_devices',
		slug: 'literary-devices-application',
		title: 'Applying Devices in Context',
		summary: 'Practice choosing devices that match a writer’s purpose and improve plain sentences.',
		body_markdown: '# Applying Devices in Context\n\nRecognizing a device is only the first step. Strong readers also explain why a writer chose it.\n\n## Match device to purpose\n\nUse metaphor or simile to build comparison. Use imagery to make a moment sensory. Use symbolism when an object needs to carry an idea. Use foreshadowing when a detail should prepare readers for what comes next.\n\n## A useful sentence frame\n\n_The writer uses [device] in “[words]” to [effect]._ This keeps your answer tied to the text.',
		skill_ids: devices.map(([device]) => skillId(device)),
		estimated_minutes: 5,
		sort_order: 2
	},
	{
		id: 'lesson_lit_devices_synthesis',
		version: 1,
		topic_area_id: 'topic_literary_devices',
		slug: 'literary-devices-synthesis',
		title: 'Combining Evidence and Effect',
		summary: 'Learn how to compare similar devices and explain their effect in a short analysis.',
		body_markdown: '# Combining Evidence and Effect\n\nSome devices overlap. Metaphor and simile both compare. Alliteration and onomatopoeia both involve sound. Symbolism and foreshadowing can both make a detail feel important.\n\n## Explain the difference\n\nLook for the signal. Like or as usually points to simile. Sound imitation points to onomatopoeia. A future hint points to foreshadowing. A concrete object carrying a larger idea points to symbolism.\n\n## Build a complete response\n\nName the device, quote the key words, and explain how those words shape meaning or mood.',
		skill_ids: devices.map(([device]) => skillId(device)),
		estimated_minutes: 5,
		sort_order: 3
	}
].map((lesson) => ({
	...lesson,
	content_run_id: runId,
	schema_version: 1,
	source_refs: sourceRefs
}));

const quizzes = [
	{
		id: quizIds[0],
		version: 1,
		topic_area_id: 'topic_literary_devices',
		slug: 'literary-devices-recognition-practice',
		title: 'Recognition Practice',
		description: 'Identify literary devices from short examples.',
		kind: 'practice',
		question_count: 15
	},
	{
		id: quizIds[1],
		version: 1,
		topic_area_id: 'topic_literary_devices',
		slug: 'literary-devices-application-practice',
		title: 'Application Practice',
		description: 'Choose revisions and explanations that use devices with purpose.',
		kind: 'practice',
		question_count: 15
	},
	{
		id: quizIds[2],
		version: 1,
		topic_area_id: 'topic_literary_devices',
		slug: 'literary-devices-mixed-review',
		title: 'Mixed Review Quiz',
		description: 'Synthesize recognition and application across all ten devices.',
		kind: 'assessment',
		question_count: 15
	}
].map((quiz) => ({
	...quiz,
	content_run_id: runId,
	schema_version: 1,
	source_refs: sourceRefs
}));

const links = quizIds.flatMap((quizId, quizIndex) =>
	questions.slice(quizIndex * 15, quizIndex * 15 + 15).map((item, index) => ({
		quiz_id: quizId,
		quiz_version: 1,
		question_id: item.id,
		question_version: 1,
		ordering: index + 1,
		weight: 1
	}))
);

const pathItems = [
	['lesson', lessons[0].id, lessons[0].version],
	['quiz', quizIds[0], 1],
	['lesson', lessons[1].id, 1],
	['quiz', quizIds[1], 1],
	['lesson', lessons[2].id, 1],
	['quiz', quizIds[2], 1]
].map(([item_type, item_id, item_version], index) => ({
	item_type,
	item_id,
	item_version,
	ordering: index + 1,
	required: true
}));

const releaseItems = [
	{ content_type: 'subject_area', content_id: 'subject_english', content_version: 1 },
	{ content_type: 'topic_area', content_id: 'topic_literary_devices', content_version: 1 },
	...devices.map(([device]) => ({ content_type: 'skill', content_id: skillId(device), content_version: 1 })),
	...lessons.map((lesson) => ({ content_type: 'lesson', content_id: lesson.id, content_version: lesson.version })),
	...quizzes.map((quiz) => ({ content_type: 'quiz', content_id: quiz.id, content_version: quiz.version })),
	...questions.map((item) => ({ content_type: 'quiz_question', content_id: item.id, content_version: item.version })),
	{ content_type: 'learning_path', content_id: 'path_literary_devices_v2', content_version: 1 }
];

const files = {
	'manifest.json': JSON.stringify(
		{
			run_id: runId,
			title: 'English Literary Devices v2',
			schema_version: 1,
			authoring_mode: 'hand-authored',
			subject_area_id: 'subject_english',
			topic_area_id: 'topic_literary_devices',
			source_refs: [{ ...sourceRefs[0], path: 'content-sources/english/literary-devices/source.md' }],
			artifacts: {
				subject_areas: 'subject-areas.jsonl',
				topic_areas: 'topic-areas.jsonl',
				skills: 'skills.jsonl',
				lessons: 'lessons.jsonl',
				quizzes: 'quizzes.jsonl',
				questions: 'questions.jsonl',
				quiz_question_links: 'quiz-question-links.jsonl',
				learning_paths: 'learning-paths.jsonl',
				releases: 'releases.jsonl',
				topic_discovery_metadata: 'topic-discovery-metadata.jsonl'
			},
			schemas: {
				subject_areas: '../../../../content-schemas/v1/subject-area.schema.json',
				topic_areas: '../../../../content-schemas/v1/topic-area.schema.json',
				skills: '../../../../content-schemas/v1/skill.schema.json',
				lessons: '../../../../content-schemas/v1/lesson.schema.json',
				quizzes: '../../../../content-schemas/v1/quiz.schema.json',
				questions: '../../../../content-schemas/v1/quiz-question.schema.json',
				quiz_question_links: '../../../../content-schemas/v1/quiz-question-link.schema.json',
				learning_paths: '../../../../content-schemas/v1/learning-path.schema.json',
				releases: '../../../../content-schemas/v1/release.schema.json',
				topic_discovery_metadata: '../../../../content-schemas/v1/topic-discovery-metadata.schema.json'
			}
		},
		null,
		'\t'
	),
	'subject-areas.jsonl': jsonl([
		{
			id: 'subject_english',
			version: 1,
			slug: 'english',
			name: 'English',
			summary: 'Reading, writing, and language analysis.',
			content_run_id: runId,
			schema_version: 1,
			source_refs: sourceRefs
		}
	]),
	'topic-areas.jsonl': jsonl([
		{
			id: 'topic_literary_devices',
			version: 1,
			subject_area_id: 'subject_english',
			slug: 'literary-devices',
			name: 'Literary Devices',
			summary: 'Recognize, apply, and explain common literary devices.',
			content_run_id: runId,
			schema_version: 1,
			source_refs: sourceRefs
		}
	]),
	'skills.jsonl': jsonl(
		devices.map(([device, name, summary]) => ({
			id: skillId(device),
			version: 1,
			topic_area_id: 'topic_literary_devices',
			slug: device,
			name,
			device,
			summary,
			content_run_id: runId,
			schema_version: 1,
			source_refs: sourceRefs
		}))
	),
	'lessons.jsonl': jsonl(lessons),
	'quizzes.jsonl': jsonl(quizzes),
	'questions.jsonl': jsonl(questions),
	'quiz-question-links.jsonl': jsonl(links),
	'learning-paths.jsonl': jsonl([
		{
			id: 'path_literary_devices_v2',
			version: 1,
			topic_area_id: 'topic_literary_devices',
			slug: 'literary-devices-v2',
			title: 'Literary Devices Path',
			summary: 'Move from recognition to application and mixed review across ten literary devices.',
			items: pathItems,
			content_run_id: runId,
			schema_version: 1,
			source_refs: sourceRefs
		}
	]),
	'releases.jsonl': jsonl([
		{
			id: 'release_english_literary_devices_v2',
			slug: 'english-literary-devices-v2',
			title: 'English Literary Devices v2',
			scope_type: 'topic_area',
			scope_id: 'topic_literary_devices',
			status: 'published',
			published_at: '2026-05-22T00:00:00.000Z',
			content_run_id: runId,
			bundle_key: 'english/literary-devices/v2',
			items: releaseItems,
			manifest: {
				release_notes: {
					added: ['Application lesson', 'Synthesis lesson', 'Recognition quiz', 'Application quiz', 'Mixed review quiz', '30 additional reusable questions'],
					revised: ['Intro lesson expanded for v2 path sequencing'],
					retired: ['v1 single mixed-practice quiz from current practice selection']
				}
			}
		}
	]),
	'topic-discovery-metadata.jsonl': jsonl([
		{
			topic_area_id: 'topic_literary_devices',
			release_id: 'release_english_literary_devices_v2',
			slug: 'literary-devices',
			name: 'Literary Devices',
			public_summary: 'Learn ten common literary devices through a high-school English path with three lessons, three quizzes, and adaptive progress.',
			preview_markdown: 'Writers use literary devices to make meaning stick. This path moves from recognizing devices to applying them in context and explaining how language shapes readers.',
			app_path: '/app/literary-devices',
			level_label: 'High school English',
			estimated_minutes: 32,
			lesson_count: 3,
			quiz_count: 3,
			covered_skill_ids: devices.map(([device]) => skillId(device)),
			covered_devices: devices.map(([, name]) => name)
		}
	])
};

await mkdir(outDir, { recursive: true });
for (const [file, contents] of Object.entries(files)) {
	await mkdir(dirname(resolve(outDir, file)), { recursive: true });
	await writeFile(resolve(outDir, file), file.endsWith('.json') ? `${contents}\n` : contents);
}

console.log(`Wrote ${outDir}`);
