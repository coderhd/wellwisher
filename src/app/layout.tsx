import type { Metadata } from 'next'
import React from 'react'
import { WellwisherProvider } from '../state/WellwisherProvider'
import './globals.css'

export const metadata: Metadata = {
	title: 'Wellwisher',
	description: 'A calm personal planning companion.',
	manifest: '/manifest.webmanifest',
}

export default function RootLayout ({
	children,
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return (
		<html lang='en'>
			<body>
				<WellwisherProvider>{children}</WellwisherProvider>
			</body>
		</html>
	)
}
