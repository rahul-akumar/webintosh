/**
 * Pure fuzzy matching/ranking used by the Spotlight-style launcher.
 * Case-insensitive subsequence match with scoring (no DOM, no Vue).
 */

/**
 * Score how well `query` matches `text` as a case-insensitive subsequence.
 * Returns `null` when `query` is not a subsequence of `text` (no match).
 * Higher scores are better matches; matched characters that run
 * consecutively or start a word score extra.
 */
export function fuzzyScore(query: string, text: string): number | null {
  if (query.length === 0) return 0

  const q = query.toLowerCase()
  const t = text.toLowerCase()

  let qi = 0
  let score = 0
  let consecutive = 0
  let prevMatchIndex = -1

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] !== q[qi]) continue

    let charScore = 1

    if (prevMatchIndex === ti - 1) {
      consecutive++
      charScore += consecutive * 2
    } else {
      consecutive = 0
    }

    const isWordStart = ti === 0 || !/[a-z0-9]/i.test(t[ti - 1]!)
    if (isWordStart) charScore += 5

    score += charScore
    prevMatchIndex = ti
    qi++
  }

  return qi === q.length ? score : null
}

/**
 * Filter and rank `items` by how well `query` fuzzy-matches the text
 * returned by `getText`. An empty (or whitespace-only) query returns every
 * item, unranked, in its original order. Non-matching items are dropped;
 * matches are sorted best-first, ties preserving original order.
 */
export function fuzzySearch<T>(
  query: string,
  items: readonly T[],
  getText: (item: T) => string
): T[] {
  const trimmed = query.trim()
  if (trimmed.length === 0) return items.slice()

  const scored: Array<{ item: T; score: number }> = []
  for (const item of items) {
    const score = fuzzyScore(trimmed, getText(item))
    if (score !== null) scored.push({ item, score })
  }

  // Array#sort is a stable sort, so equal-score items keep their original
  // (registration) order rather than being shuffled arbitrarily.
  scored.sort((a, b) => b.score - a.score)
  return scored.map((s) => s.item)
}
