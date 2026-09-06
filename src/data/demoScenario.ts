import { arrangeWeek } from '../domain/planning/arrange-week'
import type { FlexibleIntention, RhythmAnchor } from '../domain/planning/types'
import type { WellwisherState } from '../state/reducer'

export const DEMO_WEEK_START = '2026-09-07'

export const DEMO_ANCHORS: RhythmAnchor[] = [
	{
		id: 'morning-rhythm',
		title: 'Morning rhythm',
		startTime: '07:30',
		endTime: '08:30',
		repeat: { type: 'weekdays' },
		protected: true,
	},
	{
		id: 'lunch',
		title: 'Lunch',
		startTime: '13:30',
		endTime: '14:30',
		repeat: { type: 'weekdays' },
		protected: true,
	},
	{
		id: 'sunset-calm',
		title: 'Sunset / calm place',
		startTime: '18:00',
		endTime: '20:00',
		repeat: { type: 'weekdays' },
		protected: true,
	},
	{
		id: 'gym',
		title: 'Gym',
		startTime: '20:00',
		endTime: '21:00',
		repeat: { type: 'weekdays' },
		protected: true,
	},
	{
		id: 'dinner',
		title: 'Dinner',
		startTime: '21:00',
		endTime: '22:00',
		repeat: { type: 'weekdays' },
		protected: true,
	},
]

export const DEMO_INTENTIONS: FlexibleIntention[] = [
	{
		id: 'ai-engineering',
		title: 'AI Engineering',
		kind: 'work',
		durationMinutes: 90,
		preferredWindow: 'morning',
		priority: 1,
	},
	{
		id: 'lekhan',
		title: 'Lekhan',
		kind: 'work',
		durationMinutes: 45,
		preferredWindow: 'morning',
		priority: 2,
	},
	{
		id: 'software-factory',
		title: 'Software Factory',
		kind: 'work',
		durationMinutes: 60,
		preferredWindow: 'afternoon',
		priority: 2,
	},
	{
		id: 'trending-learning',
		title: 'Trending learning',
		kind: 'leisure',
		durationMinutes: 45,
		preferredWindow: 'evening',
		priority: 3,
	},
	{
		id: 'walk',
		title: 'Walk',
		kind: 'leisure',
		durationMinutes: 30,
		preferredWindow: 'evening',
		priority: 3,
	},
	{
		id: 'read',
		title: 'Read',
		kind: 'leisure',
		durationMinutes: 30,
		preferredWindow: 'evening',
		priority: 3,
	},
]

export function createDemoState (
	weekStart: string = DEMO_WEEK_START,
): WellwisherState {
	const initialPlan = arrangeWeek({
		anchors: DEMO_ANCHORS,
		intentions: DEMO_INTENTIONS,
		weekStart,
		preserveOpenMinutesPerDay: 90,
	})

	return {
		weekStart,
		anchors: DEMO_ANCHORS.map((anchor) => ({ ...anchor })),
		protectedCommitments: initialPlan.protectedCommitments.map((commitment) => ({
			...commitment,
		})),
		intentions: DEMO_INTENTIONS.map((intention) => ({ ...intention })),
		allocations: initialPlan.allocations.map((allocation) => ({ ...allocation })),
		focusSession: {
			status: 'idle',
			intentionId: '',
			elapsedSeconds: 0,
			targetSeconds: 90 * 60,
		},
		voicePreferences: {
			muted: false,
		},
		lastPlanChange: null,
	}
}
