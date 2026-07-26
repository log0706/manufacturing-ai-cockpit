import { concepts } from "../../data/concepts";
import { decisionAuthority } from "../../data/decisionAuthority";
import { expertDialogues } from "../../data/expertDialogues";
import { explainDrills } from "../../data/explainDrills";
import { glossaryFrictions } from "../../data/glossaryFrictions";
import { scenarios } from "../../data/scenarios";
import type {
  Concept,
  DecisionAuthority,
  ExpertDialogueCard,
  ExplainDrill,
  FrictionWord,
  Scenario,
} from "../../types";
import type { Locale } from "../locale";
import { conceptsEn } from "./conceptsEn";
import { authorityEn, dialoguesEn, drillsEn, frictionsEn, scenariosEn } from "./datasetsEn";

/**
 * Resolvers that merge the id-keyed English overlays onto the Japanese source records.
 *
 * Two rules hold throughout:
 *
 * 1. `ja` returns the source records untouched — the Japanese experience cannot regress.
 * 2. An overlay is applied per record, so a dataset can never end up half-translated
 *    silently: `contentCoverage` reports exactly how many records have an overlay, and
 *    `scripts/auditI18nCoverage.ts` fails the build if a dataset expected to be complete
 *    is not.
 */

const localizeConcept = (concept: Concept): Concept => {
  const overlay = conceptsEn[concept.id];
  if (!overlay) return concept;

  const { title, oneLine, aiTouchpoint, caution } = overlay;

  return {
    ...concept,
    title,
    oneLine,
    departments: overlay.departments,
    kpis: overlay.kpis,
    aiTouchpoint,
    caution,
    // The Japanese data derives these three from templates rather than authoring them,
    // so the English side applies equivalent templates instead of duplicating them.
    whyImportant: `Understanding ${title} makes it easier to separate which data AI looks at and what needs explaining to which accountable owner.`,
    thirtySecond: `${title} — ${oneLine} This is where AI helps: ${lowerFirst(aiTouchpoint)} One caveat: ${lowerFirst(caution)}`,
    miniQuestion: {
      prompt: `When you explain ${title}, what is the first caveat to confirm?`,
      answer: caution,
    },
    // Optional enrichment fields are only overwritten when the overlay supplies them,
    // so an untranslated diagram is dropped rather than shown in the wrong language.
    juniorSummary: overlay.juniorSummary,
    conceptDiagram: overlay.conceptDiagram,
    usageScene: overlay.usageScene,
    exampleScene: overlay.exampleScene,
    aiConnection: overlay.aiConnection,
  };
};

/** Lower-cases the first character so a sentence can be spliced mid-clause. */
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const localizeScenario = (scenario: Scenario): Scenario => {
  const overlay = scenariosEn[scenario.id];
  return overlay ? { ...scenario, ...overlay } : scenario;
};

const localizeFriction = (friction: FrictionWord): FrictionWord => {
  const overlay = frictionsEn[friction.id];
  return overlay ? { ...friction, ...overlay } : friction;
};

const localizeDialogue = (dialogue: ExpertDialogueCard): ExpertDialogueCard => {
  const overlay = dialoguesEn[dialogue.id];
  return overlay ? { ...dialogue, ...overlay } : dialogue;
};

const localizeAuthority = (authority: DecisionAuthority): DecisionAuthority => {
  const overlay = authorityEn[authority.id];
  return overlay ? { ...authority, ...overlay } : authority;
};

const localizeDrill = (drill: ExplainDrill): ExplainDrill => {
  const overlay = drillsEn[drill.id];
  return overlay ? { ...drill, ...overlay } : drill;
};

// Localised collections are built once per locale rather than per render.
const byLocale = <T,>(source: T[], localize: (item: T) => T): Record<Locale, T[]> => ({
  ja: source,
  en: source.map(localize),
});

export const localizedConcepts = byLocale(concepts, localizeConcept);
export const localizedScenarios = byLocale(scenarios, localizeScenario);
export const localizedFrictions = byLocale(glossaryFrictions, localizeFriction);
export const localizedDialogues = byLocale(expertDialogues, localizeDialogue);
export const localizedAuthority = byLocale(decisionAuthority, localizeAuthority);
export const localizedDrills = byLocale(explainDrills, localizeDrill);

const indexById = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

export const localizedConceptById: Record<Locale, Record<string, Concept>> = {
  ja: indexById(localizedConcepts.ja),
  en: indexById(localizedConcepts.en),
};

export const localizedDrillById: Record<Locale, Record<string, ExplainDrill>> = {
  ja: indexById(localizedDrills.ja),
  en: indexById(localizedDrills.en),
};

/**
 * Machine-verifiable translation coverage, consumed by `scripts/auditI18nCoverage.ts`.
 * `expectComplete` marks datasets that must be at 100% for the English locale to be
 * considered usable; the question banks are deliberately absent from this list and are
 * reported separately in the audit output.
 */
export const contentCoverage = [
  { dataset: "concepts", total: concepts.length, translated: countOverlay(concepts, conceptsEn), expectComplete: true },
  { dataset: "scenarios", total: scenarios.length, translated: countOverlay(scenarios, scenariosEn), expectComplete: true },
  { dataset: "glossaryFrictions", total: glossaryFrictions.length, translated: countOverlay(glossaryFrictions, frictionsEn), expectComplete: true },
  { dataset: "expertDialogues", total: expertDialogues.length, translated: countOverlay(expertDialogues, dialoguesEn), expectComplete: true },
  { dataset: "decisionAuthority", total: decisionAuthority.length, translated: countOverlay(decisionAuthority, authorityEn), expectComplete: true },
  { dataset: "explainDrills", total: explainDrills.length, translated: countOverlay(explainDrills, drillsEn), expectComplete: true },
];

function countOverlay<T extends { id: string }>(source: T[], overlay: Record<string, unknown>) {
  return source.filter((item) => overlay[item.id] !== undefined).length;
}
