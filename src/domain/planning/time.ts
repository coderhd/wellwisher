export const MINUTES_PER_DAY = 24 * 60

export type PlanningWindow = 'morning' | 'afternoon' | 'evening'

export function parseClockTime(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value)

  if (!match) {
    throw new RangeError(`Invalid local time: ${value}`)
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (hours > 24 || minutes > 59 || (hours === 24 && minutes !== 0)) {
    throw new RangeError(`Invalid local time: ${value}`)
  }

  return hours * 60 + minutes
}

export function formatClockTime(minutes: number): string {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

export function durationBetween(startTime: string, endTime: string): number {
  const start = parseClockTime(startTime)
  const end = parseClockTime(endTime)
  const duration = end - start

  return duration > 0 ? duration : duration + MINUTES_PER_DAY
}
