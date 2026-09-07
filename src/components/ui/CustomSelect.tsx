'use client'

import React, { useEffect, useId, useRef, useState } from 'react'

import styles from './CustomSelect.module.css'

export interface CustomSelectOption {
	value: string
	label: string
	disabled?: boolean
}

export interface CustomSelectProps {
	id?: string
	value: string
	onChange: (value: string) => void
	options: CustomSelectOption[]
	placeholder?: string
	disabled?: boolean
	ariaLabel?: string
	className?: string
}

export function CustomSelect ({
	id,
	value,
	onChange,
	options,
	placeholder = 'Select an option...',
	disabled = false,
	ariaLabel,
	className = '',
}: CustomSelectProps): React.JSX.Element {
	const [isOpen, setIsOpen] = useState(false)
	const [highlightedIndex, setHighlightedIndex] = useState(-1)
	const containerRef = useRef<HTMLDivElement>(null)
	const listboxId = useId()

	const selectedOption = options.find((opt) => opt.value === value)

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

	function handleKeyDown (event: React.KeyboardEvent) {
		if (disabled) return

		if (event.key === 'Escape') {
			setIsOpen(false)
			return
		}

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			if (!isOpen) {
				setIsOpen(true)
			} else if (highlightedIndex >= 0 && options[highlightedIndex]) {
				const opt = options[highlightedIndex]
				if (opt && !opt.disabled) {
					onChange(opt.value)
					setIsOpen(false)
				}
			}
			return
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault()
			if (!isOpen) {
				setIsOpen(true)
				setHighlightedIndex(0)
			} else {
				setHighlightedIndex((prev) => (prev + 1) % options.length)
			}
		} else if (event.key === 'ArrowUp') {
			event.preventDefault()
			if (!isOpen) {
				setIsOpen(true)
				setHighlightedIndex(options.length - 1)
			} else {
				setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length)
			}
		}
	}

	function handleOptionClick (opt: CustomSelectOption) {
		if (opt.disabled) return
		onChange(opt.value)
		setIsOpen(false)
	}

	return (
		<div
			ref={containerRef}
			className={`${styles.container} ${className}`}
			onKeyDown={handleKeyDown}
		>
			<button
				id={id}
				type='button'
				role='combobox'
				aria-expanded={isOpen}
				aria-haspopup='listbox'
				aria-controls={listboxId}
				aria-label={ariaLabel || selectedOption?.label || placeholder}
				disabled={disabled}
				className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
				onClick={() => setIsOpen((prev) => !prev)}
			>
				<span className={styles.labelWrapper}>
					{selectedOption ? (
						selectedOption.label
					) : (
						<span className={styles.placeholder}>{placeholder}</span>
					)}
				</span>
				<span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
					<svg
						width='14'
						height='14'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
					>
						<polyline points='6 9 12 15 18 9' />
					</svg>
				</span>
			</button>

			{isOpen && (
				<ul
					id={listboxId}
					role='listbox'
					className={styles.dropdown}
					aria-label={ariaLabel || 'Options'}
				>
					{options.map((opt, index) => {
						const isSelected = opt.value === value
						const isHighlighted = index === highlightedIndex

						return (
							<li
								key={opt.value}
								role='option'
								aria-selected={isSelected}
								className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${isHighlighted ? styles.optionHighlighted : ''}`}
								onClick={() => handleOptionClick(opt)}
								onMouseEnter={() => setHighlightedIndex(index)}
							>
								<span>{opt.label}</span>
								{isSelected && (
									<span className={styles.checkIcon}>
										<svg
											width='14'
											height='14'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.5'
											strokeLinecap='round'
											strokeLinejoin='round'
										>
											<polyline points='20 6 9 17 4 12' />
										</svg>
									</span>
								)}
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}
