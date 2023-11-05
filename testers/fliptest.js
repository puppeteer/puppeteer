// {/* <button class="_2KpZ6l _2doB4z">✕</button> */}
const puppeteer = require('puppeteer');


(async ( ) => {
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    await page.goto('https://www.flipkart.com/');
    await page.keyboard.press('Escape');
    // page.waitForNavigation;
    // await page.click('body > div._2Sn47c > div > div > button');
    // await page.type('#container > div > div._1kfTjk > div._1rH5Jn > div._2Xfa2_ > div._1cmsER > form > div > div > input','choclate')
})();