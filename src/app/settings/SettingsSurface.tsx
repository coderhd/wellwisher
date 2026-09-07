'use client'

import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { AnchorModal } from '../../components/modals/AnchorModal'
import { CustomSelect } from '../../components/ui/CustomSelect'
import { CustomTimePicker } from '../../components/ui/CustomTimePicker'
import { createDemoState } from '../../data/demoScenario'
import { parseClockTime } from '../../domain/planning/time'
import type { RhythmAnchor } from '../../domain/planning/types'
import {
	downloadStateFromDrive,
	requestGoogleDriveToken,
	uploadStateToDrive,
} from '../../services/googleDriveClient'
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
	const router = useRouter()
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

	// Google Drive Sync state
	const [googleClientId, setGoogleClientId] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('wellwisher.gdrive.client_id') || ''
		}
		return ''
	})
	const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => {
		if (typeof window !== 'undefined') {
			return sessionStorage.getItem('wellwisher.gdrive.access_token')
		}
		return null
	})
	const [isDriveConnected, setIsDriveConnected] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('wellwisher.gdrive.connected') === 'true'
		}
		return false
	})
	const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('wellwisher.gdrive.autosync') === 'true'
		}
		return false
	})
	const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('wellwisher.gdrive.last_synced')
		}
		return null
	})
	const [isSyncing, setIsSyncing] = useState<boolean>(false)
	const [showGcpGuide, setShowGcpGuide] = useState<boolean>(false)

	// Storage & Data state
	const [storageStatus, setStorageStatus] = useState<string | null>(null)
	const [storageError, setStorageError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleSaveClientId = useCallback((val: string) => {
		setGoogleClientId(val)
		if (typeof window !== 'undefined') {
			localStorage.setItem('wellwisher.gdrive.client_id', val.trim())
		}
	}, [])

	const handleConnectGoogleDrive = useCallback(async () => {
		setStorageStatus(null)
		setStorageError(null)

		const trimmedClientId = googleClientId.trim()
		if (!trimmedClientId) {
			setStorageError('Please enter a Google Cloud OAuth Client ID first.')
			return
		}

		setIsSyncing(true)
		try {
			const token = await requestGoogleDriveToken(trimmedClientId)
			setGoogleAccessToken(token)
			if (typeof window !== 'undefined') {
				sessionStorage.setItem('wellwisher.gdrive.access_token', token)
				localStorage.setItem('wellwisher.gdrive.connected', 'true')
			}
			setIsDriveConnected(true)

			// Try to download existing cloud state or upload current state
			const remoteState = await downloadStateFromDrive(token)
			if (remoteState) {
				dispatch({
					type: 'IMPORT_STATE',
					payload: remoteState,
				})
				setStorageStatus('Connected to Google Drive and loaded existing remote state.')
			} else {
				await uploadStateToDrive(token, state)
				setStorageStatus('Connected to Google Drive and uploaded local state to appDataFolder.')
			}

			const now = new Date().toISOString()
			setLastSyncedAt(now)
			if (typeof window !== 'undefined') {
				localStorage.setItem('wellwisher.gdrive.last_synced', now)
			}
		} catch (err) {
			// If popup blocked or cancelled or running in test/offline environment, provide clear informative message
			setStorageError(
				`Google Drive connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
			)
		} finally {
			setIsSyncing(false)
		}
	}, [dispatch, googleClientId, state])

	const handleSyncNow = useCallback(async () => {
		setStorageStatus(null)
		setStorageError(null)

		if (!googleAccessToken) {
			// Re-authenticate
			await handleConnectGoogleDrive()
			return
		}

		setIsSyncing(true)
		try {
			await uploadStateToDrive(googleAccessToken, state)
			const now = new Date().toISOString()
			setLastSyncedAt(now)
			if (typeof window !== 'undefined') {
				localStorage.setItem('wellwisher.gdrive.last_synced', now)
			}
			setStorageStatus('State synced successfully to Google Drive appDataFolder.')
		} catch (err) {
			setStorageError(
				`Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
			)
		} finally {
			setIsSyncing(false)
		}
	}, [googleAccessToken, handleConnectGoogleDrive, state])

	const handleDisconnectGoogleDrive = useCallback(() => {
		setIsDriveConnected(false)
		setIsAutoSyncEnabled(false)
		setGoogleAccessToken(null)
		setLastSyncedAt(null)
		if (typeof window !== 'undefined') {
			localStorage.removeItem('wellwisher.gdrive.connected')
			localStorage.removeItem('wellwisher.gdrive.autosync')
			localStorage.removeItem('wellwisher.gdrive.last_synced')
			sessionStorage.removeItem('wellwisher.gdrive.access_token')
		}
		setStorageStatus('Disconnected from Google Drive. Local storage remains intact.')
	}, [])

	const handleToggleAutoSync = useCallback(() => {
		setIsAutoSyncEnabled((prev) => {
			const next = !prev
			if (typeof window !== 'undefined') {
				localStorage.setItem('wellwisher.gdrive.autosync', String(next))
			}
			return next
		})
	}, [])

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
		(val: string) => {
			dispatch({
				type: 'SET_VOICE_PREFERENCE',
				payload: {
					speed: Number(val),
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

	const handleResetToDefault = useCallback(() => {
		setStorageStatus(null)
		setStorageError(null)
		clearState()
		router.push('/')
	}, [router])

	const handleQuickResetDemo = useCallback(() => {
		setStorageStatus(null)
		setStorageError(null)
		clearState()
		dispatch({
			type: 'RESET_STATE',
			payload: createDemoState(),
		})
		setStorageStatus('Reset to demo baseline complete.')
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
							<CustomTimePicker
								id='available-start'
								value={availableStart}
								ariaLabel='Available start time'
								onChange={(val) => setAvailableStart(val)}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label
								htmlFor='available-end'
								className={styles.label}
							>
								Available End (Latest)
							</label>
							<CustomTimePicker
								id='available-end'
								value={availableEnd}
								ariaLabel='Available end time'
								onChange={(val) => setAvailableEnd(val)}
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
					<CustomSelect
						id='voice-speed'
						value={String(state.voicePreferences.speed ?? 1)}
						ariaLabel='Speech Rate'
						onChange={handleSpeedChange}
						options={[
							{ value: '0.75', label: '0.75x (Relaxed & Deliberate)' },
							{ value: '1', label: '1.0x (Normal Pace)' },
							{ value: '1.25', label: '1.25x (Brisk & Focused)' },
							{ value: '1.5', label: '1.5x (Rapid Review)' },
						]}
					/>
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

				{/* Cloud & Google Drive Sync Console */}
				<div className={styles.driveSyncCard}>
					<div className={styles.driveSyncHeader}>
						<span className={styles.badgeCloud}>
							Google Drive Client-Side Sync
						</span>
						<span
							className={`${styles.syncStatusIndicator} ${
								isDriveConnected
									? styles.syncStatusConnected
									: styles.syncStatusDisconnected
							}`}
						>
							<span className={styles.statusDot} />
							{isDriveConnected ? 'Connected to Google Drive' : 'Ready to Connect'}
						</span>
					</div>

					<p className={styles.cloudDescription}>
						{isDriveConnected
							? 'Your planning rhythms, commitments, and focus sessions are automatically synchronized with your private Google Drive appDataFolder (wellwisher-state.json).'
							: 'Connect your personal Google Drive to enable seamless bidirectional synchronization between your laptop and mobile devices without any intermediate cloud database.'}
					</p>

					{/* Google OAuth Client ID Configuration */}
					<div className={styles.clientIdGroup}>
						<label htmlFor='google-client-id' className={styles.label}>
							Google Cloud OAuth Client ID
						</label>
						<input
							id='google-client-id'
							type='text'
							className={styles.input}
							value={googleClientId}
							onChange={(e) => handleSaveClientId(e.target.value)}
							placeholder='e.g., 123456789-abcdef.apps.googleusercontent.com'
						/>
					</div>

					<div style={{ display: 'flex', gap: 'var(--ww-space-2)' }}>
						<button
							type='button'
							className={styles.smallButton}
							onClick={() => setShowGcpGuide((prev) => !prev)}
						>
							{showGcpGuide ? 'Hide GCP Setup Guide' : 'How to get OAuth Client ID?'}
						</button>
					</div>

					{showGcpGuide && (
						<div className={styles.gcpGuideBox}>
							<h3 className={styles.gcpGuideTitle}>Google Cloud Platform Setup (1–2 minutes)</h3>
							<ol className={styles.gcpStepsList}>
								<li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: 'var(--ww-sage)' }}>GCP Credentials Console</a> in your preferred project.</li>
								<li>Click <strong>+ Create Credentials</strong> &rarr; <strong>OAuth client ID</strong>.</li>
								<li>Choose Application type: <strong>Web application</strong>.</li>
								<li>Under <strong>Authorized JavaScript origins</strong>, add:
									<br /><code>https://coderhd.github.io</code>
									<br /><code>http://localhost:3000</code>
								</li>
								<li>Click <strong>Create</strong>, copy the Client ID, and paste it in the field above.</li>
							</ol>
						</div>
					)}

					{lastSyncedAt && (
						<div className={styles.driveSyncMeta}>
							<span>
								Last Synced: {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(lastSyncedAt).toLocaleDateString()})
							</span>
							<span>Storage File: <code>wellwisher-state.json</code> (Hidden appDataFolder)</span>
						</div>
					)}

					<div className={styles.driveActionsRow}>
						{!isDriveConnected ? (
							<button
								type='button'
								className={`${styles.actionButton} ${styles.driveButtonPrimary}`}
								onClick={handleConnectGoogleDrive}
								disabled={isSyncing}
							>
								{isSyncing ? 'Connecting...' : 'Connect Google Drive'}
							</button>
						) : (
							<>
								<button
									type='button'
									className={`${styles.actionButton} ${styles.actionButtonSubtle}`}
									onClick={handleSyncNow}
									disabled={isSyncing}
									aria-label='Sync now with Google Drive'
								>
									{isSyncing ? 'Syncing...' : 'Sync Now'}
								</button>

								<button
									type='button'
									className={`${styles.actionButton} ${styles.actionButtonDanger}`}
									onClick={handleDisconnectGoogleDrive}
									aria-label='Disconnect Google Drive'
								>
									Disconnect
								</button>

								<label
									className={styles.checkboxLabel}
									style={{ marginLeft: 'var(--ww-space-2)' }}
								>
									<input
										type='checkbox'
										className={styles.checkbox}
										checked={isAutoSyncEnabled}
										onChange={handleToggleAutoSync}
									/>
									<span style={{ fontSize: '0.8125rem' }}>
										Auto-sync changes
									</span>
								</label>
							</>
						)}
					</div>
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
							<h3 className={styles.dataActionTitle}>Reset to Default</h3>
							<p className={styles.dataActionDesc}>
								Clear local data and launch the first-class landing page onboarding
								flow afresh.
							</p>
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ww-space-2)' }}>
							<button
								type='button'
								className={`${styles.actionButton} ${styles.actionButtonDanger}`}
								onClick={handleResetToDefault}
							>
								Reset to Default (Onboarding)
							</button>
							<button
								type='button'
								className={`${styles.actionButton} ${styles.actionButtonSubtle}`}
								onClick={handleQuickResetDemo}
								style={{ fontSize: '0.75rem', padding: 'var(--ww-space-1) var(--ww-space-2)' }}
							>
								Quick Reset to Demo Baseline
							</button>
						</div>
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
