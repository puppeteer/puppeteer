import {type Configuration} from 'puppeteer';
import {join} from 'path';

export default {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
} satisfies Configuration;
