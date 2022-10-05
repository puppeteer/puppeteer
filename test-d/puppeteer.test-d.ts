import puppeteer, {
  connect,
  createBrowserFetcher,
  defaultArgs,
  executablePath,
  launch,
} from 'puppeteer';
import {expectType} from 'tsd';

expectType<typeof launch>(puppeteer.launch);
expectType<typeof connect>(puppeteer.connect);
expectType<typeof createBrowserFetcher>(puppeteer.createBrowserFetcher);
expectType<typeof defaultArgs>(puppeteer.defaultArgs);
expectType<typeof executablePath>(puppeteer.executablePath);
