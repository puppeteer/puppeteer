# Screenshots

For capturing screenshots use [`Page.screenshot()`](https://pptr.dev/api/puppeteer.screenshot.pdf).

```ts
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://news.ycombinator.com', {
  waitUntil: 'networkidle2',
});
await page.screenshot({
  path: 'hn.pdf',
});

await browser.close();
```

You can also capture a screenshot of a specific element using [`ElementHandle.screenshot()`](https://pptr.dev/api/puppeteer.elementhandle.screenshot):

```ts
const fileElement = await page.waitForSelector('div');
await fileElement.screenshot({
  path: 'div.png',
});
```

By default, [`ElementHandle.screenshot()`](https://pptr.dev/api/puppeteer.elementhandle.screenshot) tries to scroll the element into view
if it is hidden.
