'use client'

import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import { z } from 'zod'

import { AnchorModal } from '../../components/modals/AnchorModal'
import { createDemoState } from '../../data/demoScenario'
import { parseClockTime } from '../../domain/planning/time'
import type { RhythmAnchor } from '../../domain/planning/types'
import { clearState } from '../../state/persistence'
import type { WellwisherState } from '../../state/reducer'
import { useWellwisher } from '../../state/WellwisherProvider'
import styles from './SettingsSurface.module.css'

const RepeatPatternSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('daily') }),
	z.object({ type: z.literal('weekdays') }),
	z.object({
		type: z.literal('selected-days'),
		days: z.array(z.number()),
	}),
])

const RhythmAnchorSchema = z.object({
	id: z.string(),
	title: z.string(),
	startTime: z.string(),
	endTime: z.string(),
	repeat: RepeatPatternSchema,
	protected: z.boolean().optional().default(true),
})

const ProtectedCommitmentSchema = z.object({
	id: z.string(),
	anchorId: z.string().optional().default(''),
	title: z.string(),
	date: z.string(),
	endDate: z.string().optional(),
	startTime: z.string(),
	endTime: z.string(),
	durationMinutes: z.number().optional().default(60),
	protected: z.boolean().optional().default(true),
})

const FlexibleIntentionSchema = z.object({
	id: z.string(),
	title: z.string(),
	kind: z.enum(['work', 'leisure']),
	durationMinutes: z.number(),
	priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.number()]),
	preferredWindow: z.enum(['morning', 'afternoon', 'evening']).optional(),
})

const AllocationSchema = z.object({
	id: z.string(),
	intentionId: z.string().optional(),
	commitmentId: z.string().optional(),
	date: z.string(),
	endDate: z.string().optional(),
	mode: z.enum(['protected', 'suggested', 'pinned']),
	window: z.enum(['morning', 'afternoon', 'evening']).optional(),
	start: z.string().optional(),
	end: z.string().optional(),
	durationMinutes: z.number(),
})

const VoicePreferencesSchema = z.object({
	muted: z.boolean(),
	autoPlay: z.boolean().optional(),
	speed: z.number().optional(),
})

const FocusSessionSchema = z.object({
	status: z
		.enum(['idle', 'running', 'paused', 'completed'])
		.optional()
		.default('idle'),
	intentionId: z.string().optional().default(''),
	elapsedSeconds: z.number().optional().default(0),
	targetSeconds: z.number().optional().default(90 * 60),
	startedAt: z.string().optional(),
	completedAt: z.string().optional(),
})

const PlanChangeSchema = z.object({
	description: z.string(),
	timestamp: z.string(),
	previousAllocations: z.array(AllocationSchema),
	previousProtectedCommitments: z.array(ProtectedCommitmentSchema).optional(),
	tradeOff: z.string().optional(),
})

const WellwisherStateSchema = z.object({
	weekStart: z.string(),
	anchors: z.array(RhythmAnchorSchema),
	protectedCommitments: z.array(ProtectedCommitmentSchema),
	intentions: z.array(FlexibleIntentionSchema),
	allocations: z.array(AllocationSchema),
	focusSession: FocusSessionSchema.optional().default({
		status: 'idle',
		intentionId: '',
		elapsedSeconds: 0,
		targetSeconds: 90 * 60,
	}),
	voicePreferences: VoicePreferencesSchema.optional().default({
		muted: false,
	}),
	lastPlanChange: PlanChangeSchema.nullable().optional(),
	scheduleBounds: z
		.object({
			availableStart: z.string(),
			availableEnd: z.string(),
		})
		.optional(),
})

function formatRepeatReadable (repeat: RhythmAnchor['repeat']): string {
	switch (repeat.type) {
		case 'daily': {
			return 'Daily (Every day)'
		}
		case 'weekdays': {
			return 'Weekdays (Mon–Fri)'
		}
		case 'selected-days': {
			const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
			const selected = repeat.days.map((d) => dayNames[d]).join(', ')
			return selected || 'Selected days'
		}
		default: {
			return 'Repeating'
		}
	}
}

export function SettingsSurface (): React.JSX.Element {
	const { state, dispatch } = useWellwisher()

	// Anchor modal state
	const [isAnchorModalOpen, setIsAnchorModalOpen] = useState(false)
	const [selectedAnchor, setSelectedAnchor] = useState<RhythmAnchor | null>(
		null,
	)

	// Schedule bounds form state
	const [availableStart, setAvailableStart] = useState(
		state.scheduleBounds?.availableStart ?? '08:00',
	)
	const [availableEnd, setAvailableEnd] = useState(
		state.scheduleBounds?.availableEnd ?? '22:00',
	)
	const [boundsStatus, setBoundsStatus] = useState<string | null>(null)
	const [boundsError, setBoundsError] = useState<string | null>(null)

	// Storage & Data state
	const [storageStatus, setStorageStatus] = useState<string | null>(null)
	const [storageError, setStorageError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (state.scheduleBounds) {
			setAvailableStart(state.scheduleBounds.availableStart)
			setAvailableEnd(state.scheduleBounds.availableEnd)
		}
	}, [state.scheduleBounds])

	// Anchor CRUD handlers
	const handleAddAnchorClick = useCallback(() => {
		setSelectedAnchor(null)
		setIsAnchorModalOpen(true)
	}, [])

	const handleEditAnchorClick = useCallback((anchor: RhythmAnchor) => {
		setSelectedAnchor(anchor)
		setIsAnchorModalOpen(true)
	}, [])

	const handleCloseAnchorModal = useCallback(() => {
		setIsAnchorModalOpen(false)
		setSelectedAnchor(null)
	}, [])

	const handleSaveAnchor = useCallback(
		(anchor: RhythmAnchor) => {
			const exists = state.anchors.some((a) => a.id === anchor.id)
			if (exists) {
				dispatch({
					type: 'UPDATE_ANCHOR',
					payload: anchor,
				})
			} else {
				dispatch({
					type: 'ADD_ANCHOR',
					payload: anchor,
				})
			}
			setIsAnchorModalOpen(false)
			setSelectedAnchor(null)
		},
		[dispatch, state.anchors],
	)

	const handleDeleteAnchor = useCallback(
		(anchorId: string) => {
			dispatch({
				type: 'DELETE_ANCHOR',
				payload: { anchorId },
			})
			setIsAnchorModalOpen(false)
			setSelectedAnchor(null)
		},
		[dispatch],
	)

	// Schedule bounds handlers
	const handleSaveBounds = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			setBoundsStatus(null)
			setBoundsError(null)

			let startMins: number
			let endMins: number
			try {
				startMins = parseClockTime(availableStart)
				endMins = parseClockTime(availableEnd)
			} catch {
				setBoundsError('Invalid time format. Please use HH:mm.')
				return
			}

			if (endMins <= startMins) {
				setBoundsError('End time must be after start time.')
				return
			}

			dispatch({
				type: 'UPDATE_SCHEDULE_BOUNDS',
				payload: {
					availableStart,
					availableEnd,
				},
			})
			setBoundsStatus('Schedule boundaries saved successfully.')
		},
		[availableEnd, availableStart, dispatch],
	)

	// Voice preferences handlers
	const handleToggleMute = useCallback(() => {
		dispatch({
			type: 'SET_VOICE_PREFERENCE',
			payload: {
				muted: !state.voicePreferences.muted,
			},
		})
	}, [dispatch, state.voicePreferences.muted])

	const handleToggleAutoPlay = useCallback(() => {
		dispatch({
			type: 'SET_VOICE_PREFERENCE',
			payload: {
				autoPlay: !state.voicePreferences.autoPlay,
			},
		})
	}, [dispatch, state.voicePreferences.autoPlay])

	const handleSpeedChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			dispatch({
				type: 'SET_VOICE_PREFERENCE',
				payload: {
					speed: Number(e.target.value),
				},
			})
		},
		[dispatch],
	)

	// Storage & Data handlers
	const handleExportData = useCallback(() => {
		setStorageStatus(null)
		setStorageError(null)
		try {
			const dataStr = JSON.stringify(state, null, 2)
			const blob = new Blob([dataStr], { type: 'application/json' })
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = 'wellwisher-backup.json'
			link.click()
			URL.revokeObjectURL(url)
			setStorageStatus('Data exported successfully.')
		} catch (err) {
			setStorageError(
				`Failed to export data: ${err instanceof Error ? err.message : 'Unknown error'}`,
			)
		}
	}, [state])

	const handleImportTrigger = useCallback(() => {
		fileInputRef.current?.click()
	}, [])

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			setStorageStatus(null)
			setStorageError(null)

			const file = e.target.files?.[0]
			if (!file) {
				return
			}

			try {
				const text = await new Promise<string>((resolve, reject) => {
					if (typeof file.text === 'function') {
						file.text().then(resolve).catch(reject)
						return
					}
					const reader = new FileReader()
					reader.onload = () => resolve(reader.result as string)
					reader.onerror = () => reject(reader.error)
					reader.readAsText(file)
				})
				const json = JSON.parse(text)
				const parseResult = WellwisherStateSchema.safeParse(json)

				if (!parseResult.success) {
					setStorageError(
						'Invalid backup file. Please select a valid Wellwisher JSON export.',
					)
					return
				}

				dispatch({
					type: 'IMPORT_STATE',
					payload: parseResult.data as WellwisherState,
				})
				setStorageStatus('Data imported successfully.')
			} catch {
				setStorageError(
					'Invalid backup file. Please select a valid Wellwisher JSON export.',
				)
			} finally {
				// Reset input so same file can be uploaded again if needed
				if (fileInputRef.current) {
					fileInputRef.current.value = ''
				}
			}
		},
		[dispatch],
	)

	const handleResetDemo = useCallback(() => {
		setStorageStatus(null)
		setStorageError(null)
		clearState()
		dispatch({
			type: 'RESET_STATE',
			payload: createDemoState(),
		})
		setStorageStatus('Reset to Harsh demo scenario complete.')
	}, [dispatch])

	return (
		<div className={styles.surface}>
			<header className={styles.header}>
				<p className={styles.kicker}>Preferences & System</p>
				<h1 className={styles.title}>Settings</h1>
				<p className={styles.description}>
					Configure rhythm anchors, daily scheduling boundaries, companion
					voice feedback, and local data persistence.
				</p>
			</header>

			{/* Section 1: Master Rhythm Anchors */}
			<section
				className={styles.section}
				aria-labelledby='rhythm-anchors-title'
			>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionHeadingGroup}>
						<h2
							id='rhythm-anchors-title'
							className={styles.sectionTitle}
						>
							Master Rhythm Anchors
						</h2>
						<p className={styles.sectionDescription}>
							Recurring commitments that establish your weekly cadence and
							protect foundational personal time.
						</p>
					</div>

					<button
						type='button'
						className={styles.actionButton}
						onClick={handleAddAnchorClick}
						aria-label='Add rhythm anchor'
					>
						+ Add Anchor
					</button>
				</div>

				<div className={styles.anchorsList}>
					{state.anchors.length === 0 ? (
						<div className={styles.emptyState}>
							No rhythm anchors configured yet. Add your first rhythm
							anchor above.
						</div>
					) : (
						state.anchors.map((anchor) => (
							<div key={anchor.id} className={styles.anchorCard}>
								<div className={styles.anchorInfo}>
									<div className={styles.anchorTitleRow}>
										<h3 className={styles.anchorTitle}>
											{anchor.title}
										</h3>
										{anchor.protected && (
											<span className={styles.badgeProtected}>
												Protected
											</span>
										)}
									</div>
									<div className={styles.anchorMeta}>
										<span>
											{anchor.startTime} – {anchor.endTime}
										</span>
										<span>·</span>
										<span>
											{formatRepeatReadable(anchor.repeat)}
										</span>
									</div>
								</div>

								<div className={styles.cardActions}>
									<button
										type='button'
										className={styles.smallButton}
										aria-label={`Edit ${anchor.title}`}
										onClick={() => handleEditAnchorClick(anchor)}
									>
										Edit
									</button>
									<button
										type='button'
										className={`${styles.smallButton} ${styles.smallButtonDelete}`}
										aria-label={`Delete ${anchor.title}`}
										onClick={() => handleDeleteAnchor(anchor.id)}
									>
										Delete
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</section>

			{/* Section 2: Day Schedule Boundaries */}
			<section
				className={styles.section}
				aria-labelledby='schedule-bounds-title'
			>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionHeadingGroup}>
						<h2
							id='schedule-bounds-title'
							className={styles.sectionTitle}
						>
							Day Schedule Boundaries
						</h2>
						<p className={styles.sectionDescription}>
							Define the earliest start time and latest end time for your
							daily scheduling window.
						</p>
					</div>
				</div>

				<form onSubmit={handleSaveBounds}>
					<div className={styles.formRow}>
						<div className={styles.fieldGroup}>
							<label
								htmlFor='available-start'
								className={styles.label}
							>
								Available Start (Earliest)
							</label>
							<input
								id='available-start'
								type='time'
								className={styles.input}
								value={availableStart}
								onChange={(e) => setAvailableStart(e.target.value)}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label
								htmlFor='available-end'
								className={styles.label}
							>
								Available End (Latest)
							</label>
							<input
								id='available-end'
								type='time'
								className={styles.input}
								value={availableEnd}
								onChange={(e) => setAvailableEnd(e.target.value)}
							/>
						</div>
					</div>

					{boundsStatus && (
						<div
							role='status'
							aria-live='polite'
							className={styles.statusMessage}
						>
							{boundsStatus}
						</div>
					)}

					{boundsError && (
						<div role='alert' className={styles.errorMessage}>
							{boundsError}
						</div>
					)}

					<div style={{ marginTop: 'var(--ww-space-4)' }}>
						<button
							type='submit'
							className={styles.actionButton}
						>
							Save Boundaries
						</button>
					</div>
				</form>
			</section>

			{/* Section 3: Voice & Companion Preferences */}
			<section
				id='voice'
				className={styles.section}
				aria-labelledby='voice-prefs-title'
			>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionHeadingGroup}>
						<h2
							id='voice-prefs-title'
							className={styles.sectionTitle}
						>
							Voice & Companion Preferences
						</h2>
						<p className={styles.sectionDescription}>
							Fine-tune conversational companion guidance, spoken pacing,
							and audio feedback.
						</p>
					</div>
				</div>

				<div className={styles.checkboxContainer}>
					<label
						htmlFor='voice-muted'
						className={styles.checkboxLabel}
					>
						<input
							id='voice-muted'
							type='checkbox'
							className={styles.checkbox}
							checked={state.voicePreferences.muted}
							onChange={handleToggleMute}
						/>
						<span>Mute companion audio</span>
					</label>
				</div>

				<div className={styles.checkboxContainer}>
					<label
						htmlFor='voice-autoplay'
						className={styles.checkboxLabel}
					>
						<input
							id='voice-autoplay'
							type='checkbox'
							className={styles.checkbox}
							checked={Boolean(state.voicePreferences.autoPlay)}
							onChange={handleToggleAutoPlay}
						/>
						<span>Auto-play companion voice orientation on navigation</span>
					</label>
				</div>

				<div
					className={styles.fieldGroup}
					style={{ maxWidth: '20rem' }}
				>
					<label htmlFor='voice-speed' className={styles.label}>
						Speech Rate / Voice Speed
					</label>
					<select
						id='voice-speed'
						className={styles.select}
						value={String(state.voicePreferences.speed ?? 1)}
						onChange={handleSpeedChange}
					>
						<option value='0.75'>0.75x (Relaxed & Deliberate)</option>
						<option value='1'>1.0x (Normal Pace)</option>
						<option value='1.25'>1.25x (Brisk & Focused)</option>
						<option value='1.5'>1.5x (Rapid Review)</option>
					</select>
				</div>
			</section>

			{/* Section 4: Storage & Data Management */}
			<section
				className={styles.section}
				aria-labelledby='storage-management-title'
			>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionHeadingGroup}>
						<h2
							id='storage-management-title'
							className={styles.sectionTitle}
						>
							Storage & Data Management
						</h2>
						<p className={styles.sectionDescription}>
							Export, import, or reset your personal cockpit state, and
							inspect sync status.
						</p>
					</div>
				</div>

				{/* Cloud / Google Drive Sync Seam */}
				<div className={styles.cloudBanner}>
					<span className={styles.badgeCloud}>
						Local-First Storage (Ready for Google Drive Sync)
					</span>
					<p className={styles.cloudDescription}>
						All your planning rhythms, commitments, and focus sessions are
						safely stored locally in your browser. Cloud replication hooks
						are pre-architected for seamless Google Drive synchronization.
					</p>
				</div>

				{storageStatus && (
					<div
						role='status'
						aria-live='polite'
						className={styles.statusMessage}
					>
						{storageStatus}
					</div>
				)}

				{storageError && (
					<div role='alert' className={styles.errorMessage}>
						{storageError}
					</div>
				)}

				<div className={styles.dataActionsGrid}>
					<div className={styles.dataActionCard}>
						<div>
							<h3 className={styles.dataActionTitle}>Export Backup</h3>
							<p className={styles.dataActionDesc}>
								Download a full JSON snapshot of your entire cockpit
								state.
							</p>
						</div>
						<button
							type='button'
							className={`${styles.actionButton} ${styles.actionButtonSubtle}`}
							onClick={handleExportData}
						>
							Export Data
						</button>
					</div>

					<div className={styles.dataActionCard}>
						<div>
							<h3 className={styles.dataActionTitle}>Import Backup</h3>
							<p className={styles.dataActionDesc}>
								Restore or replace state from an existing JSON backup
								file.
							</p>
						</div>
						<input
							ref={fileInputRef}
							id='import-file-input'
							type='file'
							accept='.json,application/json'
							className={styles.fileInputHidden}
							onChange={handleFileChange}
							aria-label='Import data'
						/>
						<button
							type='button'
							className={`${styles.actionButton} ${styles.actionButtonSubtle}`}
							onClick={handleImportTrigger}
						>
							Import JSON
						</button>
					</div>

					<div className={styles.dataActionCard}>
						<div>
							<h3 className={styles.dataActionTitle}>Reset Scenario</h3>
							<p className={styles.dataActionDesc}>
								Revert local storage back to the default Harsh Dave demo
								state.
							</p>
						</div>
						<button
							type='button'
							className={`${styles.actionButton} ${styles.actionButtonDanger}`}
							onClick={handleResetDemo}
						>
							Reset to Demo Scenario
						</button>
					</div>
				</div>
			</section>

			{/* Rhythm Anchor Modal */}
			<AnchorModal
				isOpen={isAnchorModalOpen}
				initialAnchor={selectedAnchor}
				onSave={handleSaveAnchor}
				onDelete={handleDeleteAnchor}
				onClose={handleCloseAnchorModal}
			/>
		</div>
	)
}
