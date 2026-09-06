import { addDays, format, getDay, isValid, parseISO } from 'date-fns'

import { durationBetween, parseClockTime } from './time'
import type { ProtectedCommitment, RhythmAnchor } from './types'

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
  if (!isValid(firstDate)) {
    throw new RangeError(`Invalid week start: ${weekStart}`)
  }

  const startMinutes = parseClockTime(anchor.startTime)
  const endMinutes = parseClockTime(anchor.endTime)
  const durationMinutes = durationBetween(anchor.startTime, anchor.endTime)
  const commitments: ProtectedCommitment[] = []

  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(firstDate, offset)

    if (!shouldRepeatOn(anchor, date)) {
      continue
    }

    const dateString = format(date, 'yyyy-MM-dd')
    const commitment: ProtectedCommitment = {
      id: `${anchor.id}:${dateString}`,
      anchorId: anchor.id,
      title: anchor.title,
      date: dateString,
      startTime: anchor.startTime,
      endTime: anchor.endTime,
      durationMinutes,
      protected: anchor.protected,
    }

    if (endMinutes <= startMinutes) {
      commitment.endDate = format(addDays(date, 1), 'yyyy-MM-dd')
    }

    commitments.push(commitment)
  }

  return commitments
}
