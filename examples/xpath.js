const puppeteer = require('../../puppeteer');

(async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.realestate.com.au/buy', {waitUntil: 'networkidle'});

  const xpath = "/html/body/div[1]/header/div[2]/a/img/@src"
  console.log(await page.waitForXpath(xpath))

  const src = await page.$XPath(xpath)
  
  console.log(src)
  await browser.close();

})();
