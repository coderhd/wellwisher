import type { Allocation, MoveTarget, WeekPlan } from './types'
import { calculateCapacity } from './capacity'

const MINUTES_PER_DAY = 24 * 60

function clonePlan(plan: WeekPlan): WeekPlan {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      protectedCommitments: day.protectedCommitments.map((commitment) => ({ ...commitment })),
      allocations: day.allocations.map((allocation) => ({ ...allocation })),
    })),
    protectedCommitments: plan.protectedCommitments.map((commitment) => ({ ...commitment })),
    allocations: plan.allocations.map((allocation) => ({ ...allocation })),
    openWindows: plan.openWindows.map((window) => ({ ...window })),
    ...(plan.unplacedIntentions
      ? { unplacedIntentions: plan.unplacedIntentions.map((intention) => ({ ...intention })) }
      : {}),
  }
}

function setAllocationInDays(days: WeekPlan['days'], allocation: Allocation): WeekPlan['days'] {
  return days.map((day) => {
    const withoutAllocation = day.allocations.filter((item) => item.id !== allocation.id)

    return {
      ...day,
      protectedCommitments: day.protectedCommitments.map((commitment) => ({ ...commitment })),
      allocations:
        day.date === allocation.date
          ? [...withoutAllocation, { ...allocation }]
          : withoutAllocation,
    }
  })
}

function parseStart(start: string, fallbackDate: string): { date: string; time: string } | null {
  const fullMatch = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/.exec(start)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(start)

  if (fullMatch) {
    return { date: fullMatch[1], time: fullMatch[2] }
  }

  if (timeMatch) {
    return { date: fallbackDate, time: `${timeMatch[1]}:${timeMatch[2]}` }
  }

  return null
}

function toMinutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
}

function formatTime(minutes: number): string {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

function isProtected(allocation: Allocation): boolean {
  return allocation.mode === 'protected' || allocation.commitmentId !== undefined
}

function refreshOpenWindows(plan: WeekPlan): void {
  plan.openWindows = plan.days.flatMap((day) => calculateCapacity(day).openWindows)
}

export function moveAllocation(plan: WeekPlan, allocationId: string, target: MoveTarget): WeekPlan {
  const next = clonePlan(plan)
  const current = next.allocations.find((allocation) => allocation.id === allocationId)

  if (!current || isProtected(current)) {
    return next
  }

  const moved: Allocation = {
    ...current,
    date: target.date,
  }

  if (current.mode === 'suggested') {
    delete moved.start
    delete moved.end
  }

  next.allocations = next.allocations.map((allocation) =>
    allocation.id === allocationId ? moved : allocation,
  )
  next.days = setAllocationInDays(next.days, moved)
  refreshOpenWindows(next)

  return next
}

export function pinAllocation(plan: WeekPlan, allocationId: string, start: string): WeekPlan {
  const next = clonePlan(plan)
  const current = next.allocations.find((allocation) => allocation.id === allocationId)

  if (!current || current.mode !== 'suggested' || isProtected(current)) {
    return next
  }

  const parsedStart = parseStart(start, current.date)
  if (!parsedStart) {
    return next
  }

  const end = formatTime(toMinutes(parsedStart.time) + current.durationMinutes)
  const pinned: Allocation = {
    ...current,
    date: parsedStart.date,
    mode: 'pinned',
    start: parsedStart.time,
    end,
  }

  next.allocations = next.allocations.map((allocation) =>
    allocation.id === allocationId ? pinned : allocation,
  )
  next.days = setAllocationInDays(next.days, pinned)
  refreshOpenWindows(next)

  return next
}
