import { describe, expect, test } from 'vitest'

import { moveAllocation, pinAllocation } from '../../../src/domain/planning/mutations'
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
    const planWithOpenCapacity = {
      ...plan,
      days: plan.days.map((day) => ({ ...day, availableStart: '08:00', availableEnd: '18:00' })),
    }
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
    const pinned = pinAllocation(plan, suggestedAllocation.id, '2026-09-08T23:30')

    expect(pinned.allocations).toContainEqual({
      ...suggestedAllocation,
      date: '2026-09-08',
      mode: 'pinned',
      start: '23:30',
      end: '01:00',
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
})
