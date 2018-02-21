(async() => {
  const [, , puppeteerRoot, options, emptyPage] = process.argv;
  const browser = await require(puppeteerRoot).launch(JSON.parse(options));
  const page = await browser.newPage();
  await page.goto(emptyPage);
  await page.evaluate(() => console.log('test'));
  await page.close();
  await browser.close();
})();
