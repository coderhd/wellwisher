import { describe, expect, test } from 'vitest'

import { arrangeWeek } from '../../../src/domain/planning/arrange-week'
import { calculateCapacity } from '../../../src/domain/planning/capacity'
import type { FlexibleIntention, RhythmAnchor } from '../../../src/domain/planning/types'

const anchor = (
  id: string,
  title: string,
  startTime: string,
  endTime: string,
): RhythmAnchor => ({
  id,
  title,
  startTime,
  endTime,
  repeat: { type: 'weekdays' },
  protected: true,
})

const intentions: FlexibleIntention[] = [
  {
    id: 'ai-engineering',
    title: 'AI Engineering',
    kind: 'work',
    durationMinutes: 90,
    preferredWindow: 'morning',
    priority: 1,
  },
  {
    id: 'lekhan',
    title: 'Lekhan',
    kind: 'work',
    durationMinutes: 45,
    preferredWindow: 'afternoon',
    priority: 2,
  },
  {
    id: 'factory',
    title: 'Software Factory',
    kind: 'work',
    durationMinutes: 60,
    priority: 2,
  },
  {
    id: 'sunset-learning',
    title: 'Sunset learning',
    kind: 'leisure',
    durationMinutes: 45,
    preferredWindow: 'evening',
    priority: 3,
  },
]

describe('arrangeWeek', () => {
  test('creates suggested flexible allocations while preserving anchors and open capacity', () => {
    const anchors = [
      anchor('lunch', 'Lunch', '13:30', '14:00'),
      anchor('sunset', 'Sunset', '18:00', '20:00'),
      anchor('gym', 'Gym', '20:00', '21:00'),
      anchor('dinner', 'Dinner', '21:00', '22:00'),
    ]

    const plan = arrangeWeek({
      anchors,
      intentions,
      weekStart: '2026-09-07',
      preserveOpenMinutesPerDay: 90,
    })

    expect(plan.allocations.every((item) => item.mode !== 'pinned')).toBe(true)
    expect(plan.allocations.every((item) => item.mode === 'suggested')).toBe(true)
    expect(plan.allocations.every((item) => item.start === undefined && item.end === undefined)).toBe(
      true,
    )
    expect(plan.protectedCommitments).toContainEqual(expect.objectContaining({ title: 'Lunch' }))
    expect(plan.openWindows.some((window) => window.durationMinutes >= 90)).toBe(true)
    expect(plan.allocations).toHaveLength(intentions.length)
    expect(plan.allocations.some((allocation) => allocation.intentionId === 'sunset-learning')).toBe(
      true,
    )
  })

  test('does not mutate the supplied anchors or intentions', () => {
    const anchors = [anchor('lunch', 'Lunch', '13:30', '14:00')]
    const inputIntentions = intentions.slice(0, 1)
    const originalAnchors = structuredClone(anchors)
    const originalIntentions = structuredClone(inputIntentions)

    arrangeWeek({
      anchors,
      intentions: inputIntentions,
      weekStart: '2026-09-07',
      preserveOpenMinutesPerDay: 90,
    })

    expect(anchors).toEqual(originalAnchors)
    expect(inputIntentions).toEqual(originalIntentions)
  })

  test('carries an overnight protected anchor into the next day capacity', () => {
    const overnightAnchor: RhythmAnchor = {
      id: 'night-shift',
      title: 'Night shift',
      startTime: '23:00',
      endTime: '01:00',
      repeat: { type: 'daily' },
      protected: true,
    }

    const plan = arrangeWeek({
      anchors: [overnightAnchor],
      intentions: [],
      weekStart: '2026-09-07',
      preserveOpenMinutesPerDay: 90,
    })

    expect(plan.days[1].protectedCommitments).toContainEqual(
      expect.objectContaining({
        date: '2026-09-07',
        endDate: '2026-09-08',
      }),
    )
    expect(calculateCapacity({ ...plan.days[1], availableStart: '00:00', availableEnd: '08:00' }))
      .toMatchObject({ protectedMinutes: 60, openMinutes: 420 })
  })
})
