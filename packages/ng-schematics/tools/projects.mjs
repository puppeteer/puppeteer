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

class AngularProject {
  static #scripts = {
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
  #name;

  constructor(name) {
    this.#name = name ?? randomUUID();
  }

  get name() {
    return this.#name;
  }

  async executeCommand(command, options) {
    const [executable, ...args] = command.split(' ');
    await new Promise((resolve, reject) => {
      const createProcess = spawn(executable, args, {
        stdio: 'inherit',
        shell: true,
        ...options,
      });

      createProcess.on('error', message => {
        console.error(`Running ${command} exited with error:`, message);
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

  async create() {
    await this.createProject();
    await this.updatePackageJson();
  }

  async updatePackageJson() {
    const packageJsonFile = join(cwd(), `/sandbox/${this.#name}/package.json`);
    const packageJson = JSON.parse(await readFile(packageJsonFile));
    packageJson['scripts'] = {
      ...packageJson['scripts'],
      ...AngularProject.#scripts,
    };
    await writeFile(packageJsonFile, JSON.stringify(packageJson, null, 2));
  }

  get commandOptions() {
    return {
      cwd: join(cwd(), `/sandbox/${this.#name}/`),
    };
  }

  async runNpmScripts(command) {
    await this.executeCommand(`npm run ${command}`, this.commandOptions);
  }

  async runSchematics() {
    await this.runNpmScripts('schematics');
  }

  async runSchematicsE2E() {
    await this.runNpmScripts('schematics:e2e');
  }

  async runSchematicsConfig() {
    await this.runNpmScripts('schematics:config');
  }

  async runSmoke() {
    const port = Math.floor(Math.random() * 6789);
    await this.runNpmScripts(`schematics:smoke -- --port=${port}`);
  }
}

export class AngularProjectSingle extends AngularProject {
  async createProject() {
    await this.executeCommand(
      `ng new ${this.name} --directory=sandbox/${this.name} --defaults --skip-git`
    );
  }
}

export class AngularProjectMulti extends AngularProject {
  async createProject() {
    await this.executeCommand(
      `ng new ${this.name} --create-application=false --directory=sandbox/${this.name} --skip-git`
    );

    await this.executeCommand(
      `ng generate application core --style=css --routing=true`,
      this.commandOptions
    );
    await this.executeCommand(
      `ng generate application admin --style=css --routing=false`,
      this.commandOptions
    );
  }
}
