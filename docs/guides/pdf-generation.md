# PDF generation

For printing PDFs use [`Page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf).

```ts
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://news.ycombinator.com', {
  waitUntil: 'networkidle2',
});
// Saves the PDF to hn.pdf.
await page.pdf({
  path: 'hn.pdf',
});

await browser.close();
```

By default, the [`Page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) waits for fonts to be loaded.
