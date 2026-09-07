import { expect, test } from '@playwright/test'

test.describe('Dynamic Management & Responsive Option C Planner E2E', () => {
	test.beforeEach(async ({ page }) => {
		// Clear local storage before each test for clean deterministic state
		await page.goto('/today')
		await page.evaluate(() => {
			window.localStorage.clear()
		})
		await page.reload()
	})

	test('creates custom intention, places it on focused day canvas, and switches days via 7-day ribbon', async ({
		page,
	}) => {
		// 1. Navigate to /plan
		await page.goto('/plan')
		await expect(page).toHaveURL(/\/plan/)

		const board = page.getByTestId('allocation-board')
		await expect(board).toBeVisible()

		// Verify 7-day ribbon navigation and default Monday selection
		const monRibbonPill = page.getByTestId('ribbon-day-2026-09-07')
		await expect(monRibbonPill).toBeVisible()
		await expect(monRibbonPill).toHaveAttribute('aria-current', 'date')

		const focusedMonday = page.getByTestId('focused-day-2026-09-07')
		await expect(focusedMonday).toBeVisible()
		await expect(
			focusedMonday.getByRole('heading', { level: 2 }),
		).toHaveText('Monday')

		// 2. Open "+ Add Intention" modal
		const addIntentionButton = page.getByRole('button', {
			name: 'Add Intention',
		})
		await expect(addIntentionButton).toBeVisible()
		await addIntentionButton.click()

		const intentionModal = page.getByRole('dialog')
		await expect(intentionModal).toBeVisible()
		await expect(
			intentionModal.getByRole('heading', { level: 2 }),
		).toHaveText('New Intention')

		// 3. Fill intention details and submit
		const titleInput = intentionModal.getByLabel('Title')
		await titleInput.fill('Architectural Blueprint')

		// CustomSelect for Kind
		await intentionModal.getByRole('combobox', { name: /intention kind|kind/i }).click()
		await page.getByRole('option', { name: 'Work', exact: true }).click()

		// CustomSelect for Duration
		await intentionModal.getByRole('combobox', { name: /intention duration|duration/i }).click()
		await page.getByRole('option', { name: /60 min/i }).click()

		// CustomSelect for Preferred Window
		await intentionModal.getByRole('combobox', { name: /preferred window|window/i }).click()
		await page.getByRole('option', { name: 'Morning', exact: true }).click()

		// CustomSelect for Priority
		await intentionModal.getByRole('combobox', { name: /intention priority|priority/i }).click()
		await page.getByRole('option', { name: /1 \(highest\)/i }).click()

		const createButton = intentionModal.getByRole('button', {
			name: 'Create Intention',
		})
		await createButton.click()

		// Verify modal closes
		await expect(intentionModal).not.toBeVisible()

		// 4. Locate the newly created intention card in the unplaced shelf
		const shelfSection = page.getByRole('region', {
			name: 'Intention shelf',
		})
		await expect(shelfSection).toBeVisible()

		const newIntentionCard = shelfSection
			.locator('li')
			.filter({ hasText: 'Architectural Blueprint' })
			.first()
		await expect(newIntentionCard).toBeVisible()
		await expect(newIntentionCard).toContainText('work')
		await expect(newIntentionCard).toContainText('60 min')
		await expect(newIntentionCard).toContainText('P1')

		// 5. Place the intention on Monday morning using accessible placement select
		const placeSelect = newIntentionCard.getByRole('combobox', {
			name: /Placement options for Architectural Blueprint/i,
		})
		await placeSelect.click()
		await page.getByRole('option', { name: /mon.*morning/i }).click()

		// 6. Verify intention is now suggested inside Monday morning drop zone
		const monMorningZone = page.getByTestId('drop-zone-2026-09-07-morning')
		await expect(monMorningZone).toBeVisible()

		const placedCard = monMorningZone
			.locator('div')
			.filter({ hasText: 'Architectural Blueprint' })
			.first()
		await expect(placedCard).toBeVisible()
		await expect(placedCard).toContainText('Suggested')
		await expect(placedCard).not.toContainText('Pinned')

		// 7. Switch days using 7-day ribbon to Tuesday
		const tueRibbonPill = page.getByTestId('ribbon-day-2026-09-08')
		await expect(tueRibbonPill).toBeVisible()
		await tueRibbonPill.click()

		// Verify focused day canvas switches to Tuesday
		const focusedTuesday = page.getByTestId('focused-day-2026-09-08')
		await expect(focusedTuesday).toBeVisible()
		await expect(
			focusedTuesday.getByRole('heading', { level: 2 }),
		).toHaveText('Tuesday')
		await expect(focusedTuesday).toContainText('September 8, 2026')

		// Switch to Wednesday
		const wedRibbonPill = page.getByTestId('ribbon-day-2026-09-09')
		await expect(wedRibbonPill).toBeVisible()
		await wedRibbonPill.click()

		const focusedWednesday = page.getByTestId('focused-day-2026-09-09')
		await expect(focusedWednesday).toBeVisible()
		await expect(
			focusedWednesday.getByRole('heading', { level: 2 }),
		).toHaveText('Wednesday')

		// Switch back to Monday and verify placed intention is still rendered
		await monRibbonPill.click()
		await expect(focusedMonday).toBeVisible()
		await expect(
			monMorningZone.filter({ hasText: 'Architectural Blueprint' }),
		).toBeVisible()
	})

	test('navigates to settings, edits master rhythm anchor and schedule boundary, verifies sync', async ({
		page,
	}) => {
		// 1. Open /plan first to check initial rhythm anchor
		await page.goto('/plan')
		const rhythmShelf = page.getByRole('region', {
			name: 'Rhythm anchors',
		})
		await expect(rhythmShelf).toBeVisible()
		await expect(rhythmShelf).toContainText('Morning rhythm')
		await expect(rhythmShelf).toContainText('07:30 - 08:30')

		// 2. Navigate to /settings via profile dropdown menu
		const profileButton = page.getByRole('button', {
			name: 'Profile and settings',
		})
		await profileButton.click()

		const settingsMenuItem = page.getByRole('menuitem', {
			name: 'Settings',
		})
		await expect(settingsMenuItem).toBeVisible()
		await settingsMenuItem.click()

		await expect(page).toHaveURL(/\/settings/)
		await expect(
			page.getByRole('heading', { level: 1, name: 'Settings' }),
		).toBeVisible()

		// 3. Edit "Morning rhythm" anchor in Master Rhythm Anchors section
		const editAnchorButton = page.getByRole('button', {
			name: 'Edit Morning rhythm',
		})
		await expect(editAnchorButton).toBeVisible()
		await editAnchorButton.click()

		const anchorModal = page.getByRole('dialog')
		await expect(anchorModal).toBeVisible()
		await expect(
			anchorModal.getByRole('heading', { level: 2 }),
		).toHaveText('Edit Rhythm Anchor')

		const startTimeBtn = anchorModal.getByRole('button', { name: /anchor start time/i })
		await startTimeBtn.click()
		await page.getByTestId('hour-07').click()
		await page.getByTestId('minute-00').click()
		await page.getByRole('button', { name: /done/i }).click()

		const endTimeBtn = anchorModal.getByRole('button', { name: /anchor end time/i })
		await endTimeBtn.click()
		await page.getByTestId('hour-08').click()
		await page.getByTestId('minute-00').click()
		await page.getByRole('button', { name: /done/i }).click()

		const saveAnchorButton = anchorModal.getByRole('button', {
			name: 'Save Changes',
		})
		await saveAnchorButton.click()

		await expect(anchorModal).not.toBeVisible()

		// Verify updated timing is shown in settings anchor card
		const updatedAnchorCard = page
			.locator('section')
			.filter({ hasText: 'Master Rhythm Anchors' })
		await expect(updatedAnchorCard).toContainText('07:00 – 08:00')

		// 4. Edit Day Schedule Boundaries
		const startBoundBtn = page.getByRole('button', { name: /available start time/i })
		await startBoundBtn.click()
		await page.getByTestId('hour-07').click()
		await page.getByTestId('minute-00').click()
		await page.getByRole('button', { name: /done/i }).click()

		const endBoundBtn = page.getByRole('button', { name: /available end time/i })
		await endBoundBtn.click()
		await page.getByTestId('hour-23').click()
		await page.getByTestId('minute-00').click()
		await page.getByRole('button', { name: /done/i }).click()

		const saveBoundsButton = page.getByRole('button', {
			name: 'Save Boundaries',
		})
		await saveBoundsButton.click()

		const boundsStatus = page.getByRole('status')
		await expect(boundsStatus).toBeVisible()
		await expect(boundsStatus).toContainText(
			'Schedule boundaries saved successfully.',
		)

		// 5. Navigate back to /plan and verify sync
		const planNavLink = page
			.getByRole('navigation', { name: 'Main Navigation' })
			.getByRole('link', { name: 'Plan', exact: true })
		await planNavLink.click()
		await expect(page).toHaveURL(/\/plan/)

		// Check updated anchor in shelf
		const updatedRhythmShelf = page.getByRole('region', {
			name: 'Rhythm anchors',
		})
		await expect(updatedRhythmShelf).toContainText('Morning rhythm')
		await expect(updatedRhythmShelf).toContainText('07:00 - 08:00')

		// Check Monday canvas protected block reflects updated timing
		const monCanvas = page.getByTestId('focused-day-2026-09-07')
		await expect(monCanvas).toContainText('07:00 - 08:00 (Protected)')
	})

	test('renders responsive mobile layout (390px viewport) without horizontal overflow', async ({
		page,
	}) => {
		// Set mobile viewport (390px wide, e.g. iPhone 12/13/14)
		await page.setViewportSize({ width: 390, height: 844 })

		// 1. Visit /plan
		await page.goto('/plan')
		await expect(page).toHaveURL(/\/plan/)

		// Verify 7-day ribbon is visible
		const ribbon = page.getByRole('navigation', {
			name: 'Days of the week',
		})
		await expect(ribbon).toBeVisible()

		// Verify focused day canvas is visible
		const focusedDay = page.getByTestId('focused-day-2026-09-07')
		await expect(focusedDay).toBeVisible()

		// Verify no horizontal document overflow
		const planHasHorizontalOverflow = await page.evaluate(() => {
			return (
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth
			)
		})
		expect(planHasHorizontalOverflow).toBe(false)

		// 2. Open Add Intention modal on mobile viewport and verify accessibility
		const addBtn = page.getByRole('button', { name: 'Add Intention' })
		await addBtn.click()

		const modal = page.getByRole('dialog')
		await expect(modal).toBeVisible()

		// Verify modal title & submit button are visible within viewport
		await expect(
			modal.getByRole('heading', { level: 2 }),
		).toHaveText('New Intention')
		const submitBtn = modal.getByRole('button', {
			name: 'Create Intention',
		})
		await expect(submitBtn).toBeVisible()

		// Close modal via Escape key
		await page.keyboard.press('Escape')
		await expect(modal).not.toBeVisible()

		// 3. Switch day on mobile ribbon
		const tuePill = page.getByTestId('ribbon-day-2026-09-08')
		await expect(tuePill).toBeVisible()
		await tuePill.click()

		const focusedTue = page.getByTestId('focused-day-2026-09-08')
		await expect(focusedTue).toBeVisible()

		// 4. Visit /settings on mobile
		await page.goto('/settings')
		await expect(page).toHaveURL(/\/settings/)

		const settingsHasHorizontalOverflow = await page.evaluate(() => {
			return (
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth
			)
		})
		expect(settingsHasHorizontalOverflow).toBe(false)
	})
})
