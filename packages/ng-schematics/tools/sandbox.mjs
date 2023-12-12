/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {spawn} from 'child_process';
import {randomUUID} from 'crypto';
import {readFile, writeFile} from 'fs/promises';
import {join} from 'path';
import {cwd} from 'process';

/**
 *
 * @param {string | object} toExecute
 * @returns {Promise<boolean>}
 */
async function executeCommand(executable, args, options) {
  args = args.split(' ');
  await new Promise((resolve, reject) => {
    const createProcess = spawn(executable, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    createProcess.on('error', message => {
      console.error(
        `Running ${executable} ${args.join(' ')} exited with error:`,
        message
      );
      reject(message);
    });

    createProcess.on('exit', code => {
      if (code === 0) {
        resolve(true);
      } else {
        reject();
      }
    });
  });
}

async function updatePackageJson(name) {
  const scripts = {
    // Builds the ng-schematics before running them
    'build:schematics': 'npm run --prefix ../../ build',
    // Deletes all files created by Puppeteer Ng-Schematics to avoid errors
    'delete:file':
      'rm -f .puppeteerrc.cjs && rm -f tsconfig.e2e.json && rm -R -f e2e/',
    // Runs the Puppeteer Ng-Schematics against the sandbox
    schematics: 'schematics ../../:ng-add --dry-run=false',
    'schematics:e2e': 'schematics ../../:e2e --dry-run=false',
    'schematics:config': 'schematics ../../:config --dry-run=false',
    'schematics:smoke':
      'schematics ../../:ng-add --dry-run=false --test-runner="node" && ng e2e',
  };
  const packageJsonFile = join(cwd(), `/sandbox/${name}/package.json`);
  const packageJson = JSON.parse(await readFile(packageJsonFile));
  packageJson['scripts'] = {
    ...packageJson['scripts'],
    ...scripts,
  };
  await writeFile(packageJsonFile, JSON.stringify(packageJson, null, 2));
}

export async function createSingleSandbox(name) {
  name ??= randomUUID();
  await executeCommand(
    'npx',
    `ng new ${name} --directory=sandbox/${name} --defaults --skip-git`
  );
  await updatePackageJson(name);

  return name;
}

export async function createMultiSandbox(name) {
  name ??= randomUUID();
  const options = {
    cwd: join(cwd(), `/sandbox/${name}/`),
  };

  await executeCommand(
    'ng',
    `new ${name} --create-application=false --directory=sandbox/${name} --skip-git`
  );
  await Promise.all([
    executeCommand(
      'ng',
      `generate application core --style=css --routing=true`,
      options
    ),
    executeCommand(
      'ng',
      `generate application admin --style=css --routing=false`,
      options
    ),
  ]);

  await updatePackageJson(name);

  return name;
}

async function runNpmScripts(name, command) {
  const options = {
    cwd: join(cwd(), `/sandbox/${name}/`),
  };

  await executeCommand('npm', `run ${command}`, options);
}

export async function runSchematics(name) {
  await runNpmScripts(name, 'schematics');
}

export async function runSchematicsE2E(name) {
  await runNpmScripts(name, 'schematics:e2e');
}

export async function runSchematicsConfig(name) {
  await runNpmScripts(name, 'schematics:config');
}

export async function runSchematicsSmoke(name) {
  await runNpmScripts(name, 'schematics:smoke');
}
