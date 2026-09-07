import React from 'react'

import type { RhythmAnchor } from '../../domain/planning/types'

export interface RhythmAnchorCardProps {
	anchor: RhythmAnchor
	onEdit?: (anchor: RhythmAnchor) => void
	onDelete?: (anchorId: string) => void
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
	onEdit,
	onDelete,
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
				<div className='rhythmHeaderMain'>
					<h4 className='rhythmTitle'>{anchor.title}</h4>
					{anchor.protected && (
						<span className='badge badgeProtected'>Protected</span>
					)}
				</div>

				{(onEdit || onDelete) && (
					<div
						className='cardActions'
						onClick={(e) => e.stopPropagation()}
						onPointerDown={(e) => e.stopPropagation()}
					>
						{onEdit && (
							<button
								type='button'
								className='cardActionButton'
								aria-label={`Edit ${anchor.title}`}
								onClick={() => onEdit(anchor)}
							>
								Edit
							</button>
						)}
						{onDelete && (
							<button
								type='button'
								className='cardActionButton cardActionButtonDelete'
								aria-label={`Delete ${anchor.title}`}
								onClick={() => onDelete(anchor.id)}
							>
								Delete
							</button>
						)}
					</div>
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
