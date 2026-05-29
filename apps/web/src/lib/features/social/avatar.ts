import { z } from 'zod';

export const AVATAR_STYLE = 'notionists';
export const AVATAR_VERSION = 1;
export const DICEBEAR_NOTIONISTS_BASE_URL = 'https://api.dicebear.com/10.x/notionists/svg';

export const avatarBackgroundColors = [
	'b6e3f4',
	'c0aede',
	'd1d4f9',
	'ffd5dc',
	'ffdfbf',
	'c8e6c9',
	'f8d7a1',
	'f1f5f9'
] as const;

export const avatarHairOptions = [
	'hat',
	'variant01',
	'variant02',
	'variant03',
	'variant04',
	'variant05',
	'variant06',
	'variant07',
	'variant08',
	'variant09',
	'variant10',
	'variant11',
	'variant12'
] as const;

export const avatarEyeOptions = [
	'variant01',
	'variant02',
	'variant03',
	'variant04',
	'variant05'
] as const;

export const avatarBrowOptions = [
	'variant01',
	'variant03',
	'variant05',
	'variant08',
	'variant10',
	'variant13'
] as const;

export const avatarLipOptions = [
	'variant01',
	'variant04',
	'variant08',
	'variant12',
	'variant18',
	'variant24',
	'variant30'
] as const;

export const avatarBeardOptions = [
	'none',
	'variant01',
	'variant04',
	'variant07',
	'variant10'
] as const;

export const avatarGlassesOptions = [
	'none',
	'variant01',
	'variant04',
	'variant07',
	'variant11'
] as const;

export const avatarBodyIconOptions = ['none', 'electric', 'galaxy', 'saturn'] as const;

export const avatarGestureOptions = [
	'none',
	'hand',
	'handPhone',
	'ok',
	'point',
	'waveLongArm'
] as const;

const seedSchema = z
	.string()
	.trim()
	.min(1)
	.max(120)
	.regex(/^[\w .:@+-]+$/u, 'Avatar seed contains unsupported characters.');

export const publicAvatarOptionsSchema = z.object({
	version: z.literal(AVATAR_VERSION),
	style: z.literal(AVATAR_STYLE),
	seed: seedSchema,
	backgroundColor: z.enum(avatarBackgroundColors),
	hair: z.enum(avatarHairOptions),
	eyes: z.enum(avatarEyeOptions),
	brows: z.enum(avatarBrowOptions),
	lips: z.enum(avatarLipOptions),
	beard: z.enum(avatarBeardOptions),
	glasses: z.enum(avatarGlassesOptions),
	bodyIcon: z.enum(avatarBodyIconOptions),
	gesture: z.enum(avatarGestureOptions)
});

export type PublicAvatarOptions = z.infer<typeof publicAvatarOptionsSchema>;
export type PublicAvatarOptionKey = Exclude<keyof PublicAvatarOptions, 'version' | 'style' | 'seed'>;

export const defaultAvatarOptions: PublicAvatarOptions = {
	version: AVATAR_VERSION,
	style: AVATAR_STYLE,
	seed: 'Learner',
	backgroundColor: 'f1f5f9',
	hair: 'variant01',
	eyes: 'variant01',
	brows: 'variant01',
	lips: 'variant01',
	beard: 'none',
	glasses: 'none',
	bodyIcon: 'none',
	gesture: 'none'
};

export function createDefaultAvatarOptions(
	userId: string,
	displayName = 'Learner'
): PublicAvatarOptions {
	const seed = normalizeSeed(`${displayName || 'Learner'} ${userId.slice(0, 8)}`);
	const index = hashString(seed);

	return {
		...defaultAvatarOptions,
		seed,
		backgroundColor: pick(avatarBackgroundColors, index),
		hair: pick(avatarHairOptions, index + 1),
		eyes: pick(avatarEyeOptions, index + 2),
		brows: pick(avatarBrowOptions, index + 3),
		lips: pick(avatarLipOptions, index + 4),
		beard: pick(avatarBeardOptions, index + 5),
		glasses: pick(avatarGlassesOptions, index + 6),
		bodyIcon: pick(avatarBodyIconOptions, index + 7),
		gesture: pick(avatarGestureOptions, index + 8)
	};
}

export function normalizeAvatarOptions(
	value: unknown,
	fallbackSeed = 'Learner'
): PublicAvatarOptions {
	const parsed = publicAvatarOptionsSchema.safeParse(value);
	if (parsed.success) return parsed.data;

	return {
		...defaultAvatarOptions,
		seed: normalizeSeed(fallbackSeed)
	};
}

export function buildNotionistsAvatarUrl(options: PublicAvatarOptions, size = 160): string {
	const normalized = publicAvatarOptionsSchema.parse(options);
	const url = new URL(DICEBEAR_NOTIONISTS_BASE_URL);
	url.searchParams.set('seed', normalized.seed);
	url.searchParams.set('size', String(size));
	url.searchParams.set('backgroundType', 'solid');
	url.searchParams.set('backgroundColor', normalized.backgroundColor);
	url.searchParams.set('hair', normalized.hair);
	url.searchParams.set('eyes', normalized.eyes);
	url.searchParams.set('brows', normalized.brows);
	url.searchParams.set('lips', normalized.lips);

	setOptionalPart(url, 'beard', 'beardProbability', normalized.beard);
	setOptionalPart(url, 'glasses', 'glassesProbability', normalized.glasses);
	setOptionalPart(url, 'bodyIcon', 'bodyIconProbability', normalized.bodyIcon);
	setOptionalPart(url, 'gesture', 'gestureProbability', normalized.gesture);

	return url.toString();
}

function setOptionalPart(
	url: URL,
	partName: string,
	probabilityName: string,
	value: string
) {
	if (value === 'none') {
		url.searchParams.set(probabilityName, '0');
		return;
	}

	url.searchParams.set(partName, value);
	url.searchParams.set(probabilityName, '100');
}

function pick<T>(values: readonly T[], index: number): T {
	return values[Math.abs(index) % values.length];
}

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i += 1) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return hash;
}

function normalizeSeed(value: string): string {
	const normalized = value.replace(/[^\w .:@+-]+/gu, ' ').replace(/\s+/g, ' ').trim();
	return normalized.slice(0, 120) || 'Learner';
}
