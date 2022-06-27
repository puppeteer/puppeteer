import {createRequire} from 'module';
import {dirname} from 'path';
import {fileURLToPath} from 'url';

const require = createRequire(import.meta.url);

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
  puppeteerDirname = dirname(fileURLToPath(import.meta.url));
}

export {puppeteerDirname};
