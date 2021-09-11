// eslint-disable-next-line import/extensions
import * as puppeteer from 'puppeteer';

async function run() {
  // Typo in "launch"
  const browser = await puppeteer.launh();
  // Typo: "devices"
  const devices = puppeteer.devics;
  console.log(devices);
  const browser2 = await puppeteer.launch();
  // 'foo' is invalid argument
  const page = await browser2.newPage('foo');
  const div = (await page.$('div')) as puppeteer.ElementHandle<
    HTMLAnchorElement
  >;
  console.log('got a div!', div);
}
run();
