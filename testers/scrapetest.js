const puppeteer = require('puppeteer');
const Helper = require('../utils/helper');
const config = require('../config/config');
const bConfig = require('../config/browserConfig');
const res = require('../config/Res');
// let testinput = 'chocolate'
// function randomIntFromInterval(min, max) { return Math.floor(Math.random() * (max - min + 1) + min)}
(async (testinput = 'choclate' ) => {
    let LoopCondition = true;
    let executablePath =bConfig.executablePath;
    // let useDataDir = bConfig.useDataDir;
    let browser = await Helper.getProfiledBrowser(executablePath);
    let userAgent = await Helper.getuseragent();
    console.log("res",userAgent);
    let page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.goto(config.SCRAPE.amazon.URL);
    let res = await Helper.getResolution();
    console.log("res",res);
    await page.setViewport(res);
    let tabs = await browser.pages();
        if (tabs.length > 1) {
            tabs[0].close()
        }
    await page.type(config.SCRAPE.amazon.searchbox,String(testinput));
    await page.waitForTimeout (1000);
    await page.click('#nav-search-submit-button')
    
  })();
  