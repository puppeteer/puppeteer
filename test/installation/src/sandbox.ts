/**
 * Copyright 2022 Google Inc. All rights reserved.
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
import crypto from 'crypto';
import {mkdtemp, rm, writeFile} from 'fs/promises';
import {tmpdir} from 'os';
import {join} from 'path';

import {
  PUPPETEER_CORE_PACKAGE_PATH,
  PUPPETEER_PACKAGE_PATH,
  PUPPETEER_BROWSERS_PACKAGE_PATH,
} from './constants.js';
import {execFile} from './util.js';

const PKG_MANAGER = process.env['PKG_MANAGER'] || 'npm';

let ADD_PKG_SUBCOMMAND = 'install';
if (PKG_MANAGER !== 'npm') {
  ADD_PKG_SUBCOMMAND = 'add';
}

export interface ItEvaluatesOptions {
  commonjs?: boolean;
}

export interface ItEvaluatesFn {
  (
    title: string,
    options: ItEvaluatesOptions,
    getScriptContent: (cwd: string) => Promise<string>
  ): void;
  (title: string, getScriptContent: (cwd: string) => Promise<string>): void;
}

export interface SandboxOptions {
  dependencies?: string[];
  devDependencies?: string[];
  /**
   * This should be idempotent.
   */
  env?: ((cwd: string) => NodeJS.ProcessEnv) | NodeJS.ProcessEnv;
  before?: (cwd: string) => Promise<void>;
}

declare module 'mocha' {
  export interface Context {
    /**
     * The path to the root of the sandbox folder.
     */
    sandbox: string;
    env: NodeJS.ProcessEnv | undefined;
    runScript: (content: string, type: 'cjs' | 'mjs') => Promise<void>;
  }
}

/**
 * Configures mocha before/after hooks to create a temp folder and install
 * specified dependencies.
 */
export const configureSandbox = (options: SandboxOptions): void => {
  before(async function (): Promise<void> {
    console.time('before');
    const sandbox = await mkdtemp(join(tmpdir(), 'puppeteer-'));
    const dependencies = (options.dependencies ?? []).map(module => {
      switch (module) {
        case 'puppeteer':
          return PUPPETEER_PACKAGE_PATH;
        case 'puppeteer-core':
          return PUPPETEER_CORE_PACKAGE_PATH;
        case '@puppeteer/browsers':
          return PUPPETEER_BROWSERS_PACKAGE_PATH;
        default:
          return module;
      }
    });
    const devDependencies = options.devDependencies ?? [];

    let getEnv: (cwd: string) => NodeJS.ProcessEnv | undefined;
    if (typeof options.env === 'function') {
      getEnv = options.env;
    } else {
      const env = options.env;
      getEnv = () => {
        return env;
      };
    }
    const env = {...process.env, ...getEnv(sandbox)};

    await options.before?.(sandbox);
    if (dependencies.length > 0) {
      await execFile(PKG_MANAGER, [ADD_PKG_SUBCOMMAND, ...dependencies], {
        cwd: sandbox,
        env,
        shell: true,
      });
    }
    if (devDependencies.length > 0) {
      await execFile(
        PKG_MANAGER,
        [ADD_PKG_SUBCOMMAND, '-D', ...devDependencies],
        {
          cwd: sandbox,
          env,
          shell: true,
        }
      );
    }

    this.sandbox = sandbox;
    this.env = env;
    this.runScript = async (content: string, type: 'cjs' | 'mjs') => {
      const script = join(sandbox, `script-${crypto.randomUUID()}.${type}`);
      await writeFile(script, content);
      await execFile('node', [script], {cwd: sandbox, env});
    };
    console.timeEnd('before');
  });

  after(async function () {
    console.time('after');
    if (!process.env['KEEP_SANDBOX']) {
      await rm(this.sandbox, {recursive: true, force: true, maxRetries: 5});
    } else {
      console.log('sandbox saved in', this.sandbox);
    }
    console.timeEnd('after');
  });
};
