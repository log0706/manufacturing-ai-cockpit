import { en } from "./en";
import { ja, type Dictionary } from "./ja";
import { DEFAULT_LOCALE, type Locale } from "./locale";

export type { Dictionary } from "./ja";
export * from "./locale";

export const dictionaries: Record<Locale, Dictionary> = { ja, en };

export const dictionaryFor = (locale: Locale): Dictionary =>
  dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
