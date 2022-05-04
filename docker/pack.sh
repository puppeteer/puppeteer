#!/bin/bash

# Packs puppeteer using npm and moves the archive file to docker/puppeteer-latest.tgz.
# Expected cwd: project root directory.

set -e
set +x

FILENAME=$(npm pack)

echo $FILENAME

mv $FILENAME docker/puppeteer-latest.tgz
