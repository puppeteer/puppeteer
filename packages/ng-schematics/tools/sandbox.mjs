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

let singleApplicationName = 'single';
let multiApplicationName = 'multi';

const commands = {
  build: ['npm run build'],
  createSandbox: `npx ng new ${singleApplicationName} --defaults`,
  createMultiWorkspace: `ng new ${multiApplicationName} --create-application=false --directory=${multiApplicationName}`,
  createMultiProjects: [
    {
      command: 'ng generate application core --style=css --routing=true',
      options: {
        cwd: join(cwd(), `/${multiApplicationName}/`),
      },
    },
    {
      command: 'ng generate application admin --style=css --routing=false',
      options: {
        cwd: join(cwd(), `/${multiApplicationName}/`),
      },
    },
  ],
  /**
   * @param {Boolean} isMulti
   */
  runSchematics: isMulti => {
    return [
      {
        command: 'npm run schematics',
        options: {
          cwd: join(
            cwd(),
            isMulti ? `/${multiApplicationName}/` : `/${singleApplicationName}/`
          ),
        },
      },
    ];
  },
  /**
   * @param {Boolean} isMulti
   */
  runSchematicsE2E: isMulti => {
    return [
      {
        command: 'npm run schematics:e2e',
        options: {
          cwd: join(
            cwd(),
            isMulti ? `/${multiApplicationName}/` : `/${singleApplicationName}/`
          ),
        },
      },
    ];
  },
  /**
   * @param {Boolean} isMulti
   */
  runSchematicsConfig: isMulti => {
    return [
      {
        command: 'npm run schematics:config',
        options: {
          cwd: join(
            cwd(),
            isMulti ? `/${multiApplicationName}/` : `/${singleApplicationName}/`
          ),
        },
      },
    ];
  },
  runSchematicsSmoke: isMulti => {
    return [
      {
        command: 'npm run schematics:smoke',
        options: {
          cwd: join(
            cwd(),
            isMulti ? `/${multiApplicationName}/` : `/${singleApplicationName}/`
          ),
        },
      },
    ];
  },
};
const scripts = {
  // Builds the ng-schematics before running them
  'build:schematics': 'npm run --prefix ../ build',
  // Deletes all files created by Puppeteer Ng-Schematics to avoid errors
  'delete:file':
    'rm -f .puppeteerrc.cjs && rm -f tsconfig.e2e.json && rm -R -f e2e/',
  // Runs the Puppeteer Ng-Schematics against the sandbox
  schematics: 'schematics ../:ng-add --dry-run=false',
  'schematics:e2e': 'schematics ../:e2e --dry-run=false',
  'schematics:config': 'schematics ../:config --dry-run=false',
  'schematics:smoke':
    'schematics ../:ng-add --dry-run=false --test-runner="node" && ng e2e',
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

/**
 *
 * @param {*} param0
 */
export async function runNgSchematicsSandbox({
  isInit,
  isMulti,
  isBuild,
  isE2E,
  isConfig,
  isSmoke,
  randomName,
}) {
  if (isInit) {
    if (isMulti) {
      if (randomName) {
        multiApplicationName = randomUUID();
      }
      await executeCommand(commands.createMultiWorkspace);
      await executeCommand(commands.createMultiProjects);
    } else {
      if (randomName) {
        singleApplicationName = randomUUID();
      }
      await executeCommand(commands.createSandbox);
    }

    const directory = isMulti ? multiApplicationName : singleApplicationName;
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
      await executeCommand(commands.runSchematicsE2E(isMulti));
    } else if (isConfig) {
      await executeCommand(commands.runSchematicsConfig(isMulti));
    } else if (isSmoke) {
      await executeCommand(commands.runSchematicsSmoke(isMulti));
    } else {
      await executeCommand(commands.runSchematics(isMulti));
    }
  }
}

async function main() {
  const options = {
    isInit: process.argv.indexOf('--init') !== -1,
    isMulti: process.argv.indexOf('--multi') !== -1,
    isBuild: process.argv.indexOf('--build') !== -1,
    isE2E: process.argv.indexOf('--e2e') !== -1,
    isConfig: process.argv.indexOf('--config') !== -1,
  };
  const isShell = Object.values(options).some(value => {
    return value;
  });

  if (isShell) {
    await runNgSchematicsSandbox({options, randomName: false}).catch(error => {
      console.log('Something went wrong');
      console.error(error);
    });
  }
}

main();
