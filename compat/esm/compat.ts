import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const puppeteerDirname = dirname(
  dirname(dirname(dirname(fileURLToPath(import.meta.url))))
);
