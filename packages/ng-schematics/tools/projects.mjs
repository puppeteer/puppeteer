/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {spawn} from 'child_process';
import {randomUUID} from 'crypto';
import {readFile, writeFile} from 'fs/promises';
import {join} from 'path';
import {cwd} from 'process';

class AngularProject {
  static ports = new Set();
  static randomPort() {
    /**
     * Some ports are restricted by Chromium and will fail to connect
     * to prevent we start after the
     *
     * https://source.chromium.org/chromium/chromium/src/+/main:net/base/port_util.cc;l=107?q=kRestrictedPorts&ss=chromium
     */
    const min = 10101;
    const max = 20202;
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  static port() {
    const port = AngularProject.randomPort();
    if (AngularProject.ports.has(port)) {
      return AngularProject.port();
    }
    return port;
  }

  static #scripts = testRunner => {
    return {
      // Builds the ng-schematics before running them
      'build:schematics': 'npm run --prefix ../../ build',
      // Deletes all files created by Puppeteer Ng-Schematics to avoid errors
      'delete:file':
        'rm -f .puppeteerrc.cjs && rm -f tsconfig.e2e.json && rm -R -f e2e/',
      // Runs the Puppeteer Ng-Schematics against the sandbox
      schematics: 'schematics ../../:ng-add --dry-run=false',
      'schematics:e2e': 'schematics ../../:e2e --dry-run=false',
      'schematics:config': 'schematics ../../:config --dry-run=false',
      'schematics:add': `schematics ../../:ng-add --dry-run=false --test-runner="${testRunner}"`,
      'schematics:smoke': 'ng e2e',
    };
  };
  /** Folder name */
  #name;
  /** E2E test runner to use */
  #runner;

  type = '';

  constructor(runner, name) {
    this.#runner = runner ?? 'node';
    this.#name = name ?? randomUUID();
  }

  get runner() {
    return this.#runner;
  }

  get name() {
    return this.#name;
  }

  async executeCommand(command, options) {
    const [executable, ...args] = command.split(' ');
    await new Promise((resolve, reject) => {
      const createProcess = spawn(executable, args, {
        shell: true,
        ...options,
      });

      const onData = data => {
        data = data
          .toString()
          // Replace new lines with a prefix including the test runner
          .replace(
            /(?:\r\n?|\n)(?=.*[\r\n])/g,
            `\n${this.#runner}:${this.type} - `,
          );
        console.log(`${this.#runner}:${this.type} - ${data}`);
      };

      createProcess.stdout.on('data', onData);
      createProcess.stderr.on('data', onData);

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
      ...AngularProject.#scripts(this.#runner),
    };
    await writeFile(packageJsonFile, JSON.stringify(packageJson, null, 2));
  }

  get commandOptions() {
    return {
      ...process.env,
      cwd: join(cwd(), `/sandbox/${this.#name}/`),
    };
  }

  async runNpmScripts(command, options) {
    await this.executeCommand(`npm run ${command}`, {
      ...this.commandOptions,
      options,
    });
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

  async runNgAdd() {
    await this.runNpmScripts(
      `schematics:add -- --port=${AngularProject.port()}`,
    );
  }

  async runSmoke() {
    await this.runNpmScripts(
      `schematics:smoke -- --port=${AngularProject.port()}`,
    );
  }
}

export class AngularProjectSingle extends AngularProject {
  type = 'single';

  async createProject() {
    await this.executeCommand(
      `ng new ${this.name} --directory=sandbox/${this.name} --defaults --skip-git`,
      {
        env: {
          PUPPETEER_SKIP_DOWNLOAD: 'true',
          ...process.env,
        },
      },
    );
  }
}

export class AngularProjectMulti extends AngularProject {
  type = 'multi';

  async createProject() {
    await this.executeCommand(
      `ng new ${this.name} --create-application=false --directory=sandbox/${this.name} --defaults --skip-git`,
      {
        env: {
          PUPPETEER_SKIP_DOWNLOAD: 'true',
          ...process.env,
        },
      },
    );

    await this.executeCommand(
      `ng generate application core --style=css --routing=true`,
      {
        PUPPETEER_SKIP_DOWNLOAD: 'true',
        ...this.commandOptions,
      },
    );
    await this.executeCommand(
      `ng generate application admin --style=css --routing=false`,
      {
        PUPPETEER_SKIP_DOWNLOAD: 'true',
        ...this.commandOptions,
      },
    );
  }
}
