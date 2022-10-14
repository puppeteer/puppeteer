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
import assert from 'assert';
import {createHash} from 'crypto';
import {mkdtemp, rm, writeFile} from 'fs/promises';
import {tmpdir} from 'os';
import {join} from 'path';
import {
  PUPPETEER_CORE_PACKAGE_PATH,
  PUPPETEER_PACKAGE_PATH,
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

export interface DescribeInstallationOptions {
  dependencies?: string[];
  devDependencies?: string[];
  /**
   * This should be idempotent.
   */
  env?: ((cwd: string) => NodeJS.ProcessEnv) | NodeJS.ProcessEnv;
}

export interface DescribeInstallationContext {
  itEvaluates: ItEvaluatesFn;
}

export const describeInstallation = (
  title: string,
  options: DescribeInstallationOptions,
  fn: (context: DescribeInstallationContext) => void
): Mocha.Suite => {
  return describe(`${title} installation`, () => {
    let sandbox: string;
    let dependencies: string[];
    let devDependencies: string[];
    let env: NodeJS.ProcessEnv;

    before(async () => {
      sandbox = await mkdtemp(join(tmpdir(), 'puppeteer-'));
      dependencies = (options.dependencies ?? []).map(module => {
        switch (module) {
          case 'puppeteer':
            return PUPPETEER_PACKAGE_PATH;
          case 'puppeteer-core':
            return PUPPETEER_CORE_PACKAGE_PATH;
          default:
            return module;
        }
      });
      devDependencies = options.devDependencies ?? [];

      let getEnv: (cwd: string) => NodeJS.ProcessEnv | undefined;
      if (typeof options.env === 'function') {
        getEnv = options.env;
      } else {
        const env = options.env;
        getEnv = () => {
          return env;
        };
      }
      env = {...process.env, ...getEnv(sandbox)};
    });

    after(async () => {
      if (process.env['KEEP_SANDBOX']) {
        await rm(sandbox, {recursive: true, force: true});
      }
    });

    it(`should install ${title}`, async () => {
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
    });

    const itEvaluates = (
      title: string,
      options: ItEvaluatesOptions | ((cwd: string) => Promise<string>),
      getScriptContent?: (cwd: string) => Promise<string>
    ): Mocha.Test => {
      let evaluateOptions: ItEvaluatesOptions;
      if (typeof options === 'function') {
        evaluateOptions = {};
        getScriptContent = options;
      } else {
        evaluateOptions = options;
      }

      return it(`should evaluate ${title}`, async () => {
        const script = join(
          sandbox,
          `script-${createHash('sha1').update(title, 'utf8').digest('hex')}.${
            evaluateOptions.commonjs ? 'cjs' : 'mjs'
          }`
        );

        assert.ok(
          getScriptContent,
          'Expected `getScriptContent` to be defined'
        );
        await writeFile(script, await getScriptContent(sandbox));
        await execFile('node', [script], {cwd: sandbox, env});
      });
    };

    fn({itEvaluates});
  });
};
