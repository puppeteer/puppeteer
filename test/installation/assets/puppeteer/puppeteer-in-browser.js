import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--remote-allow-origins=*'],
});

try {
  const port = process.argv[2];

  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}/index.html`);

  await page.type('input', browser.wsEndpoint());

  const [result] = await Promise.all([
    new Promise(resolve => {
      page.once('dialog', dialog => {
        dialog.accept();
        resolve(dialog.message());
      });
    }),
    page.click('button'),
  ]);

  const alert = await result;

  if (alert !== 'Browser has 2 pages') {
    throw new Error('Unexpected alert content: ' + alert);
  }
} finally {
  await browser.close();
}
