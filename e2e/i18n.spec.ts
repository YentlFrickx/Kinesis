import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('Dutch browser', () => {
  test.use({ locale: 'nl-NL' })

  test('defaults to Dutch, localises exercises, and can switch to English', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
    await expect(page.getByRole('heading', { name: 'Trainingen', exact: true })).toBeVisible()
    await expect(page.getByText('Krachttraining (30 min)').first()).toBeVisible() // starter session name

    await page.getByRole('button', { name: 'Oefeningen' }).click()
    await expect(page.getByText('Bilbrug', { exact: true }).first()).toBeVisible()

    await page.goto('/#/')
    await page.getByRole('button', { name: 'Instellingen' }).click()
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Sessions', exact: true })).toBeVisible()
    await expect(page.getByText('Strength workout (30 min)').first()).toBeVisible()

    await page.reload() // the choice persists
    await expect(page.getByRole('heading', { name: 'Sessions', exact: true })).toBeVisible()
  })

  for (const [name, hash] of [['sessions', '#/'], ['library', '#/library'], ['history', '#/history']] as const) {
    test(`axe (nl): ${name}`, async ({ page }) => {
      await page.goto(`/${hash}`)
      await expect(page.locator('main')).toBeVisible()
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([])
    })
  }
})
