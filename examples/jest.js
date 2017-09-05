const puppeteer = require('puppeteer')

test('sets the browser title', async () => {
  const browser = await puppeteer.launch()

  const page = await browser.newPage()
  await page.goto('http://localhost:3000')
  const pageTitle = await page.title()
  expect(pageTitle).toBe('awesome page title')

  browser.close()
})
