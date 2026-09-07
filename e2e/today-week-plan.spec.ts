import { expect, test } from '@playwright/test'

test.describe('Wellwisher Primary Flow: Today -> Week -> Day Detail -> Plan -> Undo', () => {
	test.beforeEach(async ({ page }) => {
		// Clear local storage before each test to start from clean demo scenario
		await page.goto('/today')
		await page.evaluate(() => {
			window.localStorage.clear()
		})
		await page.reload()
	})

	test('navigates through Today, Week, Day detail, and modifies Plan with drag, pin, and undo', async ({
		page,
	}) => {
		// 1. Open /today and verify exactly one recommendation
		await page.goto('/today')
		await expect(page).toHaveURL(/\/today/)

		const recSection = page.getByRole('region', {
			name: "Today's recommendation",
		})
		await expect(recSection).toBeVisible()
		await expect(
			recSection.getByRole('heading', { level: 2 }),
		).toHaveText('AI Engineering')
		await expect(recSection).toContainText('90 min')
		await expect(recSection).toContainText('Start with AI Engineering')

		// 2. Open Week and select a day to view Day detail
		const weekNavLink = page
			.getByRole('navigation', { name: 'Main Navigation' })
			.getByRole('link', { name: 'Week', exact: true })
		await weekNavLink.click()
		await expect(page).toHaveURL(/\/week/)

		// Verify week allocation summary banner
		const weekSummary = page.getByRole('region', {
			name: 'Week allocation summary',
		})
		await expect(weekSummary).toBeVisible()
		await expect(weekSummary).toContainText('Total Protected')
		await expect(weekSummary).toContainText('Total Suggested')
		await expect(weekSummary).toContainText('Total Open Capacity')

		// Verify 7-day columns are rendered
		const tueColumn = page.getByTestId('day-column-2026-09-08')
		await expect(tueColumn).toBeVisible()

		// Click on Tuesday header to open Day detail
		const tueLink = tueColumn.getByRole('link', {
			name: /View day detail for Tuesday/i,
		})
		await tueLink.click()
		await expect(page).toHaveURL(/\/day\/2026-09-08/, { timeout: 15000 })

		const daySurface = page.getByTestId('day-surface')
		await expect(daySurface).toBeVisible()
		await expect(
			daySurface.getByRole('heading', { level: 1 }),
		).toContainText('Tuesday, September 8')
		await expect(daySurface).toContainText('Day capacity')

		// 3. Open Plan surface
		const planNavLink = page
			.getByRole('navigation', { name: 'Main Navigation' })
			.getByRole('link', { name: 'Plan', exact: true })
		await planNavLink.click()
		await expect(page).toHaveURL(/\/plan/, { timeout: 15000 })

		const planner = page.getByTestId('allocation-board')
		await expect(planner).toBeVisible()
		await expect(
			planner.getByRole('heading', { level: 1 }),
		).toContainText('Planner & Allocation Board')

		// Verify guidance copy
		await expect(planner).toContainText(
			'These are suggestions, not commitments. Pin to a time after placing.',
		)

		// 4. Place a leisure intention (e.g. Walk) into Tuesday afternoon window using accessible placement
		const walkCard = page.getByTestId('intention-card-walk').first()
		await expect(walkCard).toBeVisible()
		await expect(walkCard).toContainText('leisure')

		const select = walkCard.getByRole('combobox', {
			name: /Placement options for Walk/i,
		})
		await select.selectOption('2026-09-08:afternoon')

		// 5. Select Tuesday from the 7-day ribbon to view Tuesday canvas
		const tueRibbonPill = page.getByTestId('ribbon-day-2026-09-08')
		await expect(tueRibbonPill).toBeVisible()
		await tueRibbonPill.click()

		// Verify Tuesday focused canvas is active
		await expect(page.getByTestId('focused-day-2026-09-08')).toBeVisible()

		// Target window zone on Tuesday afternoon (open window: 14:30 - 18:00)
		const targetZone = page.getByTestId('drop-zone-2026-09-08-afternoon')
		await expect(targetZone).toBeVisible()

		// Verify the intention appears in the target drop zone and remains Suggested, not Pinned
		const placedWalk = targetZone.getByTestId('intention-card-walk')
		await expect(placedWalk).toBeVisible()
		await expect(placedWalk).toContainText('Suggested')
		await expect(placedWalk).not.toContainText('Pinned')
		await expect(placedWalk).toContainText('Afternoon window')

		// 6. Pin the allocation explicitly to a specific time within open capacity (e.g. 15:00)
		const pinButton = placedWalk.getByRole('button', {
			name: /Pin Walk to a time/i,
		})
		await expect(pinButton).toBeVisible()
		await pinButton.click()

		// Enter a start time (15:00) and confirm
		const timeInput = placedWalk.getByLabel('Start time')
		await expect(timeInput).toBeVisible()
		await timeInput.fill('15:00')

		const confirmPinButton = placedWalk.getByRole('button', {
			name: 'Confirm Pin',
		})
		await confirmPinButton.click()

		// Verify the allocation mode changed to Pinned with exact start time
		await expect(placedWalk).toContainText('Pinned')
		await expect(placedWalk).not.toContainText('Suggested')
		await expect(placedWalk).toContainText('15:00')

		// 7. Use Undo and verify the previous state returns (back to Suggested)
		const undoButton = page.getByRole('button', { name: 'Undo' })
		await expect(undoButton).toBeEnabled()
		await undoButton.click()

		// Verify that the walk card is back to Suggested mode
		await expect(placedWalk).toContainText('Suggested')
		await expect(placedWalk).not.toContainText('Pinned')
	})
})
