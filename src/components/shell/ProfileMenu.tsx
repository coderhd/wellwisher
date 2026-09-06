'use client'

import React, { useEffect, useRef, useState } from 'react'
import styles from './HeaderNav.module.css'

export function ProfileMenu (): React.JSX.Element {
	const [isOpen, setIsOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	const handleToggle = () => {
		setIsOpen((prev) => !prev)
	}

	const handleClose = () => {
		setIsOpen(false)
	}

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsOpen(false)
			}
		}

		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown)
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

	return (
		<div className={styles.profileContainer} ref={menuRef}>
			<button
				type='button'
				className={styles.profileButton}
				onClick={handleToggle}
				aria-haspopup='menu'
				aria-expanded={isOpen}
				aria-label='Profile and settings'
			>
				HD
			</button>

			{isOpen && (
				<div
					className={styles.dropdown}
					role='menu'
					aria-label='User settings menu'
				>
					<div className={styles.dropdownHeader}>
						<p className={styles.profileName}>Harsh Dave</p>
						<p className={styles.profileEmail}>Personal Cockpit</p>
					</div>

					<button
						type='button'
						role='menuitem'
						className={styles.menuItem}
						onClick={handleClose}
					>
						Settings
					</button>

					<button
						type='button'
						role='menuitem'
						className={styles.menuItem}
						onClick={handleClose}
					>
						Voice preferences
					</button>

					<div className={styles.menuDivider} />

					<button
						type='button'
						role='menuitem'
						className={`${styles.menuItem} ${styles.menuItemSubtle}`}
						onClick={handleClose}
					>
						Reset demo scenario
					</button>
				</div>
			)}
		</div>
	)
}
