(async() => {
  const [, , puppeteerRoot, options] = process.argv;
  const browser = await require(puppeteerRoot).launch(JSON.parse(options));
  console.log(browser.wsEndpoint());
})();
