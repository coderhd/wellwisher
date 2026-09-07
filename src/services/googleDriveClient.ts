/**
 * Google Drive Client Service for Wellwisher
 * Uses Google Identity Services (GIS) Token Client and Google Drive v3 REST API
 * to sync state to the user's hidden appDataFolder.
 */

import type { WellwisherState } from '../state/reducer'

declare global {
	interface Window {
		google?: {
			accounts: {
				oauth2: {
					initTokenClient: (config: {
						client_id: string
						scope: string
						callback: (response: {
							access_token?: string
							error?: string
							error_description?: string
						}) => void
					}) => {
						requestAccessToken: (options?: { prompt?: string }) => void
					}
				}
			}
		}
	}
}

const DRIVE_FILE_NAME = 'wellwisher-state.json'
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

/**
 * Ensures Google Identity Services script is loaded in the browser
 */
export async function loadGisScript (): Promise<void> {
	if (typeof window === 'undefined') return
	if (window.google?.accounts?.oauth2) return

	return new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)
		if (existing) {
			existing.addEventListener('load', () => resolve())
			existing.addEventListener('error', (err) => reject(err))
			return
		}

		const script = document.createElement('script')
		script.src = GIS_SCRIPT_URL
		script.async = true
		script.defer = true
		script.onload = () => resolve()
		script.onerror = (err) => reject(err)
		document.head.appendChild(script)
	})
}

/**
 * Initializes GIS Token Client and prompts for authorization
 */
export async function requestGoogleDriveToken (
	clientId: string,
): Promise<string> {
	await loadGisScript()

	if (!window.google?.accounts?.oauth2) {
		throw new Error('Google Identity Services script failed to initialize')
	}

	return new Promise((resolve, reject) => {
		const tokenClient = window.google!.accounts.oauth2.initTokenClient({
			client_id: clientId,
			scope: 'https://www.googleapis.com/auth/drive.appdata',
			callback: (response) => {
				if (response.error) {
					reject(
						new Error(
							response.error_description ||
								`OAuth error: ${response.error}`,
						),
					)
					return
				}
				if (response.access_token) {
					resolve(response.access_token)
				} else {
					reject(new Error('No access token received from Google'))
				}
			},
		})

		tokenClient.requestAccessToken({ prompt: 'consent' })
	})
}

/**
 * Finds the state file in the private appDataFolder
 */
async function findDriveStateFile (
	accessToken: string,
): Promise<string | null> {
	const res = await fetch(
		`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${DRIVE_FILE_NAME}' and trashed=false&fields=files(id, name, modifiedTime)`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	)

	if (!res.ok) {
		const errorText = await res.text()
		throw new Error(`Drive list error (${res.status}): ${errorText}`)
	}

	const data = await res.json()
	if (data.files && data.files.length > 0) {
		return data.files[0].id
	}
	return null
}

/**
 * Uploads (creates or updates) Wellwisher state to Google Drive appDataFolder
 */
export async function uploadStateToDrive (
	accessToken: string,
	state: WellwisherState,
): Promise<{ fileId: string; modifiedTime: string }> {
	const fileId = await findDriveStateFile(accessToken)
	const jsonContent = JSON.stringify(state, null, 2)

	if (fileId) {
		// Update existing file content
		const res = await fetch(
			`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: jsonContent,
			},
		)

		if (!res.ok) {
			const errorText = await res.text()
			throw new Error(`Drive update error (${res.status}): ${errorText}`)
		}

		const data = await res.json()
		return {
			fileId: data.id || fileId,
			modifiedTime: data.modifiedTime || new Date().toISOString(),
		}
	} else {
		// Create new file with multipart body in appDataFolder
		const metadata = {
			name: DRIVE_FILE_NAME,
			parents: ['appDataFolder'],
			mimeType: 'application/json',
		}

		const boundary = '-------314159265358979323846'
		const delimiter = `\r\n--${boundary}\r\n`
		const closeDelimiter = `\r\n--${boundary}--`

		const multipartBody =
			delimiter +
			'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
			JSON.stringify(metadata) +
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			jsonContent +
			closeDelimiter

		const res = await fetch(
			'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': `multipart/related; boundary=${boundary}`,
				},
				body: multipartBody,
			},
		)

		if (!res.ok) {
			const errorText = await res.text()
			throw new Error(`Drive create error (${res.status}): ${errorText}`)
		}

		const data = await res.json()
		return {
			fileId: data.id,
			modifiedTime: data.modifiedTime || new Date().toISOString(),
		}
	}
}

/**
 * Downloads Wellwisher state from Google Drive appDataFolder
 */
export async function downloadStateFromDrive (
	accessToken: string,
): Promise<WellwisherState | null> {
	const fileId = await findDriveStateFile(accessToken)
	if (!fileId) {
		return null
	}

	const res = await fetch(
		`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	)

	if (!res.ok) {
		const errorText = await res.text()
		throw new Error(`Drive download error (${res.status}): ${errorText}`)
	}

	const state = await res.json()
	return state as WellwisherState
}
