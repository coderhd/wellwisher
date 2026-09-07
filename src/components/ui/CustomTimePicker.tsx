'use client'

import React, { useEffect, useRef, useState } from 'react'

import styles from './CustomTimePicker.module.css'

export interface CustomTimePickerProps {
	id?: string
	value: string // 'HH:mm' format (e.g. '08:30' or '13:30')
	onChange: (value: string) => void
	disabled?: boolean
	ariaLabel?: string
	className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

export function CustomTimePicker ({
	id,
	value,
	onChange,
	disabled = false,
	ariaLabel = 'Select time',
	className = '',
}: CustomTimePickerProps): React.JSX.Element {
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const [currentHour, currentMinute] = (value || '08:00').split(':')
	const validHour = currentHour ? currentHour.padStart(2, '0') : '08'
	const validMinute = currentMinute ? currentMinute.padStart(2, '0') : '00'

	useEffect(() => {
		function handleClickOutside (event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		function handleGlobalKeyDown (event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			document.addEventListener('keydown', handleGlobalKeyDown)
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleGlobalKeyDown)
		}
	}, [isOpen])

	function handleHourSelect (hour: string) {
		onChange(`${hour}:${validMinute}`)
	}

	function handleMinuteSelect (minute: string) {
		onChange(`${validHour}:${minute}`)
	}

	return (
		<div
			ref={containerRef}
			className={`${styles.container} ${className}`}
		>
			<button
				id={id}
				type='button'
				aria-expanded={isOpen}
				aria-haspopup='dialog'
				aria-label={`${ariaLabel}: ${validHour}:${validMinute}`}
				disabled={disabled}
				className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
				onClick={() => setIsOpen((prev) => !prev)}
			>
				<span>{`${validHour}:${validMinute}`}</span>
				<span className={styles.clockIcon}>
					<svg
						width='15'
						height='15'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
					>
						<circle cx='12' cy='12' r='10' />
						<polyline points='12 6 12 12 16 14' />
					</svg>
				</span>
			</button>

			{isOpen && (
				<div
					role='dialog'
					aria-label={ariaLabel}
					className={styles.popover}
				>
					<div className={styles.columnsWrapper}>
						{/* Hour column */}
						<div className={styles.column}>
							<span className={styles.columnHeader}>Hour</span>
							{HOURS.map((h) => {
								const isSelected = h === validHour
								return (
									<button
										key={h}
										type='button'
										aria-label={`Hour ${h}`}
										data-testid={`hour-${h}`}
										className={`${styles.timePill} ${isSelected ? styles.timePillSelected : ''}`}
										onClick={() => handleHourSelect(h)}
									>
										{h}
									</button>
								)
							})}
						</div>

						{/* Minute column */}
						<div className={styles.column}>
							<span className={styles.columnHeader}>Min</span>
							{MINUTES.map((m) => {
								const isSelected = m === validMinute
								return (
									<button
										key={m}
										type='button'
										aria-label={`Minute ${m}`}
										data-testid={`minute-${m}`}
										className={`${styles.timePill} ${isSelected ? styles.timePillSelected : ''}`}
										onClick={() => handleMinuteSelect(m)}
									>
										{m}
									</button>
								)
							})}
						</div>
					</div>

					<div className={styles.footerRow}>
						<button
							type='button'
							className={styles.doneButton}
							onClick={() => setIsOpen(false)}
						>
							Done
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
