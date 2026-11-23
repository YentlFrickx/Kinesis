import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Serious/critical WCAG A/AA violations fail the run; no rules are exempted.

for (const [name, hash] of [['sessions', '#/'], ['library', '#/library'], ['history', '#/history']] as const) {
  test(`axe: ${name}`, async ({ page }) => {
    await page.goto(`/${hash}`)
    await expect(page.locator('main')).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(bad.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([])
  })
}
