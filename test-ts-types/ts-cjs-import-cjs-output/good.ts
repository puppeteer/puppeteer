import puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch();
  const devices = puppeteer.devices;
  console.log(devices);
  const page = await browser.newPage();
  const div = (await page.$('div')) as puppeteer.ElementHandle<
    HTMLAnchorElement
  >;
  console.log('got a div!', div);
}
run();
