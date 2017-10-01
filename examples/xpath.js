const puppeteer = require('../../puppeteer');

(async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.realestate.com.au/buy', {waitUntil: 'networkidle'});

  var xpath = "/html/body/div[3]/main/section/div/div/div/article[2]/div/p[2]/@class"
  await page.waitForXpath(xpath)
  var val = await page.$XPath(xpath)
  console.log(val)

  xpath = "/html/body/div[3]/main/section/div/div/div/article[2]/div/p[1]"
  await page.waitForXpath(xpath)  
  val = await page.$XPath(xpath)
  console.log(val)

  xpath = "/html/body/div[1]/header/div[2]/a/img/@src"
  await page.waitForXpath(xpath)  
  val = await page.$XPath(xpath)
  console.log(val)
  
  await browser.close();

})();
