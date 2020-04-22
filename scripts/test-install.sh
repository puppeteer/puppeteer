#!/usr/bin/env sh
set -e

# Pack the module into a tarball
npm pack
tarball="$(realpath puppeteer-*.tgz)"
cd "$(mktemp -d)"
# Check we can install from the tarball.
# This emulates installing from npm and ensures that:
# 1. we publish the right files in the `files` list from package.json
# 2. The install script works and correctly exits without errors
# 3. Requiring Puppeteer from Node works.
npm install --loglevel silent "${tarball}"
node --eval="require('puppeteer')"
rm "${tarball}"
