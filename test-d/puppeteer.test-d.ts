import puppeteer, {
  type connect,
  type defaultArgs,
  type executablePath,
  type launch,
} from 'puppeteer';
import {expectType} from 'tsd';

expectType<typeof launch>(puppeteer.launch);
expectType<typeof connect>(puppeteer.connect);
expectType<typeof defaultArgs>(puppeteer.defaultArgs);
expectType<typeof executablePath>(puppeteer.executablePath);
