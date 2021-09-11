import * as puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch();
  const devices = puppeteer.devices;
  console.log(devices);
  const page = await browser.newPage();
  const div = await page.$('div');
  if (div) {
    /**
     * @type {puppeteer.ElementHandle<HTMLAnchorElement>}
     */
    const newDiv = div;
    console.log('got a div!', newDiv);
  }
}
run();
