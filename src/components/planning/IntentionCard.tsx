'use client'

import { useDraggable } from '@dnd-kit/core'
import React, { useState } from 'react'

import type {
	Allocation,
	FlexibleIntention,
} from '../../domain/planning/types'

export interface AvailableDayOption {
	date: string
	label: string
}

export interface IntentionCardProps {
	intention: FlexibleIntention
	allocation?: Allocation
	isDraggable?: boolean
	availableDays?: AvailableDayOption[]
	onSuggest?: (
		intentionId: string,
		target: { date: string; window: 'morning' | 'afternoon' | 'evening' },
	) => void
	onPin?: (allocationId: string, start: string) => void
	className?: string
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

function normalizeAndValidateTime (value: string): string | null {
	const trimmed = value.trim()
	if (TIME_REGEX.test(trimmed)) {
		return trimmed
	}
	if (/^[0-9]:[0-5]\d$/.test(trimmed)) {
		return `0${trimmed}`
	}
	return null
}

export function IntentionCard ({
	intention,
	allocation,
	isDraggable = true,
	availableDays,
	onSuggest,
	onPin,
	className,
}: IntentionCardProps): React.JSX.Element {
	const [isPinning, setIsPinning] = useState(false)
	const [pinTime, setPinTime] = useState('09:00')

	const isPinned = allocation?.mode === 'pinned'
	const isSuggested = allocation?.mode === 'suggested'

	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `draggable-${intention.id}`,
			data: {
				intentionId: intention.id,
				intention,
				allocation,
			},
			disabled: !isDraggable,
			attributes: {
				role: 'article',
				roleDescription: 'draggable',
			},
		})

	const style: React.CSSProperties = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				zIndex: 999,
			}
		: {}

	function handleAccessibleSelect (
		event: React.ChangeEvent<HTMLSelectElement>,
	) {
		const val = event.target.value
		if (!val || !onSuggest) {
			return
		}
		const [date, window] = val.split(':')
		if (date && (window === 'morning' || window === 'afternoon' || window === 'evening')) {
			onSuggest(intention.id, { date, window })
		}
		event.target.value = ''
	}

	function handlePinSubmit (event: React.FormEvent) {
		event.preventDefault()
		const validated = normalizeAndValidateTime(pinTime)
		if (allocation && onPin && validated) {
			onPin(allocation.id, validated)
			setIsPinning(false)
		}
	}

	const windowLabel = allocation?.window
		? allocation.window.charAt(0).toUpperCase() + allocation.window.slice(1)
		: intention.preferredWindow
			? intention.preferredWindow.charAt(0).toUpperCase() +
				intention.preferredWindow.slice(1)
			: 'Flexible'

	const cardClasses = [
		'intentionCard',
		intention.kind === 'leisure'
			? 'intentionCardLeisure'
			: 'intentionCardWork',
		isPinned ? 'intentionCardPinned' : '',
		isDragging ? 'intentionCardDragging' : '',
		className ?? '',
	]
		.filter(Boolean)
		.join(' ')

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cardClasses}
			data-testid={`intention-card-${intention.id}`}
			{...(isDraggable ? attributes : {})}
			{...(isDraggable ? listeners : {})}
		>
			<div className='intentionHeader'>
				<h4 className='intentionTitle'>{intention.title}</h4>
				<div className='intentionBadges'>
					<span
						className={`badge ${intention.kind === 'leisure' ? 'badgeLeisure' : 'badgeWork'}`}
					>
						{intention.kind}
					</span>
					{isPinned && <span className='badge badgePinned'>Pinned</span>}
					{isSuggested && (
						<span className='badge badgeSuggested'>Suggested</span>
					)}
				</div>
			</div>

			<div className='intentionMeta'>
				<span className='metaItem'>
					{intention.durationMinutes} min
				</span>
				<span className='metaItem'>·</span>
				<span className='metaItem'>
					{isPinned && allocation?.start
						? `${allocation.start}${allocation.end ? ` - ${allocation.end}` : ''}`
						: `${windowLabel} window`}
				</span>
				<span className='metaItem'>·</span>
				<span className='metaItem'>P{intention.priority}</span>
			</div>

			{/* Accessible Fallback Menu: Suggest on Day + Window */}
			{onSuggest && availableDays && availableDays.length > 0 && (
				<div
					className='accessibleSuggestContainer'
					onClick={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<select
						className='accessibleSuggestSelect'
						aria-label={`Placement options for ${intention.title}`}
						defaultValue=''
						onChange={handleAccessibleSelect}
					>
						<option
							value=''
							disabled
						>
							Suggest on...
						</option>
						{availableDays.flatMap((day) => [
							<option
								key={`${day.date}:morning`}
								value={`${day.date}:morning`}
							>
								Suggest on {day.label} morning
							</option>,
							<option
								key={`${day.date}:afternoon`}
								value={`${day.date}:afternoon`}
							>
								Suggest on {day.label} afternoon
							</option>,
							<option
								key={`${day.date}:evening`}
								value={`${day.date}:evening`}
							>
								Suggest on {day.label} evening
							</option>,
						])}
					</select>
				</div>
			)}

			{/* Pin to a Time Affordance for Suggested Allocations */}
			{allocation && isSuggested && onPin && (
				<div
					className='pinControls'
					onClick={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
				>
					{!isPinning ? (
						<button
							type='button'
							className='pinButton'
							aria-label={`Pin ${intention.title} to a time`}
							onClick={() => setIsPinning(true)}
						>
							Pin to a time
						</button>
					) : (
						<form
							className='pinForm'
							onSubmit={handlePinSubmit}
						>
							<label
								htmlFor={`pin-time-${intention.id}`}
								style={{
									position: 'absolute',
									width: 1,
									height: 1,
									padding: 0,
									margin: -1,
									overflow: 'hidden',
									clip: 'rect(0, 0, 0, 0)',
									whiteSpace: 'nowrap',
									border: 0,
								}}
							>
								Start time
							</label>
							<input
								id={`pin-time-${intention.id}`}
								type='time'
								className='pinInput'
								value={pinTime}
								placeholder='09:00'
								aria-label='Start time'
								onChange={(e) => setPinTime(e.target.value)}
								autoFocus
							/>
							<button
								type='submit'
								className='pinButton'
							>
								Confirm Pin
							</button>
							<button
								type='button'
								className='pinButton'
								style={{ opacity: 0.7 }}
								onClick={() => setIsPinning(false)}
							>
								Cancel
							</button>
						</form>
					)}
				</div>
			)}
		</div>
	)
}
