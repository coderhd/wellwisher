import React from 'react'

import { AppShell } from '../../components/shell/AppShell'
import { SettingsSurface } from './SettingsSurface'

export default function SettingsPage (): React.JSX.Element {
	return (
		<AppShell activeSurface='settings'>
			<SettingsSurface />
		</AppShell>
	)
}
