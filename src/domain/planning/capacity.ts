import type {
  Allocation,
  CapacitySummary,
  DayPlan,
  OpenWindow,
  ProtectedCommitment,
} from './types'

const MINUTES_PER_DAY = 24 * 60

interface Range {
  start: number
  end: number
}

function toMinutes(time: string): number {
  const localTime = time.includes('T') ? time.slice(11, 16) : time.slice(-5)
  const match = /^(\d{2}):(\d{2})$/.exec(localTime)

  if (!match) {
    throw new RangeError(`Invalid local time: ${time}`)
  }

  return Number(match[1]) * 60 + Number(match[2])
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
  const normalized = Math.max(0, Math.min(MINUTES_PER_DAY, minutes))
  const hours = Math.floor(normalized / 60)
  const remainder = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function commitmentRange(commitment: ProtectedCommitment): Range {
  return asRange(commitment.startTime, commitment.endTime)
}

function allocationRange(allocation: Allocation): Range | null {
  if (!allocation.start || !allocation.end) {
    return null
  }

  return asRange(allocation.start, allocation.end)
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
      .filter((commitment) => commitment.date === day.date)
      .map(commitmentRange),
    ...day.allocations
      .filter((allocation) => allocation.date === day.date && allocation.mode === 'protected')
      .map(allocationRange)
      .filter((range): range is Range => range !== null),
  ]
  const pinnedRanges = day.allocations
    .filter((allocation) => allocation.date === day.date && allocation.mode === 'pinned')
    .map(allocationRange)
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
