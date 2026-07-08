/**
 * Brand image assets for PDF covers. Fetches the YEE logo PNGs once and caches
 * them as data URLs for `doc.addImage`. In a non-browser context (unit tests /
 * SSR) fetch is unavailable or same-origin resolution fails, so this resolves to
 * nulls and the cover falls back to a wordmark text treatment.
 */

const HORIZONTAL_LOGO_SRC = "/brand/logo-horizontal-subtitle-white.png";
const MARK_LOGO_SRC = "/brand/logo-mark-white.png";

export type BrandLogos = {
	/** Horizontal wordmark + subtitle (white), aspect ratio ~1428x530. */
	horizontal: string | null;
	/** Square logo mark (white), 1024x1024 — used as a faint watermark. */
	mark: string | null;
};

let cache: Promise<BrandLogos> | null = null;

async function fetchDataUrl(src: string): Promise<string | null> {
	if (typeof fetch === "undefined" || typeof FileReader === "undefined") return null;
	try {
		const response = await fetch(src);
		if (!response.ok) return null;
		const blob = await response.blob();
		return await new Promise<string | null>(resolve => {
			const reader = new FileReader();
			reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
			reader.onerror = () => resolve(null);
			reader.readAsDataURL(blob);
		});
	} catch {
		return null;
	}
}

/** Load (and memoize) the brand logos as data URLs. Never throws. */
export function getBrandLogos(): Promise<BrandLogos> {
	if (!cache) {
		cache = Promise.all([fetchDataUrl(HORIZONTAL_LOGO_SRC), fetchDataUrl(MARK_LOGO_SRC)]).then(
			([horizontal, mark]) => ({ horizontal, mark })
		);
	}
	return cache;
}

/** Aspect ratios (height / width) of the logo assets, for sizing in the PDF. */
export const LOGO_ASPECT = {
	horizontal: 530 / 1428,
	mark: 1
} as const;
