(async() => {
  const [, , puppeteerRoot, options, emptyPage, dumpioTextToLog] = process.argv;
  const browser = await require(puppeteerRoot).launch(JSON.parse(options));
  const page = await browser.newPage();
  await page.goto(emptyPage);
  await page.evaluate(_dumpioTextToLog => console.log(_dumpioTextToLog), dumpioTextToLog);
  await page.close();
  await browser.close();
})();
