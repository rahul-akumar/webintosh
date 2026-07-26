import { describe, it, expect } from 'vitest'
import { fuzzyScore, fuzzySearch } from '../../../app/utils/fuzzy'

describe('utils/fuzzy - fuzzyScore', () => {
  it('matches a subsequence and returns a positive score', () => {
    expect(fuzzyScore('ks', 'KeyStation')).not.toBeNull()
    expect(fuzzyScore('ks', 'KeyStation')!).toBeGreaterThan(0)
  })

  it('returns null when the query is not a subsequence of the text', () => {
    expect(fuzzyScore('zzz', 'KeyStation')).toBeNull()
  })

  it('matches case-insensitively', () => {
    expect(fuzzyScore('KEY', 'keystation')).not.toBeNull()
    expect(fuzzyScore('key', 'KEYSTATION')).not.toBeNull()
  })

  it('an empty query matches everything with score 0', () => {
    expect(fuzzyScore('', 'anything')).toBe(0)
  })

  it('scores a consecutive run higher than the same letters scattered', () => {
    // 'key' is consecutive in "KeyStation" but scattered in "Kangaroo Envy"
    const consecutive = fuzzyScore('key', 'KeyStation')!
    const scattered = fuzzyScore('key', 'Kangaroo Envy')!
    expect(consecutive).toBeGreaterThan(scattered)
  })

  it('scores a word-start match higher than a mid-word match', () => {
    // 's' at the start of "Station" vs 's' buried inside "expresso"
    const wordStart = fuzzyScore('s', 'Station')!
    const midWord = fuzzyScore('s', 'expresso')!
    expect(wordStart).toBeGreaterThan(midWord)
  })
})

describe('utils/fuzzy - fuzzySearch', () => {
  const apps = [
    { id: 'finder', title: 'Finder' },
    { id: 'textedit', title: 'TextEdit' },
    { id: 'shortcuts', title: 'Shortcuts' },
    { id: 'keystation', title: 'KeyStation' },
  ]

  it('an empty query returns every item in its original order', () => {
    const result = fuzzySearch('', apps, (a) => a.title)
    expect(result.map((a) => a.id)).toEqual([
      'finder',
      'textedit',
      'shortcuts',
      'keystation',
    ])
  })

  it('filters out items that do not match', () => {
    const result = fuzzySearch('zzz', apps, (a) => a.title)
    expect(result).toEqual([])
  })

  it('ranks the best match first', () => {
    const result = fuzzySearch('key', apps, (a) => a.title)
    expect(result[0]!.id).toBe('keystation')
  })

  it('ignores leading/trailing whitespace in the query', () => {
    const result = fuzzySearch('  key  ', apps, (a) => a.title)
    expect(result[0]!.id).toBe('keystation')
  })
})
