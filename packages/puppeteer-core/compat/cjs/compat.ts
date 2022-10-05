import {dirname} from 'path';

/**
 * @internal
 */
let puppeteerDirname: string;

try {
  // In some environments, like esbuild, this will throw an error.
  // We suppress the error since the bundled binary is not expected
  // to be used or installed in this case and, therefore, the
  // root directory does not have to be known.
  puppeteerDirname = dirname(require.resolve('./compat'));
} catch (error) {
  // Fallback to __dirname.
  puppeteerDirname = __dirname;
}

export {puppeteerDirname};
