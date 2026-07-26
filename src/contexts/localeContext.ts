import { createContext, useContext } from "react";
import { ja, type Dictionary } from "../i18n/ja";
import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";

export interface LocaleContextValue {
  locale: Locale;
  /** The active dictionary. Named `t` so call sites read as `t.cockpit.title`. */
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

/**
 * Default value keeps the app renderable if a subtree is mounted outside the
 * provider (for example in an isolated test) instead of throwing at render time.
 */
export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: ja,
  setLocale: () => {},
});

export const useLocale = (): LocaleContextValue => useContext(LocaleContext);

/** Shorthand for components that only need the dictionary. */
export const useT = (): Dictionary => useContext(LocaleContext).t;
