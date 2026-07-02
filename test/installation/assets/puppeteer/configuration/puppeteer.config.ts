import {type Configuration} from 'puppeteer';
import {join} from 'node:path';

export default {
  cacheDirectory: join(import.meta.dirname, '.cache', 'puppeteer'),
} satisfies Configuration;
