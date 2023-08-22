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
import {readFile, writeFile} from 'fs/promises';
import {join} from 'path';
import {cwd} from 'process';

const isInit = process.argv.indexOf('--init') !== -1;
const isMulti = process.argv.indexOf('--multi') !== -1;
const isBuild = process.argv.indexOf('--build') !== -1;
const isE2E = process.argv.indexOf('--e2e') !== -1;
const isConfig = process.argv.indexOf('--config') !== -1;
const commands = {
  build: ['npm run build'],
  createSandbox: ['npx ng new sandbox --defaults'],
  createMultiWorkspace: [
    'ng new sandbox --create-application=false --directory=multi',
  ],
  createMultiProjects: [
    {
      command: 'ng generate application core --style=css --routing=true',
      options: {
        cwd: join(cwd(), '/multi/'),
      },
    },
    {
      command: 'ng generate application admin --style=css --routing=false',
      options: {
        cwd: join(cwd(), '/multi/'),
      },
    },
  ],
  runSchematics: [
    {
      command: 'npm run schematics',
      options: {
        cwd: join(cwd(), '/sandbox/'),
      },
    },
  ],
  runSchematicsE2E: [
    {
      command: 'npm run schematics:e2e',
      options: {
        cwd: join(cwd(), '/sandbox/'),
      },
    },
  ],
  runSchematicsConfig: [
    {
      command: 'npm run schematics:config',
      options: {
        cwd: join(cwd(), '/sandbox/'),
      },
    },
  ],
};
const scripts = {
  // Builds the ng-schematics before running them
  'build:schematics': 'npm run --prefix ../ build',
  // Deletes all files created by Puppeteer Ng-Schematics to avoid errors
  'delete:file':
    'rm -f .puppeteerrc.cjs && rm -f tsconfig.e2e.json && rm -R -f e2e/',
  // Runs the Puppeteer Ng-Schematics against the sandbox
  schematics:
    'npm run delete:file && npm run build:schematics && schematics ../:ng-add --dry-run=false',
  'schematics:e2e':
    'npm run build:schematics && schematics ../:e2e --dry-run=false',
  'schematics:config':
    'npm run build:schematics && schematics ../:config --dry-run=false',
};
/**
 *
 * @param {string | object} toExecute
 * @returns {Promise<boolean>}
 */
async function executeCommand(commands) {
  for (const toExecute of commands) {
    let executable;
    let args;
    let options = {};
    if (typeof toExecute === 'string') {
      [executable, ...args] = toExecute.split(' ');
    } else {
      [executable, ...args] = toExecute.command.split(' ');
      options = toExecute.options ?? {};
    }

    await new Promise((resolve, reject) => {
      const createProcess = spawn(executable, args, {
        stdio: 'inherit',
        shell: true,
        ...options,
      });

      createProcess.on('error', message => {
        console.error(`Running ${toExecute} exited with error:`, message);
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
}

async function main() {
  if (isInit) {
    if (isMulti) {
      await executeCommand(commands.createMultiWorkspace);
      await executeCommand(commands.createMultiProjects);
    } else {
      await executeCommand(commands.createSandbox);
    }

    const directory = isMulti ? 'multi' : 'sandbox';

    const packageJsonFile = join(cwd(), `/${directory}/package.json`);
    const packageJson = JSON.parse(await readFile(packageJsonFile));
    packageJson['scripts'] = {
      ...packageJson['scripts'],
      ...scripts,
    };
    await writeFile(packageJsonFile, JSON.stringify(packageJson, null, 2));
  } else {
    if (isBuild) {
      await executeCommand(commands.build);
    }
    if (isE2E) {
      await executeCommand(commands.runSchematicsE2E);
    } else if (isConfig) {
      await executeCommand(commands.runSchematicsConfig);
    } else {
      await executeCommand(commands.runSchematics);
    }
  }
}

main().catch(error => {
  console.log('Something went wrong');
  console.error(error);
});
