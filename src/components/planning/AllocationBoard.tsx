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
import React, { useMemo, useState } from 'react'

import { calculateCapacity } from '../../domain/planning/capacity'
import type {
	FlexibleIntention,
	ProtectedCommitment,
	RhythmAnchor,
	WeekPlan,
} from '../../domain/planning/types'
import type { PlanChange } from '../../state/reducer'
import { AnchorModal } from '../modals/AnchorModal'
import { IntentionModal } from '../modals/IntentionModal'
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
	onAddIntention?: (intention: FlexibleIntention) => void
	onEditIntention?: (intention: FlexibleIntention) => void
	onDeleteIntention?: (intentionId: string) => void
	onAddAnchor?: (anchor: RhythmAnchor) => void
	onEditAnchor?: (anchor: RhythmAnchor) => void
	onDeleteAnchor?: (anchorId: string) => void
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
				<span className='windowLabel'>{label}</span>
				<span className='windowTimeRange'>{timeRange}</span>
			</div>
			<div className='windowContents'>
				{children}
			</div>
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
	onAddIntention,
	onEditIntention,
	onDeleteIntention,
	onAddAnchor,
	onEditAnchor,
	onDeleteAnchor,
	className,
}: AllocationBoardProps): React.JSX.Element {
	const [selectedDate, setSelectedDate] = useState<string>(
		weekPlan.weekStart || weekPlan.days[0]?.date || '',
	)
	const [isAddingIntention, setIsAddingIntention] = useState(false)
	const [editingIntention, setEditingIntention] =
		useState<FlexibleIntention | null>(null)
	const [isAddingAnchor, setIsAddingAnchor] = useState(false)
	const [editingAnchor, setEditingAnchor] =
		useState<RhythmAnchor | null>(null)

	const activeDate =
		selectedDate || weekPlan.weekStart || weekPlan.days[0]?.date || ''

	const selectedDay = useMemo(() => {
		return (
			weekPlan.days.find((d) => d.date === activeDate) ||
			weekPlan.days[0]
		)
	}, [weekPlan.days, activeDate])

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

	function handleSaveIntention (savedIntention: FlexibleIntention) {
		if (editingIntention) {
			onEditIntention?.(savedIntention)
		} else {
			onAddIntention?.(savedIntention)
		}
		setIsAddingIntention(false)
		setEditingIntention(null)
	}

	function handleDeleteIntention (intentionId: string) {
		onDeleteIntention?.(intentionId)
		setIsAddingIntention(false)
		setEditingIntention(null)
	}

	function handleSaveAnchor (savedAnchor: RhythmAnchor) {
		if (editingAnchor) {
			onEditAnchor?.(savedAnchor)
		} else {
			onAddAnchor?.(savedAnchor)
		}
		setIsAddingAnchor(false)
		setEditingAnchor(null)
	}

	function handleDeleteAnchor (anchorId: string) {
		onDeleteAnchor?.(anchorId)
		setIsAddingAnchor(false)
		setEditingAnchor(null)
	}

	const hasUndo = Boolean(lastPlanChange)

	// Group protected commitments for selected day by window
	const protectedByWindow = useMemo(() => {
		const map = new Map<
			'morning' | 'afternoon' | 'evening',
			ProtectedCommitment[]
		>()
		if (!selectedDay) {
			return map
		}
		for (const commitment of selectedDay.protectedCommitments) {
			const win = getWindowForTime(commitment.startTime)
			const list = map.get(win) || []
			list.push(commitment)
			map.set(win, list)
		}
		return map
	}, [selectedDay])

	const selectedCapacity = selectedDay
		? calculateCapacity(selectedDay)
		: { openMinutes: 0 }

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

				{/* 7-Day Ribbon */}
				<nav
					className='plannerRibbon'
					aria-label='Days of the week'
				>
					<div className='ribbonTrack'>
						{weekPlan.days.map((day) => {
							const dateObj = parseISO(day.date)
							const dayNameShort = format(dateObj, 'EEE')
							const dateShort = format(dateObj, 'MMM d')
							const capacity = calculateCapacity(day)
							const isSelected = day.date === selectedDay?.date

							return (
								<button
									key={day.date}
									type='button'
									className={`ribbonDayPill ${isSelected ? 'ribbonDayPillActive' : ''}`}
									aria-current={isSelected ? 'date' : undefined}
									aria-label={`${dayNameShort}, ${dateShort} - ${formatDurationHours(capacity.openMinutes)} open`}
									data-testid={`ribbon-day-${day.date}`}
									onClick={() => setSelectedDate(day.date)}
								>
									<span className='ribbonDayName'>{dayNameShort}</span>
									<span className='ribbonDayDate'>{dateShort}</span>
									<span className='ribbonDayCapacity'>
										{formatDurationHours(capacity.openMinutes)} open
									</span>
								</button>
							)
						})}
					</div>
				</nav>

				{/* Option C Layout: Focused Single-Day Canvas + Sidebar Shelf */}
				<div className='plannerLayout'>
					{/* Sidebar Shelf */}
					<div className='plannerSidebar'>
						{/* Unplaced Intentions Shelf */}
						<section
							className='shelfSection'
							aria-label='Intention shelf'
							role='region'
						>
							<div className='shelfHeader'>
								<div className='shelfHeaderLeft'>
									<h3 className='shelfTitle'>Unplaced Intentions</h3>
									<span className='shelfCount'>{unplacedIntentions.length}</span>
								</div>
								{onAddIntention && (
									<button
										type='button'
										className='shelfAddButton'
										onClick={() => setIsAddingIntention(true)}
										aria-label='Add Intention'
									>
										+ Add Intention
									</button>
								)}
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
												onEdit={onEditIntention ? setEditingIntention : undefined}
												onDelete={onDeleteIntention}
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
									<div className='shelfHeaderLeft'>
										<h3 className='shelfTitle'>Rhythm Anchors</h3>
										<span className='shelfCount'>{anchors.length}</span>
									</div>
									{onAddAnchor && (
										<button
											type='button'
											className='shelfAddButton'
											onClick={() => setIsAddingAnchor(true)}
											aria-label='Add Anchor'
										>
											+ Add Anchor
										</button>
									)}
								</div>

								<ul className='shelfList'>
									{anchors.map((anchor) => (
										<li key={anchor.id}>
											<RhythmAnchorCard
												anchor={anchor}
												onEdit={onEditAnchor ? setEditingAnchor : undefined}
												onDelete={onDeleteAnchor}
											/>
										</li>
									))}
								</ul>
							</section>
						)}
					</div>

					{/* Focused Single-Day Canvas */}
					{selectedDay && (
						<section
							className='focusedDayCanvas'
							aria-label={`Focused day schedule for ${format(parseISO(selectedDay.date), 'EEEE, MMMM d')}`}
							data-testid={`focused-day-${selectedDay.date}`}
							role='region'
						>
							<div className='focusedDayHeader'>
								<div className='focusedDayHeaderInfo'>
									<h2 className='focusedDayTitle'>
										{format(parseISO(selectedDay.date), 'EEEE')}
									</h2>
									<span className='focusedDayDate'>
										{format(parseISO(selectedDay.date), 'MMMM d, yyyy')}
									</span>
								</div>
								<span className='focusedDayCapacityPill'>
									{formatDurationHours(selectedCapacity.openMinutes)} open
								</span>
							</div>

							<div className='focusedDayWindows'>
								{WINDOWS.map((win) => {
									const windowProtected =
										protectedByWindow.get(win.key) || []
									const windowAllocations = selectedDay.allocations.filter((a) => {
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
											date={selectedDay.date}
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
														onEdit={onEditIntention ? setEditingIntention : undefined}
														onDelete={onDeleteIntention}
														isDraggable
													/>
												)
											})}
										</WindowZone>
									)
								})}
							</div>
						</section>
					)}
				</div>

				{/* In-Context Modals for Intention & Rhythm Anchor Management */}
				<IntentionModal
					isOpen={isAddingIntention || editingIntention !== null}
					initialIntention={editingIntention}
					onSave={handleSaveIntention}
					onDelete={handleDeleteIntention}
					onClose={() => {
						setIsAddingIntention(false)
						setEditingIntention(null)
					}}
				/>

				<AnchorModal
					isOpen={isAddingAnchor || editingAnchor !== null}
					initialAnchor={editingAnchor}
					onSave={handleSaveAnchor}
					onDelete={handleDeleteAnchor}
					onClose={() => {
						setIsAddingAnchor(false)
						setEditingAnchor(null)
					}}
				/>
			</div>
		</DndContext>
	)
}
