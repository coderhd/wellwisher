import React from 'react'

import type { RhythmAnchor } from '../../domain/planning/types'

export interface RhythmAnchorCardProps {
	anchor: RhythmAnchor
	className?: string
}

function formatRepeat (repeat: RhythmAnchor['repeat']): string {
	switch (repeat.type) {
		case 'daily': {
			return 'Daily'
		}
		case 'weekdays': {
			return 'Working days (Mon-Fri)'
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

export function RhythmAnchorCard ({
	anchor,
	className,
}: RhythmAnchorCardProps): React.JSX.Element {
	const cardClasses = ['rhythmAnchorCard', className ?? '']
		.filter(Boolean)
		.join(' ')

	return (
		<div
			className={cardClasses}
			data-testid={`rhythm-anchor-${anchor.id}`}
		>
			<div className='rhythmHeader'>
				<h4 className='rhythmTitle'>{anchor.title}</h4>
				{anchor.protected && (
					<span className='badge badgeProtected'>Protected</span>
				)}
			</div>
			<div className='rhythmMeta'>
				<span>
					{anchor.startTime} - {anchor.endTime}
				</span>
				<span>·</span>
				<span>{formatRepeat(anchor.repeat)}</span>
			</div>
		</div>
	)
}
