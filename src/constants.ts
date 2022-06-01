import { dirname } from 'path';
import { puppeteerDirname } from './compat.js';

export const rootDirname = dirname(dirname(dirname(puppeteerDirname)));
