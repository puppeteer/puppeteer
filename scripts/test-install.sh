#!/usr/bin/env sh
set -e

# All tests are headed by a echo 'Test'.
# The general schema is:
# 1. Check we can install from the tarball.
# 2. The install script works and correctly exits without errors
# 3. Requiring/importing Puppeteer from Node works.

## Puppeter tests

echo "Setting up Puppeteer tests..."
ROOTDIR="$(pwd)"
npm pack
tarball="$(realpath puppeteer-*.tgz)"

echo "Testing... Chrome CommonJS"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
npm install --loglevel silent "${tarball}"
node --eval="require('puppeteer')"
node --eval="require('puppeteer/lib/cjs/puppeteer/revisions.js');"
ls $TMPDIR/node_modules/puppeteer/.local-chromium/

echo "Testing... Chrome ES Modules"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type":"module"}' >>$TMPDIR/package.json
npm install --loglevel silent "${tarball}"
node --input-type="module" --eval="import puppeteer from 'puppeteer'"
node --input-type="module" --eval="import 'puppeteer/lib/esm/puppeteer/revisions.js';"
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
npm install --loglevel silent "${tarball}"
node --input-type="module" --eval="import puppeteer from 'puppeteer'"
node --input-type="module" --eval="import 'puppeteer/lib/esm/puppeteer/revisions.js';"
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
npm install --loglevel silent "${tarball}"
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
  await page.screenshot({ path: 'example.png' });
  await browser.close();
})();
" >>$TMPDIR/index.js
npx webpack
cp -r node_modules/puppeteer/.local-chromium .
rm -rf node_modules
node dist/bundle.cjs

echo "Testing... Firefox CommonJS"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
PUPPETEER_PRODUCT=firefox npm install --loglevel silent "${tarball}"
node --eval="require('puppeteer')"
node --eval="require('puppeteer/lib/cjs/puppeteer/revisions.js');"
ls $TMPDIR/node_modules/puppeteer/.local-firefox/linux-*/firefox/firefox

echo "Testing... Firefox ES Modules"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type":"module"}' >>$TMPDIR/package.json
PUPPETEER_PRODUCT=firefox npm install --loglevel silent "${tarball}"
node --input-type="module" --eval="import puppeteer from 'puppeteer'"
node --input-type="module" --eval="import 'puppeteer/lib/esm/puppeteer/revisions.js';"
ls $TMPDIR/node_modules/puppeteer/.local-firefox/linux-*/firefox/firefox

## Puppeteer Core tests

echo "Setting up Puppeteer Core tests..."
cd $ROOTDIR
rm "${tarball}"
node ./utils/prepare_puppeteer_core.js
npm pack
tarball="$(realpath puppeteer-core-*.tgz)"

echo "Testing... Puppeteer Core CommonJS"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
npm install --loglevel silent "${tarball}"
node --eval="require('puppeteer-core')"
node --eval="require('puppeteer-core/lib/cjs/puppeteer/revisions.js');"

echo "Testing... Puppeteer Core ES Modules"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type":"module"}' >>$TMPDIR/package.json
npm install --loglevel silent "${tarball}"
node --input-type="module" --eval="import puppeteer from 'puppeteer-core'"
node --input-type="module" --eval="import 'puppeteer-core/lib/esm/puppeteer/revisions.js';"
