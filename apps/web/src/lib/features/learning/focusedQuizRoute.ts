const focusedQuizRouteIdPattern = /^\/app\/topics\/\[topic\]\/(?:quiz(?:\/.*)?|review|diagnostic)$/;
const focusedQuizPathPattern = /^\/app\/topics\/[^/]+\/(?:quiz(?:\/.*)?|review|diagnostic)$/;
const lastNonFocusedHrefKey = 'learn-anything:last-non-focused-href';

type ResolveFocusedQuizExitHrefParams = {
	exitHref: string;
	rememberedHref?: string | null;
	referrer?: string | null;
	origin: string;
};

export function isFocusedQuizRouteId(routeId: string | null | undefined) {
	return Boolean(routeId?.match(focusedQuizRouteIdPattern));
}

export function isFocusedQuizPathname(pathname: string) {
	return focusedQuizPathPattern.test(pathname);
}

function getNonFocusedHref(href: string | null | undefined, origin: string) {
	if (!href) {
		return null;
	}

	try {
		const url = new URL(href, origin);
		if (url.origin !== origin || isFocusedQuizPathname(url.pathname)) {
			return null;
		}

		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return null;
	}
}

export function rememberNonFocusedHref(url: URL, routeId: string | null | undefined) {
	if (typeof sessionStorage === 'undefined' || isFocusedQuizRouteId(routeId)) {
		return;
	}

	sessionStorage.setItem(lastNonFocusedHrefKey, `${url.pathname}${url.search}${url.hash}`);
}

export function getRememberedNonFocusedHref() {
	if (typeof sessionStorage === 'undefined') {
		return null;
	}

	const href = sessionStorage.getItem(lastNonFocusedHrefKey);
	if (!href) {
		return null;
	}

	return getNonFocusedHref(href, window.location.origin);
}

export function resolveFocusedQuizExitHref({
	exitHref,
	rememberedHref,
	referrer,
	origin
}: ResolveFocusedQuizExitHrefParams) {
	return (
		getNonFocusedHref(rememberedHref, origin) ?? getNonFocusedHref(referrer, origin) ?? exitHref
	);
}
