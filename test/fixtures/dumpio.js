(async () => {
  const [, , puppeteerRoot, options] = process.argv;
  const browser = await require(puppeteerRoot).launch(JSON.parse(options));
  const page = await browser.newPage();
  await page.evaluate(() => console.error('message from dumpio'));
  await page.close();
  await browser.close();
})();
