'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createDemoState } from '../../data/demoScenario'
import type { RhythmAnchor } from '../../domain/planning/types'
import { saveState } from '../../state/persistence'
import type { WellwisherState } from '../../state/reducer'
import { useWellwisher } from '../../state/WellwisherProvider'
import { CustomTimePicker } from '../ui/CustomTimePicker'
import styles from './OnboardingFlow.module.css'

const DEFAULT_ANCHORS: RhythmAnchor[] = [
	{
		id: 'anchor-morning',
		title: 'Morning rhythm & contemplation',
		startTime: '06:30',
		endTime: '08:30',
		repeat: { type: 'daily' },
		protected: true,
	},
	{
		id: 'anchor-lunch',
		title: 'Lunch & Disconnect',
		startTime: '13:30',
		endTime: '14:30',
		repeat: { type: 'daily' },
		protected: true,
	},
	{
		id: 'anchor-sunset',
		title: 'Sunset & Calm place',
		startTime: '18:00',
		endTime: '20:00',
		repeat: { type: 'daily' },
		protected: true,
	},
	{
		id: 'anchor-gym',
		title: 'Evening gym & physical training',
		startTime: '20:00',
		endTime: '21:00',
		repeat: { type: 'weekdays' },
		protected: true,
	},
	{
		id: 'anchor-dinner',
		title: 'Dinner & wind down',
		startTime: '21:00',
		endTime: '22:00',
		repeat: { type: 'daily' },
		protected: true,
	},
]

export function OnboardingFlow (): React.JSX.Element {
	const router = useRouter()
	const { dispatch } = useWellwisher()

	const [step, setStep] = useState<number>(1)
	const [userName, setUserName] = useState<string>('Harsh')
	const [availableStart, setAvailableStart] = useState<string>('08:00')
	const [availableEnd, setAvailableEnd] = useState<string>('22:00')
	const [anchors] = useState<RhythmAnchor[]>(DEFAULT_ANCHORS)
	const [baselineChoice, setBaselineChoice] = useState<'clean' | 'demo'>('clean')

	function handleNext () {
		if (step < 4) {
			setStep((prev) => prev + 1)
		} else {
			handleComplete()
		}
	}

	function handleBack () {
		if (step > 1) {
			setStep((prev) => prev - 1)
		}
	}

	function handleComplete () {
		let initialState: WellwisherState

		if (baselineChoice === 'demo') {
			initialState = createDemoState()
			// Apply personalized bounds and anchors
			initialState = {
				...initialState,
				scheduleBounds: {
					availableStart,
					availableEnd,
				},
			}
		} else {
			// Clean baseline
			const today = new Date()
			const dayOfWeek = today.getDay()
			const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
			const monday = new Date(today.setDate(diff))
			const weekStartStr = monday.toISOString().slice(0, 10)

			initialState = {
				weekStart: weekStartStr,
				anchors,
				protectedCommitments: [],
				intentions: [],
				allocations: [],
				focusSession: {
					status: 'idle',
					intentionId: '',
					elapsedSeconds: 0,
					targetSeconds: 90 * 60,
				},
				voicePreferences: {
					muted: false,
					autoPlay: false,
					speed: 1,
				},
				scheduleBounds: {
					availableStart,
					availableEnd,
				},
				lastPlanChange: null,
			}
		}

		saveState(initialState)
		dispatch({
			type: 'IMPORT_STATE',
			payload: initialState,
		})

		router.push('/today')
	}

	return (
		<main className={styles.wrapper}>
			<div className={styles.card}>
				<div className={styles.stepIndicator}>
					<div className={styles.stepPills}>
						{[1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className={`${styles.stepDot} ${
									i === step
										? styles.stepDotActive
										: i < step
											? styles.stepDotCompleted
											: ''
								}`}
							/>
						))}
					</div>
					<span className={styles.stepLabel}>Step {step} of 4</span>
				</div>

				{step === 1 && (
					<div className={styles.contentBody}>
						<p className={styles.kicker}>Welcome to Wellwisher</p>
						<h1 className={styles.heading}>Deliberate, calm planning.</h1>
						<p className={styles.description}>
							Wellwisher is a personal cockpit engineered around your natural rhythms,
							first-class leisure, and zero artificial gamification.
						</p>

						<div className={styles.fieldGroup} style={{ marginTop: 'var(--ww-space-3)' }}>
							<label htmlFor='user-name' className={styles.label}>
								What should companion voice call you?
							</label>
							<input
								id='user-name'
								type='text'
								className={styles.input}
								value={userName}
								onChange={(e) => setUserName(e.target.value)}
								placeholder='e.g., Harsh'
							/>
						</div>
					</div>
				)}

				{step === 2 && (
					<div className={styles.contentBody}>
						<p className={styles.kicker}>Day Boundaries</p>
						<h1 className={styles.heading}>Your daily scheduling window.</h1>
						<p className={styles.description}>
							Define the earliest start and latest finish times. Wellwisher preserves your
							breathing room before and after these bounds.
						</p>

						<div className={styles.boundsGrid} style={{ marginTop: 'var(--ww-space-3)' }}>
							<div className={styles.fieldGroup}>
								<label htmlFor='start-time' className={styles.label}>
									Earliest Start
								</label>
								<CustomTimePicker
									id='start-time'
									value={availableStart}
									ariaLabel='Earliest available start time'
									onChange={(val) => setAvailableStart(val)}
								/>
							</div>

							<div className={styles.fieldGroup}>
								<label htmlFor='end-time' className={styles.label}>
									Latest Finish
								</label>
								<CustomTimePicker
									id='end-time'
									value={availableEnd}
									ariaLabel='Latest available finish time'
									onChange={(val) => setAvailableEnd(val)}
								/>
							</div>
						</div>
					</div>
				)}

				{step === 3 && (
					<div className={styles.contentBody}>
						<p className={styles.kicker}>Master Anchors</p>
						<h1 className={styles.heading}>Foundational rhythm anchors.</h1>
						<p className={styles.description}>
							Recurring protected commitments that establish your weekly cadence and protect
							essential rest, meals, and contemplation.
						</p>

						<div className={styles.anchorsList}>
							{anchors.map((anchor) => (
								<div key={anchor.id} className={styles.anchorItem}>
									<span className={styles.anchorTitle}>{anchor.title}</span>
									<span className={styles.anchorTimes}>
										{anchor.startTime} – {anchor.endTime}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{step === 4 && (
					<div className={styles.contentBody}>
						<p className={styles.kicker}>Starting Baseline</p>
						<h1 className={styles.heading}>Choose how to start.</h1>
						<p className={styles.description}>
							You can start with a clean schedule tailored to you, or load a curated demo
							baseline with sample intentions.
						</p>

						<div className={styles.optionsGrid} style={{ marginTop: 'var(--ww-space-2)' }}>
							<button
								type='button'
								className={`${styles.choiceCard} ${
									baselineChoice === 'clean' ? styles.choiceCardSelected : ''
								}`}
								onClick={() => setBaselineChoice('clean')}
							>
								<h2 className={styles.choiceTitle}>Start Clean</h2>
								<p className={styles.choiceDescription}>
									Fresh slate with your configured anchors and schedule bounds. Ideal for real
									daily use.
								</p>
							</button>

							<button
								type='button'
								className={`${styles.choiceCard} ${
									baselineChoice === 'demo' ? styles.choiceCardSelected : ''
								}`}
								onClick={() => setBaselineChoice('demo')}
							>
								<h2 className={styles.choiceTitle}>Load Demo Baseline</h2>
								<p className={styles.choiceDescription}>
									Pre-loaded with curated work & leisure intentions (AI Engineering, Deep Walk,
									etc.).
								</p>
							</button>
						</div>
					</div>
				)}

				<div className={styles.actions}>
					{step > 1 ? (
						<button
							type='button'
							className={styles.secondaryButton}
							onClick={handleBack}
						>
							Back
						</button>
					) : <div />}

					<button
						type='button'
						className={styles.primaryButton}
						onClick={handleNext}
					>
						{step === 4 ? 'Enter Cockpit' : 'Continue'}
					</button>
				</div>
			</div>
		</main>
	)
}
