'use client'

import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'

import type {
	FlexibleIntention,
	ItemKind,
} from '../../domain/planning/types'
import { CustomSelect } from '../ui/CustomSelect'
import styles from './IntentionModal.module.css'

export interface IntentionModalProps {
	isOpen: boolean
	initialIntention?: FlexibleIntention | null
	onSave: (intention: FlexibleIntention) => void
	onDelete?: (intentionId: string) => void
	onClose: () => void
}

export function IntentionModal ({
	isOpen,
	initialIntention,
	onSave,
	onDelete,
	onClose,
}: IntentionModalProps): React.JSX.Element | null {
	const [title, setTitle] = useState(initialIntention?.title ?? '')
	const [kind, setKind] = useState<ItemKind>(
		initialIntention?.kind ?? 'work',
	)
	const [durationMinutes, setDurationMinutes] = useState(
		initialIntention?.durationMinutes ?? 45,
	)
	const [preferredWindow, setPreferredWindow] = useState<
		'morning' | 'afternoon' | 'evening' | ''
	>(initialIntention?.preferredWindow ?? '')
	const [priority, setPriority] = useState<1 | 2 | 3>(
		initialIntention?.priority ?? 2,
	)
	const [error, setError] = useState<string | null>(null)

	const titleInputRef = useRef<HTMLInputElement>(null)
	const modalRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (isOpen) {
			setTitle(initialIntention?.title ?? '')
			setKind(initialIntention?.kind ?? 'work')
			setDurationMinutes(initialIntention?.durationMinutes ?? 45)
			setPreferredWindow(initialIntention?.preferredWindow ?? '')
			setPriority(initialIntention?.priority ?? 2)
			setError(null)
			setTimeout(() => {
				titleInputRef.current?.focus()
			}, 0)
		}
	}, [isOpen, initialIntention])

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

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			const trimmedTitle = title.trim()
			if (!trimmedTitle) {
				setError('Title is required')
				return
			}

			const parsedDuration = Number(durationMinutes)
			if (isNaN(parsedDuration) || parsedDuration <= 0) {
				setError('Duration must be greater than 0 minutes')
				return
			}

			const intentionToSave: FlexibleIntention = {
				id:
					initialIntention?.id ??
					(typeof crypto !== 'undefined' && crypto.randomUUID
						? `intention-${crypto.randomUUID()}`
						: `intention-${Date.now()}`),
				title: trimmedTitle,
				kind,
				durationMinutes: parsedDuration,
				priority,
				...(preferredWindow ? { preferredWindow } : {}),
			}

			onSave(intentionToSave)
			onClose()
		},
		[
			durationMinutes,
			initialIntention?.id,
			kind,
			onClose,
			onSave,
			preferredWindow,
			priority,
			title,
		],
	)

	const handleDelete = useCallback(() => {
		if (initialIntention?.id && onDelete) {
			onDelete(initialIntention.id)
			onClose()
		}
	}, [initialIntention?.id, onClose, onDelete])

	if (!isOpen) {
		return null
	}

	const isEditing = Boolean(initialIntention)

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
				aria-labelledby='intention-modal-title'
				className={styles.modal}
				tabIndex={-1}
			>
				<div className={styles.header}>
					<h2 id='intention-modal-title' className={styles.heading}>
						{isEditing ? 'Edit Intention' : 'New Intention'}
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
						<label htmlFor='intention-title' className={styles.label}>
							Title
						</label>
						<input
							ref={titleInputRef}
							id='intention-title'
							type='text'
							className={styles.input}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder='e.g., Deep architecture design'
						/>
					</div>

					<div className={styles.rowFields}>
						<div className={styles.fieldGroup}>
							<label htmlFor='intention-kind' className={styles.label}>
								Kind
							</label>
							<CustomSelect
								id='intention-kind'
								value={kind}
								ariaLabel='Intention Kind'
								onChange={(val) => setKind(val as ItemKind)}
								options={[
									{ value: 'work', label: 'Work' },
									{ value: 'leisure', label: 'Leisure' },
								]}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label
								htmlFor='intention-duration'
								className={styles.label}
							>
								Duration
							</label>
							<CustomSelect
								id='intention-duration'
								value={String(durationMinutes)}
								ariaLabel='Intention Duration'
								onChange={(val) => setDurationMinutes(Number(val))}
								options={[
									{ value: '15', label: '15 min' },
									{ value: '30', label: '30 min' },
									{ value: '45', label: '45 min' },
									{ value: '60', label: '60 min (1 hr)' },
									{ value: '90', label: '90 min (1.5 hr)' },
									{ value: '120', label: '120 min (2 hr)' },
								]}
							/>
						</div>
					</div>

					<div className={styles.rowFields}>
						<div className={styles.fieldGroup}>
							<label
								htmlFor='intention-window'
								className={styles.label}
							>
								Preferred Window
							</label>
							<CustomSelect
								id='intention-window'
								value={preferredWindow}
								ariaLabel='Preferred Window'
								placeholder='Any time'
								onChange={(val) =>
									setPreferredWindow(
										val as
											| 'morning'
											| 'afternoon'
											| 'evening'
											| '',
									)
								}
								options={[
									{ value: '', label: 'Any time' },
									{ value: 'morning', label: 'Morning' },
									{ value: 'afternoon', label: 'Afternoon' },
									{ value: 'evening', label: 'Evening' },
								]}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label
								htmlFor='intention-priority'
								className={styles.label}
							>
								Priority
							</label>
							<CustomSelect
								id='intention-priority'
								value={String(priority)}
								ariaLabel='Intention Priority'
								onChange={(val) =>
									setPriority(Number(val) as 1 | 2 | 3)
								}
								options={[
									{ value: '1', label: '1 (Highest)' },
									{ value: '2', label: '2 (Normal)' },
									{ value: '3', label: '3 (Lowest)' },
								]}
							/>
						</div>
					</div>

					<div className={styles.actions}>
						{isEditing && onDelete && (
							<button
								type='button'
								className={styles.deleteButton}
								onClick={handleDelete}
							>
								Delete Intention
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
							{isEditing ? 'Save Changes' : 'Create Intention'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
