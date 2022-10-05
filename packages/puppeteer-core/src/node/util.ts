import {existsSync} from 'fs';
import {dirname, join, parse} from 'path';
import {tmpdir as osTmpDir} from 'os';

/**
 * Gets the temporary directory, either from the environmental variable
 * `PUPPETEER_TMP_DIR` or the `os.tmpdir`.
 *
 * @returns The temporary directory path.
 *
 * @internal
 */
export const tmpdir = (): string => {
  return process.env['PUPPETEER_TMP_DIR'] || osTmpDir();
};

/**
 * @internal
 */
export const getPackageDirectory = (from: string): string => {
  let found = existsSync(join(from, 'package.json'));
  const root = parse(from).root;
  while (!found) {
    if (from === root) {
      throw new Error('Cannot find package directory');
    }
    from = dirname(from);
    found = existsSync(join(from, 'package.json'));
  }
  return from;
};
