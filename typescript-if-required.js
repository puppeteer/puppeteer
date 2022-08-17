/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const exec = promisify(child_process.exec);
const fsAccess = promisify(fs.access);

const fileExists = async filePath => {
  return fsAccess(filePath)
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
};
/*

 * Now Puppeteer is built with TypeScript, we need to ensure that
 * locally we have the generated output before trying to install.
 *
 * For users installing puppeteer this is fine, they will have the
 * generated lib/ directory as we ship it when we publish to npm.
 *
 * However, if you're cloning the repo to contribute, you won't have the
 * generated lib/ directory so this script checks if we need to run
 * TypeScript first to ensure the output exists and is in the right
 * place.
 */
async function compileTypeScript() {
  return exec('npm run build').catch(error => {
    console.error('Error running TypeScript', error);
    process.exit(1);
  });
}

async function compileTypeScriptIfRequired() {
  const libPath = path.join(__dirname, 'lib');
  const libExists = await fileExists(libPath);
  if (libExists) {
    return;
  }

  console.log('Puppeteer:', 'Compiling TypeScript...');
  await compileTypeScript();
}

// It's being run as node typescript-if-required.js, not require('..')
if (require.main === module) {
  compileTypeScriptIfRequired();
}

module.exports = compileTypeScriptIfRequired;
