import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	requestGoogleDriveToken,
	uploadStateToDrive,
	downloadStateFromDrive,
} from '../../src/services/googleDriveClient'
import { createDemoState } from '../../src/data/demoScenario'

describe('googleDriveClient', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('requests token via GIS token client', async () => {
		const mockRequestAccessToken = vi.fn()
		const mockInitTokenClient = vi.fn().mockImplementation(({ callback }) => {
			// Simulate successful GIS token callback
			setTimeout(() => {
				callback({ access_token: 'mock-access-token-123' })
			}, 10)
			return { requestAccessToken: mockRequestAccessToken }
		})

		vi.stubGlobal('google', {
			accounts: {
				oauth2: {
					initTokenClient: mockInitTokenClient,
				},
			},
		})

		const token = await requestGoogleDriveToken('test-client-id.apps.googleusercontent.com')
		expect(token).toBe('mock-access-token-123')
		expect(mockInitTokenClient).toHaveBeenCalledWith(
			expect.objectContaining({
				client_id: 'test-client-id.apps.googleusercontent.com',
				scope: 'https://www.googleapis.com/auth/drive.appdata',
			}),
		)
	})

	it('creates new file when none exists in appDataFolder', async () => {
		const mockState = createDemoState()
		const mockFetch = vi.fn()

		// 1st call: list files (empty)
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ files: [] }),
		})

		// 2nd call: create multipart file
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ id: 'new-file-id-456', modifiedTime: '2026-09-07T12:00:00.000Z' }),
		})

		vi.stubGlobal('fetch', mockFetch)

		const result = await uploadStateToDrive('mock-token', mockState)
		expect(result.fileId).toBe('new-file-id-456')
		expect(mockFetch).toHaveBeenCalledTimes(2)
		expect(mockFetch.mock.calls[1][0]).toContain('uploadType=multipart')
	})

	it('updates existing file when found in appDataFolder', async () => {
		const mockState = createDemoState()
		const mockFetch = vi.fn()

		// 1st call: list files (found existing)
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ files: [{ id: 'existing-file-789' }] }),
		})

		// 2nd call: PATCH update
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ id: 'existing-file-789', modifiedTime: '2026-09-07T12:05:00.000Z' }),
		})

		vi.stubGlobal('fetch', mockFetch)

		const result = await uploadStateToDrive('mock-token', mockState)
		expect(result.fileId).toBe('existing-file-789')
		expect(mockFetch.mock.calls[1][0]).toContain('existing-file-789?uploadType=media')
	})

	it('downloads state from existing file in appDataFolder', async () => {
		const mockState = createDemoState()
		const mockFetch = vi.fn()

		// 1st call: list files
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ files: [{ id: 'existing-file-789' }] }),
		})

		// 2nd call: GET alt=media
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockState,
		})

		vi.stubGlobal('fetch', mockFetch)

		const downloaded = await downloadStateFromDrive('mock-token')
		expect(downloaded).toEqual(mockState)
	})
})
