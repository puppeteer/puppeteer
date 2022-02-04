import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const puppeteerDirname = dirname(fileURLToPath(import.meta.url));
