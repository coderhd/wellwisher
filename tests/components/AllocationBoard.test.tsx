import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { PlanSurface } from '../../src/app/plan/PlanSurface'
import { AllocationBoard } from '../../src/components/planning/AllocationBoard'
import { IntentionCard } from '../../src/components/planning/IntentionCard'
import { RhythmAnchorCard } from '../../src/components/planning/RhythmAnchorCard'
import { createDemoState } from '../../src/data/demoScenario'
import type {
	FlexibleIntention,
	RhythmAnchor,
	WeekPlan,
} from '../../src/domain/planning/types'
import { WellwisherProvider } from '../../src/state/WellwisherProvider'

describe('AllocationBoard and Planning Components', () => {
	const mockWeekPlan: WeekPlan = {
		weekStart: '2026-09-07',
		days: [
			{
				date: '2026-09-07',
				protectedCommitments: [
					{
						id: 'prot-mon-morning',
						anchorId: 'morning-rhythm',
						title: 'Morning rhythm',
						date: '2026-09-07',
						startTime: '07:30',
						endTime: '08:30',
						durationMinutes: 60,
						protected: true,
					},
				],
				allocations: [
					{
						id: 'alloc-ai-mon',
						intentionId: 'ai-engineering',
						date: '2026-09-07',
						window: 'morning',
						mode: 'suggested',
						durationMinutes: 90,
					},
				],
			},
			{
				date: '2026-09-08',
				protectedCommitments: [],
				allocations: [
					{
						id: 'alloc-lekhan-tue',
						intentionId: 'lekhan',
						date: '2026-09-08',
						start: '10:00',
						end: '10:45',
						mode: 'pinned',
						durationMinutes: 45,
					},
				],
			},
			{
				date: '2026-09-09',
				protectedCommitments: [],
				allocations: [],
			},
			{
				date: '2026-09-10',
				protectedCommitments: [],
				allocations: [],
			},
			{
				date: '2026-09-11',
				protectedCommitments: [],
				allocations: [],
			},
			{
				date: '2026-09-12',
				protectedCommitments: [],
				allocations: [],
			},
			{
				date: '2026-09-13',
				protectedCommitments: [],
				allocations: [],
			},
		],
		protectedCommitments: [],
		allocations: [],
		openWindows: [],
	}

	const mockUnplacedIntentions: FlexibleIntention[] = [
		{
			id: 'trending-learning',
			title: 'Trending learning',
			kind: 'leisure',
			durationMinutes: 45,
			preferredWindow: 'evening',
			priority: 3,
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
			id: 'walk',
			title: 'Walk',
			kind: 'leisure',
			durationMinutes: 30,
			preferredWindow: 'evening',
			priority: 3,
		},
	]

	const mockAnchors: RhythmAnchor[] = [
		{
			id: 'lunch',
			title: 'Lunch',
			startTime: '13:30',
			endTime: '14:30',
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
	]

	it('renders intention shelf with work and leisure items as first-class citizens', () => {
		const onSuggest = vi.fn()
		const onPin = vi.fn()

		render(
			<AllocationBoard
				weekPlan={mockWeekPlan}
				unplacedIntentions={mockUnplacedIntentions}
				anchors={mockAnchors}
				onSuggest={onSuggest}
				onPin={onPin}
			/>,
		)

		const shelf = screen.getByRole('region', {
			name: /intention shelf|unplaced intentions/i,
		})
		expect(shelf).toBeInTheDocument()

		// Both Work and Leisure intentions are displayed
		expect(screen.getByText('Trending learning')).toBeInTheDocument()
		expect(screen.getByText('Software Factory')).toBeInTheDocument()
		expect(screen.getByText('Walk')).toBeInTheDocument()

		// Verify leisure badge/kind indicator exists alongside work
		const leisureBadges = screen.getAllByText(/leisure/i)
		const workBadges = screen.getAllByText(/work/i)
		expect(leisureBadges.length).toBeGreaterThanOrEqual(2)
		expect(workBadges.length).toBeGreaterThanOrEqual(1)
	})

	it('displays the required user-facing guidance copy', () => {
		render(
			<AllocationBoard
				weekPlan={mockWeekPlan}
				unplacedIntentions={mockUnplacedIntentions}
				anchors={mockAnchors}
				onSuggest={vi.fn()}
				onPin={vi.fn()}
			/>,
		)

		expect(
			screen.getByText(
				/these are suggestions, not commitments\. pin to a time after placing\./i,
			),
		).toBeInTheDocument()
	})

	it('renders recurring rhythm anchors in the sidebar and protects them from being moved', () => {
		render(
			<AllocationBoard
				weekPlan={mockWeekPlan}
				unplacedIntentions={mockUnplacedIntentions}
				anchors={mockAnchors}
				onSuggest={vi.fn()}
				onPin={vi.fn()}
			/>,
		)

		const rhythmRegion = screen.getByRole('region', {
			name: /rhythm anchors|recurring rhythms/i,
		})
		expect(rhythmRegion).toBeInTheDocument()

		expect(screen.getByText('Lunch')).toBeInTheDocument()
		expect(screen.getByText(/13:30 - 14:30/)).toBeInTheDocument()
		expect(screen.getByText('Gym')).toBeInTheDocument()

		// Protected commitments on day columns are rendered as non-draggable protected items
		const protectedCommitment = screen.getByText('Morning rhythm')
		expect(protectedCommitment).toBeInTheDocument()
		expect(
			screen.getAllByText(/protected/i).length,
		).toBeGreaterThanOrEqual(1)
	})

	it('provides accessible menu fallback for keyboard users to suggest intentions without dragging', async () => {
		const user = userEvent.setup()
		const onSuggest = vi.fn()
		const onPin = vi.fn()

		render(
			<AllocationBoard
				weekPlan={mockWeekPlan}
				unplacedIntentions={mockUnplacedIntentions}
				anchors={mockAnchors}
				onSuggest={onSuggest}
				onPin={onPin}
			/>,
		)

		// Find the accessible menu or select for "Trending learning"
		const suggestControl = screen.getByRole('combobox', {
			name: /suggest trending learning on|placement options for trending learning/i,
		})
		expect(suggestControl).toBeInTheDocument()

		// Select Tuesday evening
		await user.selectOptions(suggestControl, '2026-09-08:evening')

		expect(onSuggest).toHaveBeenCalledWith('trending-learning', {
			date: '2026-09-08',
			window: 'evening',
		})
	})

	it('supports "Pin to a time" affordance to convert a suggested allocation into a pinned placement', async () => {
		const user = userEvent.setup()
		const onSuggest = vi.fn()
		const onPin = vi.fn()

		render(
			<AllocationBoard
				weekPlan={mockWeekPlan}
				unplacedIntentions={[]}
				anchors={mockAnchors}
				onSuggest={onSuggest}
				onPin={onPin}
			/>,
		)

		// Monday has suggested allocation "alloc-ai-mon"
		const pinButton = screen.getByRole('button', {
			name: /pin ai engineering to a time|pin to a time/i,
		})
		expect(pinButton).toBeInTheDocument()

		await user.click(pinButton)

		// Time input is revealed
		const timeInput = screen.getByLabelText(/start time|pin time/i)
		expect(timeInput).toBeInTheDocument()

		await user.clear(timeInput)
		await user.type(timeInput, '09:15')

		const confirmPinButton = screen.getByRole('button', {
			name: /confirm pin|save pin|pin/i,
		})
		await user.click(confirmPinButton)

		expect(onPin).toHaveBeenCalledWith('alloc-ai-mon', '09:15')
	})

	it('distinguishes pinned allocations with exact start times from suggested ones', () => {
		render(
			<AllocationBoard
				weekPlan={mockWeekPlan}
				unplacedIntentions={[]}
				anchors={mockAnchors}
				onSuggest={vi.fn()}
				onPin={vi.fn()}
			/>,
		)

		// Lekhan is pinned on Tuesday with 10:00 - 10:45
		expect(screen.getByText('Lekhan')).toBeInTheDocument()
		expect(screen.getByText(/10:00 - 10:45/)).toBeInTheDocument()
		expect(screen.getByText('Pinned')).toBeInTheDocument()

		// AI Engineering is suggested on Monday
		expect(screen.getByText('AI Engineering')).toBeInTheDocument()
		expect(screen.getByText('Suggested')).toBeInTheDocument()
	})

	it('calls onArrange when "Arrange my week" button is clicked', async () => {
		const user = userEvent.setup()
		const onArrange = vi.fn()

		render(
			<AllocationBoard
				weekPlan={mockWeekPlan}
				unplacedIntentions={mockUnplacedIntentions}
				anchors={mockAnchors}
				onSuggest={vi.fn()}
				onPin={vi.fn()}
				onArrange={onArrange}
			/>,
		)

		const arrangeButton = screen.getByRole('button', {
			name: /arrange my week/i,
		})
		expect(arrangeButton).toBeInTheDocument()

		await user.click(arrangeButton)
		expect(onArrange).toHaveBeenCalledTimes(1)
	})

	it('enables and calls onUndo when last plan change is available', async () => {
		const user = userEvent.setup()
		const onUndo = vi.fn()

		render(
			<AllocationBoard
				weekPlan={mockWeekPlan}
				unplacedIntentions={mockUnplacedIntentions}
				anchors={mockAnchors}
				lastPlanChange={{
					description: 'Arranged week allocations',
					timestamp: '2026-09-06T12:00:00Z',
					previousAllocations: [],
				}}
				onSuggest={vi.fn()}
				onPin={vi.fn()}
				onUndo={onUndo}
			/>,
		)

		const undoButton = screen.getByRole('button', {
			name: /undo/i,
		})
		expect(undoButton).toBeInTheDocument()
		expect(undoButton).toBeEnabled()

		await user.click(undoButton)
		expect(onUndo).toHaveBeenCalledTimes(1)
	})

	it('disables undo button when there is no previous change', () => {
		render(
			<AllocationBoard
				weekPlan={mockWeekPlan}
				unplacedIntentions={mockUnplacedIntentions}
				anchors={mockAnchors}
				lastPlanChange={null}
				onSuggest={vi.fn()}
				onPin={vi.fn()}
				onUndo={vi.fn()}
			/>,
		)

		const undoButton = screen.queryByRole('button', {
			name: /undo/i,
		})
		if (undoButton) {
			expect(undoButton).toBeDisabled()
		}
	})

	it('renders standalone IntentionCard with kind, duration, priority, and drag attributes', () => {
		const sampleIntention: FlexibleIntention = {
			id: 'sunset-walk',
			title: 'Sunset Walk',
			kind: 'leisure',
			durationMinutes: 45,
			preferredWindow: 'evening',
			priority: 2,
		}

		render(
			<IntentionCard
				intention={sampleIntention}
				isDraggable
			/>,
		)

		expect(screen.getByText('Sunset Walk')).toBeInTheDocument()
		expect(screen.getByText(/45 min/i)).toBeInTheDocument()
		expect(screen.getByText(/leisure/i)).toBeInTheDocument()
		expect(screen.getByText(/evening/i)).toBeInTheDocument()
	})

	it('renders standalone RhythmAnchorCard with repeat frequency and protected status', () => {
		const sampleAnchor: RhythmAnchor = {
			id: 'sunset-calm',
			title: 'Sunset / calm place',
			startTime: '18:00',
			endTime: '20:00',
			repeat: { type: 'weekdays' },
			protected: true,
		}

		render(<RhythmAnchorCard anchor={sampleAnchor} />)

		expect(screen.getByText('Sunset / calm place')).toBeInTheDocument()
		expect(screen.getByText(/18:00 - 20:00/)).toBeInTheDocument()
		expect(screen.getByText(/working days|weekdays/i)).toBeInTheDocument()
		expect(screen.getByText(/protected/i)).toBeInTheDocument()
	})

	it('integrates PlanSurface with WellwisherProvider end-to-end', async () => {
		const user = userEvent.setup()
		const demoState = createDemoState('2026-09-07')

		render(
			<WellwisherProvider initialState={demoState}>
				<PlanSurface />
			</WellwisherProvider>,
		)

		// Surface header and guidance
		expect(
			screen.getByRole('heading', { name: /planner|allocation board/i }),
		).toBeInTheDocument()
		expect(
			screen.getByText(
				/these are suggestions, not commitments\. pin to a time after placing\./i,
			),
		).toBeInTheDocument()

		// Arrange my week button
		const arrangeBtn = screen.getByRole('button', {
			name: /arrange my week/i,
		})
		expect(arrangeBtn).toBeInTheDocument()
		await user.click(arrangeBtn)

		// After arrange, undo button should be enabled
		const undoBtn = screen.getByRole('button', {
			name: /undo/i,
		})
		expect(undoBtn).toBeEnabled()

		// Clicking undo restores prior allocations
		await user.click(undoBtn)
		expect(undoBtn).toBeDisabled()
	})
})
