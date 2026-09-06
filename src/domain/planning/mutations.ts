import { calculateCapacity } from './capacity'
import { formatClockTime, MINUTES_PER_DAY, parseClockTime } from './time'
import type { Allocation, MoveTarget, WeekPlan } from './types'

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

function parseStart(start: string, fallbackDate: string): { date: string; time: string } {
  const fullMatch = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/.exec(start)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(start)

  if (fullMatch) {
    parseClockTime(fullMatch[2])
    return { date: fullMatch[1], time: fullMatch[2] }
  }

  if (timeMatch) {
    const time = `${timeMatch[1]}:${timeMatch[2]}`
    parseClockTime(time)
    return { date: fallbackDate, time }
  }

  throw new RangeError(`Invalid local start: ${start}`)
}

function endForDuration(start: string, durationMinutes: number): string | null {
  const endMinutes = parseClockTime(start) + durationMinutes

  if (endMinutes > MINUTES_PER_DAY) {
    return null
  }

  return endMinutes === MINUTES_PER_DAY ? '24:00' : formatClockTime(endMinutes)
}

function hasDay(plan: WeekPlan, date: string): boolean {
  return plan.days.some((day) => day.date === date)
}

function hasAllocationInDays(plan: WeekPlan, allocationId: string): boolean {
  return plan.days.some((day) => day.allocations.some((allocation) => allocation.id === allocationId))
}

function canPlaceExact(day: WeekPlan['days'][number], allocation: Allocation): boolean {
  if (!allocation.start || !allocation.end) {
    return false
  }

  const start = parseClockTime(allocation.start)
  const end = parseClockTime(allocation.end)
  const endInDay = end <= start ? end + MINUTES_PER_DAY : end
  const availableStart = day.availableStart ? parseClockTime(day.availableStart) : 0
  let availableEnd = day.availableEnd ? parseClockTime(day.availableEnd) : MINUTES_PER_DAY

  if (availableEnd <= availableStart) {
    availableEnd += MINUTES_PER_DAY
  }

  if (endInDay > MINUTES_PER_DAY || endInDay - start !== allocation.durationMinutes) {
    return false
  }

  if (start < availableStart || endInDay > availableEnd) {
    return false
  }

  const withoutCandidate = day.allocations.filter((item) => item.id !== allocation.id)
  const before = calculateCapacity({ ...day, allocations: withoutCandidate })
  const after = calculateCapacity({ ...day, allocations: [...withoutCandidate, allocation] })

  return after.openMinutes === before.openMinutes - allocation.durationMinutes
}

function updatePlanAllocation(next: WeekPlan, allocation: Allocation): void {
  next.allocations = next.allocations.map((item) =>
    item.id === allocation.id ? { ...allocation } : item,
  )
  next.days = setAllocationInDays(next.days, allocation)
  next.openWindows = next.days.flatMap((day) => calculateCapacity(day).openWindows)
}

function isProtected(allocation: Allocation): boolean {
  return allocation.mode === 'protected' || allocation.commitmentId !== undefined
}

export function moveAllocation(plan: WeekPlan, allocationId: string, target: MoveTarget): WeekPlan {
  const next = clonePlan(plan)
  const current = next.allocations.find((allocation) => allocation.id === allocationId)

  if (!current || isProtected(current) || !hasDay(next, target.date) || !hasAllocationInDays(next, allocationId)) {
    return next
  }

  const moved: Allocation = {
    ...current,
    date: target.date,
  }

  if (target.end && !target.start) {
    throw new RangeError('MoveTarget.end requires MoveTarget.start')
  }

  if (target.start) {
    const parsedStart = parseStart(target.start, target.date)
    if (parsedStart.date !== target.date) {
      return next
    }

    const end = target.end ?? endForDuration(parsedStart.time, current.durationMinutes)
    if (!end) {
      return next
    }

    parseClockTime(end)
    moved.mode = 'pinned'
    moved.start = parsedStart.time
    moved.end = end
  } else if (current.mode === 'suggested') {
    delete moved.start
    delete moved.end
  }

  if (target.window) {
    moved.window = target.window
  }

  if (moved.mode === 'pinned' && !canPlaceExact(next.days.find((day) => day.date === target.date)!, moved)) {
    return next
  }

  updatePlanAllocation(next, moved)

  return next
}

export function pinAllocation(plan: WeekPlan, allocationId: string, start: string): WeekPlan {
  const next = clonePlan(plan)
  const current = next.allocations.find((allocation) => allocation.id === allocationId)

  if (!current || current.mode !== 'suggested' || isProtected(current)) {
    return next
  }

  const parsedStart = parseStart(start, current.date)
  if (!hasDay(next, parsedStart.date) || !hasAllocationInDays(next, allocationId)) {
    return next
  }

  const end = endForDuration(parsedStart.time, current.durationMinutes)
  if (!end) {
    return next
  }

  const pinned: Allocation = {
    ...current,
    date: parsedStart.date,
    mode: 'pinned',
    start: parsedStart.time,
    end,
  }

  const targetDay = next.days.find((day) => day.date === parsedStart.date)
  if (!targetDay || !canPlaceExact(targetDay, pinned)) {
    return next
  }

  updatePlanAllocation(next, pinned)

  return next
}
