import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaryFor } from "../i18n";
import {
  DEFAULT_LOCALE,
  LOCALE_QUERY_KEY,
  LOCALE_STORAGE_KEY,
  htmlLang,
  resolveInitialLocale,
  type Locale,
} from "../i18n/locale";
import { LocaleContext } from "./localeContext";

const readStoredLocale = (): string | null => {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    // Private browsing or a full quota must not prevent the app from starting.
    return null;
  }
};

const initialLocale = (): Locale => {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  return resolveInitialLocale({
    search: window.location.search,
    stored: readStoredLocale(),
    languages: window.navigator.languages ?? [window.navigator.language],
  });
};

/**
 * Keeps `?lang=` in the address bar in step with the active locale so a reviewer can
 * copy the URL and land in the same language. `replaceState` is used rather than
 * `pushState` so switching language does not fill the back button with history entries.
 */
const syncQueryParam = (locale: Locale) => {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get(LOCALE_QUERY_KEY) === locale) return;
    url.searchParams.set(LOCALE_QUERY_KEY, locale);
    window.history.replaceState(window.history.state, "", url);
  } catch {
    // A failure here only costs the shareable URL, so the switch still applies.
  }
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const t = useMemo(() => dictionaryFor(locale), [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // The choice still applies for this session even when it cannot be persisted.
    }
    syncQueryParam(next);
  }, []);

  // Document-level metadata is outside the React tree, so it is updated here rather
  // than in a component: <html lang>, the title, and the meta description.
  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
    document.title = t.meta.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t.meta.description);
  }, [locale, t]);

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};
