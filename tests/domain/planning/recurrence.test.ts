import { describe, expect, test } from 'vitest'

import type { RhythmAnchor } from '../../../src/domain/planning/types'
import { expandRecurrence } from '../../../src/domain/planning/recurrence'

describe('expandRecurrence', () => {
  test('expands a daily anchor across the supplied week', () => {
    const anchor: RhythmAnchor = {
      id: 'morning-routine',
      title: 'Morning routine',
      startTime: '07:00',
      endTime: '08:00',
      repeat: { type: 'daily' },
      protected: true,
    }

    const commitments = expandRecurrence(anchor, '2026-09-07')

    expect(commitments).toHaveLength(7)
    expect(commitments[0]).toMatchObject({
      anchorId: 'morning-routine',
      date: '2026-09-07',
      startTime: '07:00',
      endTime: '08:00',
    })
    expect(commitments[6]).toMatchObject({ date: '2026-09-13' })
  })

  test('expands weekdays but skips Saturday and Sunday', () => {
    const anchor: RhythmAnchor = {
      id: 'lunch',
      title: 'Lunch',
      startTime: '13:30',
      endTime: '14:00',
      repeat: { type: 'weekdays' },
      protected: true,
    }

    const commitments = expandRecurrence(anchor, '2026-09-07')

    expect(commitments.map((commitment) => commitment.date)).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
    ])
  })

  test('expands selected JavaScript weekday numbers', () => {
    const anchor: RhythmAnchor = {
      id: 'sunset',
      title: 'Sunset',
      startTime: '18:00',
      endTime: '20:00',
      repeat: { type: 'selected-days', days: [1, 3, 5] },
      protected: true,
    }

    const commitments = expandRecurrence(anchor, '2026-09-07')

    expect(commitments.map((commitment) => commitment.date)).toEqual([
      '2026-09-07',
      '2026-09-09',
      '2026-09-11',
    ])
  })

  test('keeps exact local times and duration when an anchor crosses midnight', () => {
    const anchor: RhythmAnchor = {
      id: 'night-shift',
      title: 'Night shift',
      startTime: '23:00',
      endTime: '01:00',
      repeat: { type: 'daily' },
      protected: true,
    }

    const commitments = expandRecurrence(anchor, '2026-09-07')

    expect(commitments[0]).toMatchObject({
      anchorId: 'night-shift',
      date: '2026-09-07',
      startTime: '23:00',
      endTime: '01:00',
      durationMinutes: 120,
    })
  })
})
