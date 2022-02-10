#!/usr/bin/env sh
set -e

ROOTDIR="$(pwd)"
# Pack the module into a tarball
npm pack
tarball="$(realpath puppeteer-*.tgz)"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
# Check we can install from the tarball.
# This emulates installing from npm and ensures that:
# 1. we publish the right files in the `files` list from package.json
# 2. The install script works and correctly exits without errors
# 3. Requiring Puppeteer from Node works.
npm install --loglevel silent "${tarball}"
node --eval="require('puppeteer')"
node --eval="require('puppeteer/lib/cjs/puppeteer/revisions')"
node --eval="require('puppeteer/lib/cjs/puppeteer/revisions.js')"
ls $TMPDIR/node_modules/puppeteer/.local-chromium/

# Testing ES module features
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type":"module"}' >>$TMPDIR/package.json
npm install --loglevel silent "${tarball}"
node --input-type="module" --eval="import puppeteer from 'puppeteer'"
node --input-type="module" --eval="import 'puppeteer/lib/esm/puppeteer/revisions'"
node --input-type="module" --eval="import 'puppeteer/lib/esm/puppeteer/revisions.js'"
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
ls $TMPDIR/node_modules/puppeteer/.local-chromium/

# Again for Firefox
TMPDIR="$(mktemp -d)"
cd $TMPDIR
PUPPETEER_PRODUCT=firefox npm install --loglevel silent "${tarball}"
node --eval="require('puppeteer')"
rm "${tarball}"
ls $TMPDIR/node_modules/puppeteer/.local-firefox/linux-*/firefox/firefox

# Again for puppeteer-core
cd $ROOTDIR
node ./utils/prepare_puppeteer_core.js
npm pack
tarball="$(realpath puppeteer-core-*.tgz)"
TMPDIR="$(mktemp -d)"
cd $TMPDIR
# Check we can install from the tarball.
# This emulates installing from npm and ensures that:
# 1. we publish the right files in the `files` list from package.json
# 2. The install script works and correctly exits without errors
# 3. Requiring Puppeteer Core from Node works.
npm install --loglevel silent "${tarball}"
node --eval="require('puppeteer-core')"
node --eval="require('puppeteer-core/lib/cjs/puppeteer/revisions')"
node --eval="require('puppeteer-core/lib/cjs/puppeteer/revisions.js')"

# Testing ES module features
TMPDIR="$(mktemp -d)"
cd $TMPDIR
echo '{"type":"module"}' >>$TMPDIR/package.json
npm install --loglevel silent "${tarball}"
node --input-type="module" --eval="import puppeteer from 'puppeteer-core'"
node --input-type="module" --eval="import 'puppeteer-core/lib/esm/puppeteer/revisions'"
node --input-type="module" --eval="import 'puppeteer-core/lib/esm/puppeteer/revisions.js'"
