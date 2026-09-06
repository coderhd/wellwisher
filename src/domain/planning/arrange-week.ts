import { addDays, format, parseISO } from 'date-fns'

import { calculateCapacity } from './capacity'
import { expandRecurrence } from './recurrence'
import type {
  Allocation,
  ArrangeWeekInput,
  DayPlan,
  FlexibleIntention,
  OpenWindow,
  WeekPlan,
} from './types'

const WINDOW_RANGES = {
  morning: [6 * 60, 12 * 60],
  afternoon: [12 * 60, 18 * 60],
  evening: [18 * 60, 24 * 60],
} as const

function dateRange(weekStart: string): string[] {
  const firstDate = parseISO(weekStart)
  return Array.from({ length: 7 }, (_, offset) => format(addDays(firstDate, offset), 'yyyy-MM-dd'))
}

function timeToMinutes(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) {
    return 0
  }
  return Number(match[1]) * 60 + Number(match[2])
}

function overlapMinutes(start: string, end: string, range: readonly [number, number]): number {
  const overlapStart = Math.max(timeToMinutes(start), range[0])
  const overlapEnd = Math.min(timeToMinutes(end), range[1])
  return Math.max(0, overlapEnd - overlapStart)
}

function preferredOpenMinutes(intention: FlexibleIntention, openWindows: OpenWindow[]): number {
  if (!intention.preferredWindow) {
    return openWindows.reduce((total, window) => total + window.durationMinutes, 0)
  }

  const range = WINDOW_RANGES[intention.preferredWindow]
  return openWindows.reduce(
    (total, window) => total + overlapMinutes(window.start, window.end, range),
    0,
  )
}

function chooseDay(
  intention: FlexibleIntention,
  days: DayPlan[],
  suggestedMinutesByDate: ReadonlyMap<string, number>,
  preserveOpenMinutesPerDay: number,
): DayPlan | undefined {
  const candidates = days
    .map((day, index) => {
      const capacity = calculateCapacity(day)
      const suggestedMinutes = suggestedMinutesByDate.get(day.date) ?? 0
      const remaining = capacity.openMinutes - suggestedMinutes - preserveOpenMinutesPerDay

      return {
        day,
        index,
        capacity,
        suggestedMinutes,
        remaining,
        preferredOpenMinutes: preferredOpenMinutes(intention, capacity.openWindows),
      }
    })
    .filter((candidate) => candidate.remaining >= intention.durationMinutes)
    .sort(
      (left, right) =>
        right.preferredOpenMinutes - left.preferredOpenMinutes ||
        right.remaining - left.remaining ||
        left.index - right.index,
    )

  return candidates[0]?.day
}

export function arrangeWeek(input: ArrangeWeekInput): WeekPlan {
  const protectedCommitments = input.anchors.flatMap((anchor) =>
    expandRecurrence(anchor, input.weekStart),
  )
  const days: DayPlan[] = dateRange(input.weekStart).map((date) => ({
    date,
    protectedCommitments: protectedCommitments.filter(
      (commitment) => commitment.date === date || commitment.endDate === date,
    ),
    allocations: [],
  }))
  const allocations: Allocation[] = []
  const suggestedMinutesByDate = new Map<string, number>()
  const unplacedIntentions: FlexibleIntention[] = []
  const sortedIntentions = input.intentions
    .map((intention, index) => ({ intention, index }))
    .sort((left, right) => left.intention.priority - right.intention.priority || left.index - right.index)

  for (const { intention } of sortedIntentions) {
    const day = chooseDay(
      intention,
      days,
      suggestedMinutesByDate,
      input.preserveOpenMinutesPerDay,
    )

    if (!day) {
      unplacedIntentions.push({ ...intention })
      continue
    }

    const allocation: Allocation = {
      id: `${intention.id}:${day.date}`,
      intentionId: intention.id,
      date: day.date,
      mode: 'suggested',
      durationMinutes: intention.durationMinutes,
    }

    allocations.push(allocation)
    day.allocations.push(allocation)
    suggestedMinutesByDate.set(
      day.date,
      (suggestedMinutesByDate.get(day.date) ?? 0) + intention.durationMinutes,
    )
  }

  const openWindows = days.flatMap((day) => calculateCapacity(day).openWindows)
  const plan: WeekPlan = {
    weekStart: input.weekStart,
    days,
    protectedCommitments: protectedCommitments.map((commitment) => ({ ...commitment })),
    allocations: allocations.map((allocation) => ({ ...allocation })),
    openWindows,
  }

  if (unplacedIntentions.length > 0) {
    plan.unplacedIntentions = unplacedIntentions
  }

  return plan
}
