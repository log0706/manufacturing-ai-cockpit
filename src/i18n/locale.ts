/**
 * Locale resolution. Deliberately dependency-free and side-effect-free so the
 * precedence rules can be unit tested in Node without a DOM
 * (see `scripts/testLocale.ts`).
 */

export const locales = ["ja", "en"] as const;

export type Locale = (typeof locales)[number];

/** Unknown or unsupported locale values fall back to Japanese. */
export const DEFAULT_LOCALE: Locale = "ja";

export const LOCALE_STORAGE_KEY = "manufacturing-ai-cockpit-locale-v1";

/** Query parameter that overrides every stored or browser preference. */
export const LOCALE_QUERY_KEY = "lang";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/**
 * Accepts a raw value from a URL, localStorage, or `navigator.language` and
 * returns a supported locale, or `null` when the value carries no usable signal.
 *
 * Region subtags are honoured (`en-US` -> `en`, `ja-JP` -> `ja`) so browser
 * language lists resolve the way users expect.
 */
export const normalizeLocale = (value: string | null | undefined): Locale | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (isLocale(trimmed)) return trimmed;
  const base = trimmed.split(/[-_]/)[0];
  return isLocale(base) ? base : null;
};

export interface LocaleResolutionInput {
  /** `window.location.search`, e.g. `"?lang=en"`. */
  search?: string | null;
  /** Previously persisted choice, e.g. `localStorage.getItem(LOCALE_STORAGE_KEY)`. */
  stored?: string | null;
  /** Browser preference list, e.g. `navigator.languages`. */
  languages?: readonly string[] | null;
}

export const localeFromSearch = (search: string | null | undefined): Locale | null => {
  if (!search) return null;
  try {
    return normalizeLocale(new URLSearchParams(search).get(LOCALE_QUERY_KEY));
  } catch {
    return null;
  }
};

/**
 * Precedence, highest first:
 *
 * 1. `?lang=` in the URL — lets a reviewer share a link that opens in a chosen language.
 * 2. the persisted choice from a previous visit,
 * 3. the browser language list,
 * 4. Japanese.
 *
 * An unrecognised value at any level is ignored rather than treated as an error, so
 * `?lang=fr` falls through to the stored choice and ultimately to Japanese.
 */
export const resolveInitialLocale = (input: LocaleResolutionInput = {}): Locale => {
  const fromUrl = localeFromSearch(input.search);
  if (fromUrl) return fromUrl;

  const fromStorage = normalizeLocale(input.stored);
  if (fromStorage) return fromStorage;

  for (const language of input.languages ?? []) {
    const fromBrowser = normalizeLocale(language);
    if (fromBrowser) return fromBrowser;
  }

  return DEFAULT_LOCALE;
};

/** `lang` attribute value for `<html>`. */
export const htmlLang = (locale: Locale): string => (locale === "ja" ? "ja" : "en");
