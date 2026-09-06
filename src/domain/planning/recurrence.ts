import { addDays, format, getDay, parseISO } from 'date-fns'

import type { ProtectedCommitment, RhythmAnchor } from './types'

const MINUTES_PER_DAY = 24 * 60

function toMinutes(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time)

  if (!match) {
    throw new RangeError(`Invalid local time: ${time}`)
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (hours > 24 || minutes > 59 || (hours === 24 && minutes !== 0)) {
    throw new RangeError(`Invalid local time: ${time}`)
  }

  return hours * 60 + minutes
}

function durationBetween(startTime: string, endTime: string): number {
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  const duration = end - start

  return duration > 0 ? duration : duration + MINUTES_PER_DAY
}

function shouldRepeatOn(anchor: RhythmAnchor, date: Date): boolean {
  const weekday = getDay(date)

  switch (anchor.repeat.type) {
    case 'daily':
      return true
    case 'weekdays':
      return weekday >= 1 && weekday <= 5
    case 'selected-days':
      return anchor.repeat.days.includes(weekday)
  }
}

export function expandRecurrence(anchor: RhythmAnchor, weekStart: string): ProtectedCommitment[] {
  const firstDate = parseISO(weekStart)
  const durationMinutes = durationBetween(anchor.startTime, anchor.endTime)
  const commitments: ProtectedCommitment[] = []

  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(firstDate, offset)

    if (!shouldRepeatOn(anchor, date)) {
      continue
    }

    const dateString = format(date, 'yyyy-MM-dd')
    commitments.push({
      id: `${anchor.id}:${dateString}`,
      anchorId: anchor.id,
      title: anchor.title,
      date: dateString,
      startTime: anchor.startTime,
      endTime: anchor.endTime,
      durationMinutes,
      protected: anchor.protected,
    })
  }

  return commitments
}
