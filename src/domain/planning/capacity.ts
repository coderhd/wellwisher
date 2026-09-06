import { addDays, format, isValid, parseISO } from 'date-fns'

import { formatClockTime, MINUTES_PER_DAY, parseClockTime } from './time'
import type {
  Allocation,
  CapacitySummary,
  DayPlan,
  OpenWindow,
  ProtectedCommitment,
} from './types'

interface Range {
  start: number
  end: number
}

function toMinutes(time: string): number {
  return parseClockTime(time.includes('T') ? time.slice(11, 16) : time)
}

function asRange(start: string, end: string): Range {
  const startMinutes = toMinutes(start)
  let endMinutes = toMinutes(end)

  if (endMinutes <= startMinutes) {
    endMinutes += MINUTES_PER_DAY
  }

  return { start: startMinutes, end: endMinutes }
}

function clip(range: Range, start: number, end: number): Range | null {
  const clipped = { start: Math.max(range.start, start), end: Math.min(range.end, end) }
  return clipped.end > clipped.start ? clipped : null
}

function mergeRanges(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((left, right) => left.start - right.start || left.end - right.end)
  const merged: Range[] = []

  for (const range of sorted) {
    const previous = merged[merged.length - 1]

    if (!previous || range.start > previous.end) {
      merged.push({ ...range })
    } else {
      previous.end = Math.max(previous.end, range.end)
    }
  }

  return merged
}

function formatTime(minutes: number): string {
  return minutes === MINUTES_PER_DAY ? '24:00' : formatClockTime(minutes)
}

function commitmentRangeForDate(commitment: ProtectedCommitment, date: string): Range | null {
  const startDate = parseISO(commitment.date)
  if (!isValid(startDate)) {
    throw new RangeError(`Invalid commitment date: ${commitment.date}`)
  }

  const startMinutes = parseClockTime(commitment.startTime)
  const endMinutes = parseClockTime(commitment.endTime)
  const endDate = commitment.endDate ??
    (endMinutes <= startMinutes ? format(addDays(startDate, 1), 'yyyy-MM-dd') : commitment.date)
  if (!isValid(parseISO(endDate)) || endDate < commitment.date) {
    throw new RangeError(`Invalid commitment end date: ${endDate}`)
  }

  if (date < commitment.date || date > endDate) {
    return null
  }

  if (date === commitment.date && date === endDate) {
    return asRange(commitment.startTime, commitment.endTime)
  }

  if (date === commitment.date) {
    return { start: startMinutes, end: MINUTES_PER_DAY }
  }

  if (date === endDate) {
    return { start: 0, end: endMinutes }
  }

  return { start: 0, end: MINUTES_PER_DAY }
}

function allocationRangeForDate(allocation: Allocation, date: string): Range | null {
  if (!allocation.start && !allocation.end) {
    return null
  }

  if (!allocation.start || !allocation.end) {
    throw new RangeError(`Allocation ${allocation.id} must provide both start and end times`)
  }

  const startDate = parseISO(allocation.date)
  if (!isValid(startDate)) {
    throw new RangeError(`Invalid allocation date: ${allocation.date}`)
  }

  const startMinutes = parseClockTime(allocation.start)
  const endMinutes = parseClockTime(allocation.end)
  const endDate = allocation.endDate ??
    (endMinutes <= startMinutes ? format(addDays(startDate, 1), 'yyyy-MM-dd') : allocation.date)
  if (!isValid(parseISO(endDate)) || endDate < allocation.date) {
    throw new RangeError(`Invalid allocation end date: ${endDate}`)
  }

  if (date < allocation.date || date > endDate) {
    return null
  }

  if (date === allocation.date && date === endDate) {
    return asRange(allocation.start, allocation.end)
  }

  if (date === allocation.date) {
    return { start: startMinutes, end: MINUTES_PER_DAY }
  }

  if (date === endDate) {
    return { start: 0, end: endMinutes }
  }

  return { start: 0, end: MINUTES_PER_DAY }
}

function openWindowsFor(
  date: string,
  availableStart: number,
  availableEnd: number,
  occupied: Range[],
): OpenWindow[] {
  const windows: OpenWindow[] = []
  let cursor = availableStart

  for (const range of mergeRanges(occupied)) {
    if (range.end <= availableStart || range.start >= availableEnd) {
      continue
    }

    const start = Math.max(range.start, availableStart)
    const end = Math.min(range.end, availableEnd)

    if (start > cursor) {
      windows.push({
        date,
        start: formatTime(cursor),
        end: formatTime(start),
        durationMinutes: start - cursor,
      })
    }

    cursor = Math.max(cursor, end)
  }

  if (cursor < availableEnd) {
    windows.push({
      date,
      start: formatTime(cursor),
      end: formatTime(availableEnd),
      durationMinutes: availableEnd - cursor,
    })
  }

  return windows
}

export function calculateCapacity(day: DayPlan): CapacitySummary {
  const availableStart = day.availableStart ? toMinutes(day.availableStart) : 0
  let availableEnd = day.availableEnd ? toMinutes(day.availableEnd) : MINUTES_PER_DAY

  if (availableEnd <= availableStart) {
    availableEnd += MINUTES_PER_DAY
  }

  const protectedRanges = [
    ...day.protectedCommitments
      .filter((commitment) => commitment.protected)
      .map((commitment) => commitmentRangeForDate(commitment, day.date))
      .filter((range): range is Range => range !== null),
    ...day.allocations
      .filter((allocation) => allocation.mode === 'protected')
      .map((allocation) => allocationRangeForDate(allocation, day.date))
      .filter((range): range is Range => range !== null),
  ]
  const pinnedRanges = day.allocations
    .filter((allocation) => allocation.mode === 'pinned')
    .map((allocation) => allocationRangeForDate(allocation, day.date))
    .filter((range): range is Range => range !== null)

  const mergedProtected = mergeRanges(protectedRanges)
  const exactRanges = mergeRanges([...protectedRanges, ...pinnedRanges])
  const protectedMinutes = mergedProtected.reduce((total, range) => {
    const clipped = clip(range, availableStart, availableEnd)
    return total + (clipped ? clipped.end - clipped.start : 0)
  }, 0)
  const exactMinutes = exactRanges.reduce((total, range) => {
    const clipped = clip(range, availableStart, availableEnd)
    return total + (clipped ? clipped.end - clipped.start : 0)
  }, 0)
  const availableMinutes = Math.max(0, availableEnd - availableStart)
  const openWindows = openWindowsFor(day.date, availableStart, availableEnd, exactRanges)

  return {
    protectedMinutes,
    suggestedMinutes: day.allocations
      .filter((allocation) => allocation.date === day.date && allocation.mode === 'suggested')
      .reduce((total, allocation) => total + allocation.durationMinutes, 0),
    openMinutes: Math.max(0, availableMinutes - exactMinutes),
    openWindows,
  }
}
