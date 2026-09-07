export type ItemKind = 'work' | 'leisure'

export type AllocationMode = 'protected' | 'suggested' | 'pinned'

export type RepeatPattern =
  | { type: 'daily' }
  | { type: 'weekdays' }
  | { type: 'selected-days'; days: number[] }

export interface FlexibleIntention {
  id: string
  title: string
  kind: ItemKind
  durationMinutes: number
  preferredWindow?: 'morning' | 'afternoon' | 'evening'
  priority: 1 | 2 | 3
}

export interface RhythmAnchor {
  id: string
  title: string
  startTime: string
  endTime: string
  repeat: RepeatPattern
  protected: boolean
}

export interface ProtectedCommitment {
  id: string
  anchorId: string
  title: string
  date: string
  endDate?: string
  startTime: string
  endTime: string
  durationMinutes: number
  protected: boolean
}

export interface Allocation {
  id: string
  intentionId?: string
  commitmentId?: string
  date: string
  endDate?: string
  mode: AllocationMode
  /** An advisory broad placement; start/end are reserved for exact pinned times. */
  window?: 'morning' | 'afternoon' | 'evening'
  start?: string
  end?: string
  durationMinutes: number
}

export interface OpenWindow {
  date: string
  start: string
  end: string
  durationMinutes: number
}

export interface DayPlan {
  date: string
  protectedCommitments: ProtectedCommitment[]
  allocations: Allocation[]
  availableStart?: string
  availableEnd?: string
}

export interface CapacitySummary {
  protectedMinutes: number
  suggestedMinutes: number
  openMinutes: number
  openWindows: OpenWindow[]
}

export interface WeekPlan {
  weekStart: string
  days: DayPlan[]
  protectedCommitments: ProtectedCommitment[]
  allocations: Allocation[]
  openWindows: OpenWindow[]
  unplacedIntentions?: FlexibleIntention[]
}

export interface ArrangeWeekInput {
  anchors: RhythmAnchor[]
  intentions: FlexibleIntention[]
  weekStart: string
  preserveOpenMinutesPerDay: number
}

/**
 * A window-only move remains suggested. Supplying start promotes the move to a
 * pinned exact placement; end is optional and otherwise derived from duration.
 */
export interface MoveTarget {
	date: string
	window?: 'morning' | 'afternoon' | 'evening'
	start?: string
	end?: string
}

export interface ScheduleBounds {
	availableStart: string
	availableEnd: string
}
