#!/bin/bash

# Packs puppeteer using npm and moves the archive file to docker/puppeteer-latest.tgz.
# Expected cwd: project root directory.

set -e

cd docker

npm pack --workspace puppeteer --workspace puppeteer-core --workspace @puppeteer/browsers --pack-destination .

rm -f puppeteer-core-latest.tgz
rm -f puppeteer-latest.tgz
rm -f puppeteer-browsers-latest.tgz

mv puppeteer-core-*.tgz puppeteer-core-latest.tgz
mv puppeteer-browsers-*.tgz puppeteer-browsers-latest.tgz
mv puppeteer-[0-9]*.tgz puppeteer-latest.tgz