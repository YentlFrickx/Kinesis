import type { Locale } from './core'
import { NL_COACHING } from './coaching.nl'
import { NL_EXERCISES } from './exercises.nl'

export interface ExerciseText {
  name: string
  instructions: string[]
}

/** Per-locale exercise content keyed by exercise id. English lives on the exercise itself; a missing entry falls back to it. */
export const EXERCISE_TEXT: Partial<Record<Locale, Record<string, ExerciseText>>> = { nl: NL_EXERCISES }

export const COACHING_TEXT: Partial<Record<Locale, Record<string, { cues: string[]; commonMistakes: string[] }>>> = { nl: NL_COACHING }
