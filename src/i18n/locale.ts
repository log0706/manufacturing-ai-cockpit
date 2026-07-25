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

/**
 * Outcome of reading `?lang=` from a query string. The three cases are kept distinct
 * because "no `lang` parameter" and "`lang` parameter with an unsupported value" must
 * resolve differently: the first defers to the stored/browser preference, the second
 * does not.
 */
export type SearchLocale =
  | { kind: "absent" }
  | { kind: "supported"; locale: Locale }
  | { kind: "unsupported"; raw: string };

export const readSearchLocale = (search: string | null | undefined): SearchLocale => {
  if (!search) return { kind: "absent" };

  let raw: string | null = null;
  try {
    raw = new URLSearchParams(search).get(LOCALE_QUERY_KEY);
  } catch {
    return { kind: "absent" };
  }

  if (raw === null) return { kind: "absent" };

  const locale = normalizeLocale(raw);
  return locale ? { kind: "supported", locale } : { kind: "unsupported", raw };
};

/** Convenience wrapper: the locale named by `?lang=`, or null when absent/unsupported. */
export const localeFromSearch = (search: string | null | undefined): Locale | null => {
  const result = readSearchLocale(search);
  return result.kind === "supported" ? result.locale : null;
};

/**
 * Precedence, highest first:
 *
 * 1. `?lang=` in the URL — lets a reviewer share a link that opens in a chosen language.
 * 2. the persisted choice from a previous visit,
 * 3. the browser language list,
 * 4. Japanese.
 *
 * An explicit `?lang=` is authoritative even when its value is unsupported: `?lang=fr`
 * resolves to Japanese rather than falling through to the stored or browser preference.
 * The reasoning is that the URL is a deliberate instruction — silently serving English
 * because the browser happens to be `en-US` would ignore it. An *absent* parameter is
 * not an instruction, so it does defer to the stored choice and then the browser.
 */
export const resolveInitialLocale = (input: LocaleResolutionInput = {}): Locale => {
  const fromUrl = readSearchLocale(input.search);
  if (fromUrl.kind === "supported") return fromUrl.locale;
  if (fromUrl.kind === "unsupported") return DEFAULT_LOCALE;

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
