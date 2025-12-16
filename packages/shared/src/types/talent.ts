/**
 * Talent Types
 * Types and constants for talent categories (musicians, actors, etc.)
 */

export const TALENT_TYPES = {
  MUSICIAN: "musician",
  ACTOR: "actor",
  // Future: voice_actor, dancer, producer, etc.
} as const;

export type TalentType = (typeof TALENT_TYPES)[keyof typeof TALENT_TYPES];

/**
 * Human-readable labels for talent types
 */
export const TALENT_TYPE_LABELS: Record<TalentType, string> = {
  musician: "Musicien",
  actor: "Comédien/Acteur",
};
