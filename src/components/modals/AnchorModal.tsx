'use client'

import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'

import { parseClockTime } from '../../domain/planning/time'
import type {
	RepeatPattern,
	RhythmAnchor,
} from '../../domain/planning/types'
import styles from './AnchorModal.module.css'

export interface AnchorModalProps {
	isOpen: boolean
	initialAnchor?: RhythmAnchor | null
	onSave: (anchor: RhythmAnchor) => void
	onDelete?: (anchorId: string) => void
	onClose: () => void
}

const DAYS_OF_WEEK = [
	{ label: 'Monday', shortLabel: 'Mon', value: 1 },
	{ label: 'Tuesday', shortLabel: 'Tue', value: 2 },
	{ label: 'Wednesday', shortLabel: 'Wed', value: 3 },
	{ label: 'Thursday', shortLabel: 'Thu', value: 4 },
	{ label: 'Friday', shortLabel: 'Fri', value: 5 },
	{ label: 'Saturday', shortLabel: 'Sat', value: 6 },
	{ label: 'Sunday', shortLabel: 'Sun', value: 0 },
]

export function AnchorModal ({
	isOpen,
	initialAnchor,
	onSave,
	onDelete,
	onClose,
}: AnchorModalProps): React.JSX.Element | null {
	const [title, setTitle] = useState(initialAnchor?.title ?? '')
	const [startTime, setStartTime] = useState(
		initialAnchor?.startTime ?? '09:00',
	)
	const [endTime, setEndTime] = useState(initialAnchor?.endTime ?? '10:00')
	const [repeatType, setRepeatType] = useState<
		'daily' | 'weekdays' | 'selected-days'
	>(initialAnchor?.repeat.type ?? 'daily')
	const [selectedDays, setSelectedDays] = useState<number[]>(
		initialAnchor?.repeat.type === 'selected-days'
			? initialAnchor.repeat.days
			: [1, 2, 3, 4, 5],
	)
	const [isProtected, setIsProtected] = useState(
		initialAnchor?.protected ?? true,
	)
	const [error, setError] = useState<string | null>(null)

	const titleInputRef = useRef<HTMLInputElement>(null)
	const modalRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (isOpen) {
			setTitle(initialAnchor?.title ?? '')
			setStartTime(initialAnchor?.startTime ?? '09:00')
			setEndTime(initialAnchor?.endTime ?? '10:00')
			setRepeatType(initialAnchor?.repeat.type ?? 'daily')
			setSelectedDays(
				initialAnchor?.repeat.type === 'selected-days'
					? initialAnchor.repeat.days
					: [1, 2, 3, 4, 5],
			)
			setIsProtected(initialAnchor?.protected ?? true)
			setError(null)
			setTimeout(() => {
				titleInputRef.current?.focus()
			}, 0)
		}
	}, [isOpen, initialAnchor])

	useEffect(() => {
		if (!isOpen) {
			return
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation()
				onClose()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen, onClose])

	const handleBackdropClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (e.target === e.currentTarget) {
				onClose()
			}
		},
		[onClose],
	)

	const handleToggleDay = useCallback((dayValue: number) => {
		setSelectedDays((prev) => {
			if (prev.includes(dayValue)) {
				return prev.filter((d) => d !== dayValue)
			}
			return [...prev, dayValue]
		})
	}, [])

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			const trimmedTitle = title.trim()
			if (!trimmedTitle) {
				setError('Title is required')
				return
			}

			let startMinutes: number
			let endMinutes: number
			try {
				startMinutes = parseClockTime(startTime)
				endMinutes = parseClockTime(endTime)
			} catch {
				setError('Invalid time format. Please use HH:mm.')
				return
			}

			if (endMinutes <= startMinutes) {
				setError('End time must be after start time')
				return
			}

			if (repeatType === 'selected-days' && selectedDays.length === 0) {
				setError('Please select at least one day')
				return
			}

			let repeat: RepeatPattern
			if (repeatType === 'daily') {
				repeat = { type: 'daily' }
			} else if (repeatType === 'weekdays') {
				repeat = { type: 'weekdays' }
			} else {
				repeat = {
					type: 'selected-days',
					days: [...selectedDays].sort((a, b) => a - b),
				}
			}

			const anchorToSave: RhythmAnchor = {
				id:
					initialAnchor?.id ??
					(typeof crypto !== 'undefined' && crypto.randomUUID
						? `anchor-${crypto.randomUUID()}`
						: `anchor-${Date.now()}`),
				title: trimmedTitle,
				startTime,
				endTime,
				repeat,
				protected: isProtected,
			}

			onSave(anchorToSave)
			onClose()
		},
		[
			endTime,
			initialAnchor?.id,
			isProtected,
			onClose,
			onSave,
			repeatType,
			selectedDays,
			startTime,
			title,
		],
	)

	const handleDelete = useCallback(() => {
		if (initialAnchor?.id && onDelete) {
			onDelete(initialAnchor.id)
			onClose()
		}
	}, [initialAnchor?.id, onClose, onDelete])

	if (!isOpen) {
		return null
	}

	const isEditing = Boolean(initialAnchor)

	return (
		<div
			className={styles.backdrop}
			onClick={handleBackdropClick}
			role='presentation'
		>
			<div
				ref={modalRef}
				role='dialog'
				aria-modal='true'
				aria-labelledby='anchor-modal-title'
				className={styles.modal}
				tabIndex={-1}
			>
				<div className={styles.header}>
					<h2 id='anchor-modal-title' className={styles.heading}>
						{isEditing ? 'Edit Rhythm Anchor' : 'New Rhythm Anchor'}
					</h2>
					<button
						type='button'
						aria-label='Close modal'
						className={styles.closeButton}
						onClick={onClose}
					>
						<svg
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							aria-hidden='true'
						>
							<line x1='18' y1='6' x2='6' y2='18' />
							<line x1='6' y1='6' x2='18' y2='18' />
						</svg>
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.form}>
					{error && (
						<div role='alert' className={styles.errorMessage}>
							{error}
						</div>
					)}

					<div className={styles.fieldGroup}>
						<label htmlFor='anchor-title' className={styles.label}>
							Title
						</label>
						<input
							ref={titleInputRef}
							id='anchor-title'
							type='text'
							className={styles.input}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder='e.g., Morning walk & contemplation'
						/>
					</div>

					<div className={styles.rowFields}>
						<div className={styles.fieldGroup}>
							<label
								htmlFor='anchor-start-time'
								className={styles.label}
							>
								Start Time
							</label>
							<input
								id='anchor-start-time'
								type='time'
								className={styles.input}
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label
								htmlFor='anchor-end-time'
								className={styles.label}
							>
								End Time
							</label>
							<input
								id='anchor-end-time'
								type='time'
								className={styles.input}
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
							/>
						</div>
					</div>

					<div className={styles.fieldGroup}>
						<label htmlFor='anchor-repeat' className={styles.label}>
							Repeat Pattern
						</label>
						<select
							id='anchor-repeat'
							className={styles.select}
							value={repeatType}
							onChange={(e) =>
								setRepeatType(
									e.target.value as
										| 'daily'
										| 'weekdays'
										| 'selected-days',
								)
							}
						>
							<option value='daily'>Daily (Every day)</option>
							<option value='weekdays'>Weekdays (Mon–Fri)</option>
							<option value='selected-days'>Selected days</option>
						</select>
					</div>

					{repeatType === 'selected-days' && (
						<div className={styles.fieldGroup}>
							<span className={styles.label}>Active Days</span>
							<div
								className={styles.daysGrid}
								role='group'
								aria-label='Select active days'
							>
								{DAYS_OF_WEEK.map((day) => {
									const isChecked = selectedDays.includes(
										day.value,
									)
									return (
										<label
											key={day.value}
											className={styles.dayLabel}
										>
											<input
												type='checkbox'
												className={styles.dayCheckbox}
												checked={isChecked}
												aria-label={day.label}
												onChange={() =>
													handleToggleDay(day.value)
												}
											/>
											<span>{day.shortLabel}</span>
										</label>
									)
								})}
							</div>
						</div>
					)}

					<div className={styles.checkboxContainer}>
						<label
							htmlFor='anchor-protected'
							className={styles.checkboxLabel}
						>
							<input
								id='anchor-protected'
								type='checkbox'
								className={styles.checkbox}
								checked={isProtected}
								onChange={(e) =>
									setIsProtected(e.target.checked)
								}
							/>
							<span>
								Protected commitment (locks time window against
								automatic movement)
							</span>
						</label>
					</div>

					<div className={styles.actions}>
						{isEditing && onDelete && (
							<button
								type='button'
								className={styles.deleteButton}
								onClick={handleDelete}
							>
								Delete Rhythm Anchor
							</button>
						)}
						<button
							type='button'
							className={styles.cancelButton}
							onClick={onClose}
						>
							Cancel
						</button>
						<button type='submit' className={styles.submitButton}>
							{isEditing
								? 'Save Changes'
								: 'Create Rhythm Anchor'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
