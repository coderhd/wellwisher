import { describe, expect, test } from 'vitest'

import { moveAllocation, pinAllocation } from '../../../src/domain/planning/mutations'
import { calculateCapacity } from '../../../src/domain/planning/capacity'
import type { Allocation, ProtectedCommitment, WeekPlan } from '../../../src/domain/planning/types'

const protectedCommitment: ProtectedCommitment = {
  id: 'lunch:2026-09-07',
  anchorId: 'lunch',
  title: 'Lunch',
  date: '2026-09-07',
  startTime: '13:30',
  endTime: '14:00',
  durationMinutes: 30,
  protected: true,
}

const suggestedAllocation: Allocation = {
  id: 'ai-engineering:2026-09-07',
  intentionId: 'ai-engineering',
  date: '2026-09-07',
  mode: 'suggested',
  durationMinutes: 90,
}

const plan: WeekPlan = {
  weekStart: '2026-09-07',
  protectedCommitments: [protectedCommitment],
  allocations: [suggestedAllocation],
  openWindows: [],
  days: [
    {
      date: '2026-09-07',
      protectedCommitments: [protectedCommitment],
      allocations: [suggestedAllocation],
    },
    {
      date: '2026-09-08',
      protectedCommitments: [],
      allocations: [],
    },
  ],
}

const planWithOpenCapacity: WeekPlan = {
  ...plan,
  days: plan.days.map((day) => ({ ...day, availableStart: '08:00', availableEnd: '18:00' })),
  openWindows: [],
}
planWithOpenCapacity.openWindows = planWithOpenCapacity.days.flatMap(
  (day) => calculateCapacity(day).openWindows,
)

const overnightPlan: WeekPlan = {
  weekStart: '2026-09-07',
  protectedCommitments: [],
  allocations: [suggestedAllocation],
  openWindows: [],
  days: [
    { date: '2026-09-07', protectedCommitments: [], allocations: [suggestedAllocation] },
    { date: '2026-09-08', protectedCommitments: [], allocations: [] },
    { date: '2026-09-09', protectedCommitments: [], allocations: [] },
  ],
}
overnightPlan.openWindows = overnightPlan.days.flatMap(
  (day) => calculateCapacity(day).openWindows,
)

describe('planning mutations', () => {
  test('moves only a flexible allocation and preserves protected commitments', () => {
    const moved = moveAllocation(plan, suggestedAllocation.id, {
      date: '2026-09-08',
      window: 'morning',
    })

    expect(moved).not.toBe(plan)
    expect(moved.allocations).toContainEqual({
      ...suggestedAllocation,
      date: '2026-09-08',
      window: 'morning',
    })
    expect(moved.protectedCommitments).toEqual(plan.protectedCommitments)
    expect(moved.days[0].protectedCommitments).toEqual(plan.days[0].protectedCommitments)
    expect(plan.allocations[0]).toEqual(suggestedAllocation)
  })

  test('does not move protected allocations', () => {
    const protectedPlan: WeekPlan = {
      ...plan,
      allocations: [
        {
          id: 'protected-allocation',
          commitmentId: protectedCommitment.id,
          date: protectedCommitment.date,
          mode: 'protected',
          start: protectedCommitment.startTime,
          end: protectedCommitment.endTime,
          durationMinutes: protectedCommitment.durationMinutes,
        },
      ],
    }

    const moved = moveAllocation(protectedPlan, 'protected-allocation', { date: '2026-09-08' })

    expect(moved.allocations).toEqual(protectedPlan.allocations)
  })

  test('pins a suggested placement with an exact local end time', () => {
    const pinned = pinAllocation(planWithOpenCapacity, suggestedAllocation.id, '09:30')

    expect(pinned.allocations).toContainEqual({
      ...suggestedAllocation,
      mode: 'pinned',
      start: '09:30',
      end: '11:00',
    })
    expect(pinned.openWindows).toContainEqual({
      date: '2026-09-07',
      start: '08:00',
      end: '09:30',
      durationMinutes: 90,
    })
    expect(plan.allocations[0]).toEqual(suggestedAllocation)
  })

  test('accepts an ISO local start and moves the allocation to that date', () => {
    const pinned = pinAllocation(plan, suggestedAllocation.id, '2026-09-08T09:30')

    expect(pinned.allocations).toContainEqual({
      ...suggestedAllocation,
      date: '2026-09-08',
      mode: 'pinned',
      start: '09:30',
      end: '11:00',
    })
  })

  test('moves a pinned flexible placement without silently unpinning it', () => {
    const pinnedPlan: WeekPlan = {
      ...plan,
      allocations: [
        {
          ...suggestedAllocation,
          mode: 'pinned',
          start: '09:30',
          end: '11:00',
        },
      ],
    }

    const moved = moveAllocation(pinnedPlan, suggestedAllocation.id, { date: '2026-09-08' })

    expect(moved.allocations).toContainEqual({
      ...suggestedAllocation,
      date: '2026-09-08',
      mode: 'pinned',
      start: '09:30',
      end: '11:00',
    })
  })

  test('rejects a move outside the plan week without orphaning the allocation', () => {
    const moved = moveAllocation(plan, suggestedAllocation.id, { date: '2026-09-20' })

    expect(moved.allocations).toEqual(plan.allocations)
    expect(moved.days).toEqual(plan.days)
  })

  test('honors a target window and exact start/end when moving a flexible allocation', () => {
    const moved = moveAllocation(planWithOpenCapacity, suggestedAllocation.id, {
      date: '2026-09-08',
      window: 'afternoon',
      start: '14:00',
      end: '15:30',
    })

    expect(moved.allocations).toContainEqual({
      ...suggestedAllocation,
      date: '2026-09-08',
      mode: 'pinned',
      window: 'afternoon',
      start: '14:00',
      end: '15:30',
    })
    expect(moved.days[1].allocations).toContainEqual(
      expect.objectContaining({ id: suggestedAllocation.id, date: '2026-09-08' }),
    )
  })

  test('rejects a pin outside the plan week without orphaning the allocation', () => {
    const pinned = pinAllocation(planWithOpenCapacity, suggestedAllocation.id, '2026-09-20T09:00')

    expect(pinned.allocations).toEqual(planWithOpenCapacity.allocations)
    expect(pinned.days).toEqual(planWithOpenCapacity.days)
  })

  test.each([
    ['overlaps protected time', '13:00'],
    ['falls outside available hours', '17:00'],
  ])('rejects a pin that %s', (_reason, start) => {
    const pinned = pinAllocation(planWithOpenCapacity, suggestedAllocation.id, start)

    expect(pinned.allocations).toEqual(planWithOpenCapacity.allocations)
    expect(pinned.openWindows).toEqual(planWithOpenCapacity.openWindows)
  })

  test('rejects invalid pin times', () => {
    expect(() => pinAllocation(planWithOpenCapacity, suggestedAllocation.id, '25:99')).toThrow(
      RangeError,
    )
  })

  test('supports a cross-midnight pin across both affected day lists and capacities', () => {
    const pinned = pinAllocation(overnightPlan, suggestedAllocation.id, '23:30')

    expect(pinned.allocations).toContainEqual({
      ...suggestedAllocation,
      mode: 'pinned',
      start: '23:30',
      end: '01:00',
      endDate: '2026-09-08',
    })
    expect(pinned.days[0].allocations).toContainEqual(
      expect.objectContaining({ id: suggestedAllocation.id, date: '2026-09-07' }),
    )
    expect(pinned.days[1].allocations).toContainEqual(
      expect.objectContaining({ id: suggestedAllocation.id, date: '2026-09-07', endDate: '2026-09-08' }),
    )
    expect(calculateCapacity(pinned.days[0]).openMinutes).toBe(1410)
    expect(calculateCapacity(pinned.days[1]).openMinutes).toBe(1380)
    expect(pinned.openWindows).toContainEqual({
      date: '2026-09-08',
      start: '01:00',
      end: '24:00',
      durationMinutes: 1380,
    })
  })

  test('moves a cross-midnight pinned placement to a new pair of days', () => {
    const pinned = pinAllocation(overnightPlan, suggestedAllocation.id, '23:30')
    const moved = moveAllocation(pinned, suggestedAllocation.id, {
      date: '2026-09-08',
      start: '23:30',
    })

    expect(moved.allocations).toContainEqual(
      expect.objectContaining({
        id: suggestedAllocation.id,
        date: '2026-09-08',
        endDate: '2026-09-09',
        start: '23:30',
        end: '01:00',
      }),
    )
    expect(moved.days[0].allocations).toEqual([])
    expect(moved.days[1].allocations).toContainEqual(
      expect.objectContaining({ id: suggestedAllocation.id, date: '2026-09-08' }),
    )
    expect(moved.days[2].allocations).toContainEqual(
      expect.objectContaining({ id: suggestedAllocation.id, endDate: '2026-09-09' }),
    )
  })
})
