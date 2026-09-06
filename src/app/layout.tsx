import type { Metadata, Viewport } from 'next'
import React from 'react'
import { WellwisherProvider } from '../state/WellwisherProvider'
import './globals.css'

export const metadata: Metadata = {
	title: 'Wellwisher',
	description: 'A calm personal planning companion.',
	manifest: '/manifest.webmanifest',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Wellwisher',
	},
	icons: {
		icon: '/icons/icon-192.png',
		apple: '/icons/icon-192.png',
	},
}

export const viewport: Viewport = {
	themeColor: '#121820',
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
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
