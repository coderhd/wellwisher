'use client'

import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { format, parseISO } from 'date-fns'
import React, { useMemo } from 'react'

import { calculateCapacity } from '../../domain/planning/capacity'
import type {
	FlexibleIntention,
	ProtectedCommitment,
	RhythmAnchor,
	WeekPlan,
} from '../../domain/planning/types'
import type { PlanChange } from '../../state/reducer'
import { formatDurationHours } from './CapacityPanel'
import {
	type AvailableDayOption,
	IntentionCard,
} from './IntentionCard'
import { RhythmAnchorCard } from './RhythmAnchorCard'
import '../../styles/planner.css'

export interface AllocationBoardProps {
	weekPlan: WeekPlan
	unplacedIntentions: FlexibleIntention[]
	intentions?: FlexibleIntention[]
	anchors?: RhythmAnchor[]
	lastPlanChange?: PlanChange | null
	onSuggest: (
		intentionId: string,
		target: { date: string; window: 'morning' | 'afternoon' | 'evening' },
	) => void
	onPin: (allocationId: string, start: string) => void
	onArrange?: () => void
	onUndo?: () => void
	className?: string
}

const WINDOWS: Array<{
	key: 'morning' | 'afternoon' | 'evening'
	label: string
	timeRange: string
	startHour: number
	endHour: number
}> = [
	{
		key: 'morning',
		label: 'Morning',
		timeRange: '06:00 – 12:00',
		startHour: 6,
		endHour: 12,
	},
	{
		key: 'afternoon',
		label: 'Afternoon',
		timeRange: '12:00 – 18:00',
		startHour: 12,
		endHour: 18,
	},
	{
		key: 'evening',
		label: 'Evening',
		timeRange: '18:00 – 24:00',
		startHour: 18,
		endHour: 24,
	},
]

function getWindowForTime (
	time: string,
): 'morning' | 'afternoon' | 'evening' {
	const hour = Number.parseInt(time.split(':')[0] || '0', 10)
	if (hour < 12) {
		return 'morning'
	}
	if (hour < 18) {
		return 'afternoon'
	}
	return 'evening'
}

interface WindowZoneProps {
	date: string
	windowKey: 'morning' | 'afternoon' | 'evening'
	label: string
	timeRange: string
	children?: React.ReactNode
}

function WindowZone ({
	date,
	windowKey,
	label,
	timeRange,
	children,
}: WindowZoneProps): React.JSX.Element {
	const dropId = `${date}:${windowKey}`
	const { setNodeRef, isOver } = useDroppable({
		id: dropId,
		data: { date, window: windowKey },
	})

	return (
		<div
			ref={setNodeRef}
			className={`windowDropZone ${isOver ? 'windowDropZoneOver' : ''}`}
			data-testid={`drop-zone-${date}-${windowKey}`}
		>
			<div className='windowHeader'>
				<span>{label}</span>
				<span>{timeRange}</span>
			</div>
			{children}
		</div>
	)
}

export function AllocationBoard ({
	weekPlan,
	unplacedIntentions,
	intentions = [],
	anchors = [],
	lastPlanChange,
	onSuggest,
	onPin,
	onArrange,
	onUndo,
	className,
}: AllocationBoardProps): React.JSX.Element {
	const allIntentions = useMemo(() => {
		const map = new Map<string, FlexibleIntention>()
		if (intentions) {
			for (const item of intentions) {
				map.set(item.id, item)
			}
		}
		for (const item of unplacedIntentions) {
			map.set(item.id, item)
		}
		return map
	}, [intentions, unplacedIntentions])

	const availableDays: AvailableDayOption[] = useMemo(() => {
		return weekPlan.days.map((day) => {
			const dateObj = parseISO(day.date)
			return {
				date: day.date,
				label: format(dateObj, 'EEE (MMM d)'),
			}
		})
	}, [weekPlan.days])

	const pointerSensor = useSensor(PointerSensor, {
		activationConstraint: {
			distance: 5,
		},
	})
	const keyboardSensor = useSensor(KeyboardSensor)
	const sensors = useSensors(pointerSensor, keyboardSensor)

	function handleDragEnd (event: DragEndEvent) {
		const { active, over } = event
		if (!over) {
			return
		}

		const intentionId =
			(active.data.current?.intentionId as string) ||
			String(active.id).replace(/^draggable-/, '')
		const overId = String(over.id)
		const [date, window] = overId.split(':')

		if (
			date &&
			(window === 'morning' ||
				window === 'afternoon' ||
				window === 'evening')
		) {
			onSuggest(intentionId, { date, window })
		}
	}

	const hasUndo = Boolean(lastPlanChange)

	return (
		<DndContext
			sensors={sensors}
			onDragEnd={handleDragEnd}
		>
			<div
				className={`plannerContainer ${className ?? ''}`}
				data-testid='allocation-board'
			>
				{/* Top Bar / Header */}
				<header className='plannerHeader'>
					<div className='plannerHeaderLeft'>
						<p className='plannerKicker'>Rhythm-Aware Allocation Board</p>
						<h1 className='plannerTitle'>Planner & Allocation Board</h1>
						<p className='plannerGuidance'>
							These are suggestions, not commitments. Pin to a time after
							placing.
						</p>
					</div>

					<div className='plannerActions'>
						{onArrange && (
							<button
								type='button'
								className='actionButton actionButtonPrimary'
								onClick={onArrange}
							>
								Arrange my week
							</button>
						)}

						<button
							type='button'
							className='actionButton actionButtonSecondary'
							disabled={!hasUndo}
							onClick={onUndo}
						>
							Undo
						</button>
					</div>
				</header>

				{/* Main Layout: Sidebar Shelf + 7-Day Columns */}
				<div className='plannerLayout'>
					{/* Sidebar */}
					<aside className='plannerSidebar'>
						{/* Unplaced Intentions Shelf */}
						<section
							className='shelfSection'
							aria-label='Intention shelf'
							role='region'
						>
							<div className='shelfHeader'>
								<h3 className='shelfTitle'>Unplaced Intentions</h3>
								<span className='shelfCount'>{unplacedIntentions.length}</span>
							</div>

							{unplacedIntentions.length === 0 ? (
								<p className='shelfEmpty'>All intentions placed for the week</p>
							) : (
								<ul className='shelfList'>
									{unplacedIntentions.map((intention) => (
										<li key={intention.id}>
											<IntentionCard
												intention={intention}
												availableDays={availableDays}
												onSuggest={onSuggest}
												onPin={onPin}
												isDraggable
											/>
										</li>
									))}
								</ul>
							)}
						</section>

						{/* Recurring Rhythm Anchors Shelf */}
						{anchors.length > 0 && (
							<section
								className='shelfSection'
								aria-label='Rhythm anchors'
								role='region'
							>
								<div className='shelfHeader'>
									<h3 className='shelfTitle'>Rhythm Anchors</h3>
									<span className='shelfCount'>{anchors.length}</span>
								</div>

								<ul className='shelfList'>
									{anchors.map((anchor) => (
										<li key={anchor.id}>
											<RhythmAnchorCard anchor={anchor} />
										</li>
									))}
								</ul>
							</section>
						)}
					</aside>

					{/* 7-Day Columns */}
					<main
						className='weekGrid'
						aria-label='Week allocation grid'
					>
						{weekPlan.days.map((day) => {
							const dateObj = parseISO(day.date)
							const dayName = format(dateObj, 'EEEE')
							const dateShort = format(dateObj, 'MMM d')
							const capacity = calculateCapacity(day)

							// Group protected commitments by window
							const protectedByWindow = new Map<
								'morning' | 'afternoon' | 'evening',
								ProtectedCommitment[]
							>()
							for (const commitment of day.protectedCommitments) {
								const win = getWindowForTime(commitment.startTime)
								const list = protectedByWindow.get(win) || []
								list.push(commitment)
								protectedByWindow.set(win, list)
							}

							return (
								<div
									key={day.date}
									className='dayColumn'
									data-testid={`day-column-${day.date}`}
								>
									<div className='dayHeader'>
										<h4 className='dayTitle'>{dayName}</h4>
										<span className='dayDateLabel'>{dateShort}</span>
										<span className='dayCapacityPill'>
											{formatDurationHours(capacity.openMinutes)} open
										</span>
									</div>

									<div className='windowsContainer'>
										{WINDOWS.map((win) => {
											const windowProtected =
												protectedByWindow.get(win.key) || []
											const windowAllocations = day.allocations.filter((a) => {
												if (a.window) {
													return a.window === win.key
												}
												if (a.start) {
													return getWindowForTime(a.start) === win.key
												}
												const intention = allIntentions.get(a.intentionId || '')
												return (intention?.preferredWindow ?? 'morning') === win.key
											})

											return (
												<WindowZone
													key={win.key}
													date={day.date}
													windowKey={win.key}
													label={win.label}
													timeRange={win.timeRange}
												>
													{/* Protected Commitments */}
													{windowProtected.map((prot) => (
														<div
															key={prot.id}
															className='protectedBlock'
														>
															<span className='protectedTitle'>
																{prot.title}
															</span>
															<span className='protectedTiming'>
																{prot.startTime} - {prot.endTime} (Protected)
															</span>
														</div>
													))}

													{/* Suggested / Pinned Allocations */}
													{windowAllocations.map((allocation) => {
														const intention =
															allIntentions.get(allocation.intentionId || '') ||
															({
																id: allocation.intentionId || allocation.id,
																title: 'Flexible intention',
																kind: 'work',
																durationMinutes: allocation.durationMinutes,
																priority: 2,
															} as FlexibleIntention)

														return (
															<IntentionCard
																key={allocation.id}
																intention={intention}
																allocation={allocation}
																availableDays={availableDays}
																onSuggest={onSuggest}
																onPin={onPin}
																isDraggable
															/>
														)
													})}
												</WindowZone>
											)
										})}
									</div>
								</div>
							)
						})}
					</main>
				</div>
			</div>
		</DndContext>
	)
}
