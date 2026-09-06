import { describe, expect, test } from 'vitest'

import { calculateCapacity } from '../../../src/domain/planning/capacity'
import type { Allocation, DayPlan, ProtectedCommitment } from '../../../src/domain/planning/types'

const commitment = (startTime: string, endTime: string): ProtectedCommitment => ({
  id: `commitment-${startTime}`,
  anchorId: 'anchor',
  title: 'Protected time',
  date: '2026-09-07',
  startTime,
  endTime,
  durationMinutes: 60,
  protected: true,
})

const allocation = (overrides: Partial<Allocation>): Allocation => ({
  id: 'allocation',
  intentionId: 'intention',
  date: '2026-09-07',
  mode: 'suggested',
  durationMinutes: 90,
  ...overrides,
})

const baseDay = (overrides: Partial<DayPlan> = {}): DayPlan => ({
  date: '2026-09-07',
  availableStart: '08:00',
  availableEnd: '18:00',
  protectedCommitments: [],
  allocations: [],
  ...overrides,
})

describe('calculateCapacity', () => {
  test('subtracts merged protected ranges and keeps the remaining windows visible', () => {
    const summary = calculateCapacity(
      baseDay({
        protectedCommitments: [commitment('10:00', '11:00'), commitment('10:30', '12:00')],
      }),
    )

    expect(summary.protectedMinutes).toBe(120)
    expect(summary.openMinutes).toBe(480)
    expect(summary.openWindows).toEqual([
      { date: '2026-09-07', start: '08:00', end: '10:00', durationMinutes: 120 },
      { date: '2026-09-07', start: '12:00', end: '18:00', durationMinutes: 360 },
    ])
  })

  test('reports suggested work separately without consuming open capacity', () => {
    const summary = calculateCapacity(
      baseDay({
        protectedCommitments: [commitment('10:00', '11:00')],
        allocations: [allocation({})],
      }),
    )

    expect(summary.suggestedMinutes).toBe(90)
    expect(summary.openMinutes).toBe(540)
    expect(summary.openWindows.some((window) => window.durationMinutes >= 90)).toBe(true)
  })

  test('subtracts a pinned placement from open capacity', () => {
    const summary = calculateCapacity(
      baseDay({
        allocations: [
          allocation({ mode: 'pinned', start: '14:00', end: '15:30', durationMinutes: 90 }),
        ],
      }),
    )

    expect(summary.suggestedMinutes).toBe(0)
    expect(summary.openMinutes).toBe(510)
    expect(summary.openWindows).toContainEqual({
      date: '2026-09-07',
      start: '08:00',
      end: '14:00',
      durationMinutes: 360,
    })
  })
})
