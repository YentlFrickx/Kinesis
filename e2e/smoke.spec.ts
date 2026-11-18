import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('first launch → create → play → history → export/import', async ({ page }, info) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sessions', exact: true })).toBeVisible()
  const cards = page.locator('.session-list > li')
  const starters = await cards.count()
  expect(starters).toBeGreaterThan(0) // seeded on first launch

  // Create a session and add exercises.
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Session name').fill('E2E session')
  await page.getByRole('button', { name: '+ Add exercises' }).click()
  await page.getByRole('button', { name: /^Add / }).first().click()
  await page.getByRole('button', { name: /^Add / }).nth(1).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.locator('[aria-label^="Move "]')).toHaveCount(4) // up + down for two items
  await page.getByRole('button', { name: '← Sessions' }).click()
  await expect(cards).toHaveCount(starters + 1)

  // Play it to completion by skipping through every step.
  await cards.filter({ hasText: 'E2E session' }).getByRole('button', { name: 'Start E2E session' }).click()
  const complete = page.getByRole('heading', { name: /Session complete/ })
  for (let i = 0; i < 100 && !(await complete.isVisible()); i++) {
    await page.getByRole('button', { name: /Skip/ }).click()
  }
  await expect(complete).toBeVisible()
  await page.getByRole('button', { name: 'Done', exact: true }).click()

  // Completion is recorded in History.
  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible()
  await expect(page.getByText('E2E session')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Remove E2E session/ })).toHaveCount(1)

  // Export, delete the session, re-import.
  await page.getByRole('button', { name: 'Sessions', exact: true }).click()
  await page.getByRole('button', { name: 'Settings' }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  const file = info.outputPath('export.json')
  await (await download).saveAs(file)
  const exported = await readFile(file, 'utf8')
  expect(JSON.parse(exported).sessions).toHaveLength(starters + 1)

  await page.keyboard.press('Escape')
  await cards.filter({ hasText: 'E2E session' }).getByRole('button', { name: 'More for E2E session' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('button', { name: 'Delete session' }).click()
  await expect(cards).toHaveCount(starters)
  await page.locator('input[type=file]').setInputFiles({ name: 'kinesis-sessions.json', mimeType: 'application/json', buffer: Buffer.from(exported) })
  await expect(page.getByRole('status')).toContainText(`Imported ${starters + 1} sessions.`)
  await expect(cards).toHaveCount(starters * 2 + 1)
})

test('rejects an invalid import file', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":1}') })
  await expect(page.getByRole('status')).toContainText('Import failed')
})
