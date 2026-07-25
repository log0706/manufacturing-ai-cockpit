import { useRef, type KeyboardEvent } from "react";
import { useLocale } from "../contexts/localeContext";
import { locales, type Locale } from "../i18n/locale";

/**
 * ja/en switch built as a WAI-ARIA radio group with a roving tabindex: one Tab stop for
 * the group, arrow keys to move between options, Enter/Space to select.
 *
 * The option labels stay in their own language ("日本語" / "English") in both locales.
 * That is the one intentional exception to the no-mixed-language rule — a language
 * switch has to be readable by someone who cannot read the current language.
 */
export const LanguageSwitcher = ({ className = "" }: { className?: string }) => {
  const { locale, setLocale, t } = useLocale();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (direction: 1 | -1) => {
    const index = locales.indexOf(locale);
    const next = locales[(index + direction + locales.length) % locales.length];
    setLocale(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      default:
        break;
    }
  };

  const optionLabel: Record<Locale, string> = { ja: t.language.ja, en: t.language.en };
  const optionAria: Record<Locale, string> = { ja: t.language.ariaJa, en: t.language.ariaEn };

  return (
    <div className={`languageSwitcher ${className}`.trim()}>
      <span className="languageSwitcherLabel" id="language-switcher-label">
        {t.language.switcherLabel}
      </span>
      <div
        className="languageSwitcherOptions"
        role="radiogroup"
        aria-labelledby="language-switcher-label"
        onKeyDown={onKeyDown}
      >
        {locales.map((option) => {
          const selected = option === locale;
          return (
            <button
              key={option}
              ref={(node) => {
                refs.current[option] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={optionAria[option]}
              tabIndex={selected ? 0 : -1}
              lang={option}
              className={`languageOption ${selected ? "isActive" : ""}`}
              onClick={() => setLocale(option)}
            >
              {optionLabel[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
