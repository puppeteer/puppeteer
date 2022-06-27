import {expectType} from 'tsd';
import {
  connect,
  createBrowserFetcher,
  defaultArgs,
  executablePath,
  launch,
  default as puppeteer,
} from '../lib/esm/puppeteer/puppeteer.js';

expectType<typeof launch>(puppeteer.launch);
expectType<typeof connect>(puppeteer.connect);
expectType<typeof createBrowserFetcher>(puppeteer.createBrowserFetcher);
expectType<typeof defaultArgs>(puppeteer.defaultArgs);
expectType<typeof executablePath>(puppeteer.executablePath);
