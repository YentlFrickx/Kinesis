import { expect, test } from '@playwright/test'

// Playwright's offline emulation and request routing both intercept navigations before the service
// worker, so a true offline reload can't be driven reliably. Instead verify the service worker is
// active and has precached the app shell and its assets, which is what makes offline loads work.
test('service worker controls the page and precaches the app shell', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)

  const cached = await page.evaluate(async () => {
    const urls: string[] = []
    for (const name of await caches.keys()) for (const r of await (await caches.open(name)).keys()) urls.push(new URL(r.url).pathname)
    return urls
  })
  expect(cached.some((u) => u === '/index.html' || u === '/')).toBe(true)
  expect(cached.some((u) => u.endsWith('.js'))).toBe(true)
  expect(cached.some((u) => u.endsWith('.css'))).toBe(true)
})
