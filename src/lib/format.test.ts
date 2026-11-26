import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration } from './format'

describe('formatDuration', () => {
  it('formats seconds, minutes and both', () => {
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(120)).toBe('2 min')
    expect(formatDuration(125)).toBe('2 min 5s')
  })

  it('rounds the total before splitting, never showing 60 seconds', () => {
    expect(formatDuration(59.6)).toBe('1 min')
    expect(formatDuration(119.6)).toBe('2 min')
    expect(formatDuration(0.4)).toBe('0s')
  })
})

describe('formatClock', () => {
  it('rounds up to whole seconds', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(59.2)).toBe('1:00')
    expect(formatClock(125)).toBe('2:05')
  })
})
