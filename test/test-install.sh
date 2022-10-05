#!/usr/bin/env sh
set -e

# All tests are headed by a echo 'Test'.
# The general schema is:
# 1. Check we can install from the tarball.
# 2. The install script works and correctly exits without errors
# 3. Requiring/importing Puppeteer from Node works.

ROOTDIR="$(pwd)"
npm pack --workspaces
puppeteer_tarball=$(realpath puppeteer-[0-9]*.tgz)
puppeteer_core_tarball=$(realpath puppeteer-core-*.tgz)

echo "Puppeteer Core Test Suite"

echo "Testing... CommonJS"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
npm install --loglevel silent "${puppeteer_core_tarball}"
node --eval="require('puppeteer-core')"
node --eval="require('puppeteer-core/lib/cjs/puppeteer/revisions.js');"

echo "Testing... ES Modules"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type":"module"}' >>$TMPDIR/package.json
npm install --loglevel silent "${puppeteer_core_tarball}"
node --input-type="module" --eval="import puppeteer from 'puppeteer-core'"
node --input-type="module" --eval="import 'puppeteer-core/lib/esm/puppeteer/revisions.js';"

echo "Testing...launch with executablePath"
TMPDIR="$(mktemp -d)"
cd "$TMPDIR"
echo '{"type":"module"}' >>"$TMPDIR/package.json"
npm install --loglevel silent "${puppeteer_core_tarball}"
# The test tries to launch the node process because
# real browsers are not downloaded by puppeteer-core.
# The expected error is "Failed to launch the browser process"
# so the test verifies that it does not fail for other reasons.
node --input-type="module" --eval="
import puppeteer from 'puppeteer-core';
(async () => {
  puppeteer.launch({
    product: 'firefox',
    executablePath: 'node'
  }).catch(error => error.message.includes('Failed to launch the browser process') ? process.exit(0) : process.exit(1));
})();
"
node --input-type="module" --eval="
import puppeteer from 'puppeteer-core';
(async () => {
  puppeteer.launch({
    product: 'chrome',
    executablePath: 'node'
  }).catch(error => error.message.includes('Failed to launch the browser process') ? process.exit(0) : process.exit(1));
})();
"

echo "Puppeteer Test Suite"

echo "Testing... Chrome CommonJS"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
npm install --loglevel silent $puppeteer_core_tarball $puppeteer_tarball
node --eval="require('puppeteer')"
ls $TMPDIR/node_modules/puppeteer-core/.local-chromium/

echo "Testing... Chrome ES Modules"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type":"module"}' >>$TMPDIR/package.json
npm install --loglevel silent $puppeteer_core_tarball $puppeteer_tarball
node --input-type="module" --eval="import puppeteer from 'puppeteer'"
node --input-type="module" --eval="
import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://example.com');
  await page.screenshot({ path: 'example.png' });
  await browser.close();
})();
"

echo "Testing... Chrome ES Modules Destructuring"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type":"module"}' >>$TMPDIR/package.json
npm install --loglevel silent $puppeteer_core_tarball $puppeteer_tarball
node --input-type="module" --eval="import puppeteer from 'puppeteer'"
node --input-type="module" --eval="
import { launch } from 'puppeteer';
(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.goto('http://example.com');
  await page.screenshot({ path: 'example.png' });
  await browser.close();
})();
"

echo "Testing... Chrome Webpack ES Modules"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type": "module"}' >>$TMPDIR/package.json
npm install --loglevel silent $puppeteer_core_tarball $puppeteer_tarball
npm install -D --loglevel silent webpack webpack-cli@4.9.2
echo 'export default {
  mode: "production",
  entry: "./index.js",
  target: "node",
  output: {
    filename: "bundle.cjs",
  },
};' >>$TMPDIR/webpack.config.js
echo "
import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://example.com');
  await page.\$('aria/example');
  await page.screenshot({ path: 'example.png' });
  await browser.close();
})();
" >>$TMPDIR/index.js
npx webpack
cp -r node_modules/puppeteer-core/.local-chromium .
rm -rf node_modules
node dist/bundle.cjs

echo "Testing... Firefox CommonJS"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
PUPPETEER_PRODUCT=firefox npm install --loglevel silent $puppeteer_core_tarball $puppeteer_tarball
node --eval="require('puppeteer')"
ls $TMPDIR/node_modules/puppeteer-core/.local-firefox

echo "Testing... Firefox ES Modules"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type":"module"}' >>$TMPDIR/package.json
PUPPETEER_PRODUCT=firefox npm install --loglevel silent $puppeteer_core_tarball $puppeteer_tarball
node --input-type="module" --eval="import puppeteer from 'puppeteer'"
ls $TMPDIR/node_modules/puppeteer-core/.local-firefox
