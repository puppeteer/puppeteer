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

