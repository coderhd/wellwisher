import { expect, test } from '@playwright/test'

test.describe('Wellwisher Focus & Restorative Completion Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Clear local storage to ensure fresh session
		await page.goto('/today')
		await page.evaluate(() => {
			window.localStorage.clear()
		})
		await page.reload()
	})

	test('starts focus session from Today recommendation, pauses/resumes, completes to restorative state with zero gamification', async ({
		page,
	}) => {
		// 1. Open Today and verify initial recommendation
		await page.goto('/today')
		await expect(page).toHaveURL(/\/today/)

		const startFocusButton = page.getByRole('button', {
			name: /Start focus · 90 min/i,
		})
		await expect(startFocusButton).toBeVisible()

		// 2. Start focus session
		await startFocusButton.click()

		// Verify active focus session panel is visible
		const focusPanel = page.getByRole('region', {
			name: 'Active focus session',
		})
		await expect(focusPanel).toBeVisible()
		await expect(
			focusPanel.getByRole('heading', { level: 2 }),
		).toHaveText('AI Engineering')
		await expect(focusPanel).toContainText('In progress')
		await expect(focusPanel).toContainText('remaining')

		// Test pause and resume
		const pauseButton = focusPanel.getByRole('button', {
			name: 'Pause session',
		})
		await expect(pauseButton).toBeVisible()
		await pauseButton.click()
		await expect(focusPanel).toContainText('Paused')

		const resumeButton = focusPanel.getByRole('button', {
			name: 'Resume session',
		})
		await expect(resumeButton).toBeVisible()
		await resumeButton.click()
		await expect(focusPanel).toContainText('In progress')

		// 3. Complete focus session
		const completeButton = focusPanel.getByRole('button', {
			name: 'Complete session',
		})
		await expect(completeButton).toBeVisible()
		await completeButton.click()

		// 4. Verify Restorative Completion State
		const completionCard = page.getByRole('region', {
			name: "Today's completion",
		})
		await expect(completionCard).toBeVisible()

		// Affirmation and evidence
		await expect(
			completionCard.getByRole('heading', { level: 2 }),
		).toHaveText("You've completed your focus intention for today.")
		await expect(completionCard).toContainText('AI Engineering')
		await expect(completionCard).toContainText('90 min focused')

		// Next protected anchor
		await expect(completionCard).toContainText('Next Protected Anchor')

		// Primary recommended action: Rest now
		const restButton = completionCard.getByRole('button', {
			name: /Rest now \(recommended\)/i,
		})
		await expect(restButton).toBeVisible()
		await expect(restButton).toContainText('Recommended')

		// Optional alternative action: Choose something else
		const chooseAnotherButton = completionCard.getByRole('button', {
			name: 'Choose something else',
		})
		await expect(chooseAnotherButton).toBeVisible()

		// Quiet summary copy
		await expect(completionCard).toContainText(
			"No extra tasks have been added. Your day's core focus is complete.",
		)

		// 5. Verify absolute absence of gamification pressure
		// No confetti, streaks, XP, levels, points, or scores
		await expect(page.locator('body')).not.toContainText(/streak/i)
		await expect(page.locator('body')).not.toContainText(/\bxp\b/i)
		await expect(page.locator('body')).not.toContainText(/points/i)
		await expect(page.locator('body')).not.toContainText(/level up/i)
		await expect(page.locator('body')).not.toContainText(/leaderboard/i)

		// 6. Test "Choose something else" resets back to actionable state
		await chooseAnotherButton.click()
		await expect(completionCard).not.toBeVisible()
		await expect(
			page.getByRole('region', { name: "Today's recommendation" }),
		).toBeVisible()
	})
})
