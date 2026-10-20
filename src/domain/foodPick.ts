/** Pure helpers for N-food-pick (testable without Dexie). */

export function normalizeFoodName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/** Uniform random pick; empty → null (caller shows tip). */
export function pickRandomFood<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null
  const i = Math.floor(Math.random() * items.length)
  return items[i]!
}
