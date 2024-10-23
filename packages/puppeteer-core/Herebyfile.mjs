/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {mkdir, readFile, readdir, writeFile} from 'fs/promises';
import Module from 'node:module';
import path from 'path';
import posixPath from 'path/posix';

import esbuild from 'esbuild';
import {execa} from 'execa';
import {task} from 'hereby';

const require = Module.createRequire(import.meta.url);

export const generateVersionTask = task({
  name: 'generate:version',
  run: async () => {
    const {version} = JSON.parse(await readFile('package.json', 'utf8'));
    await mkdir('src/generated', {recursive: true});
    await writeFile(
      'src/generated/version.ts',
      (await readFile('src/templates/version.ts.tmpl', 'utf8')).replace(
        'PACKAGE_VERSION',
        version,
      ),
    );
    if (process.env['PUBLISH']) {
      await writeFile(
        '../../versions.json',
        (
          await readFile('../../versions.json', {
            encoding: 'utf-8',
          })
        ).replace(`"NEXT"`, `"v${version}"`),
      );
    }
  },
});

export const generateInjectedTask = task({
  name: 'generate:injected',
  run: async () => {
    const {
      outputFiles: [{text}],
    } = await esbuild.build({
      entryPoints: ['src/injected/injected.ts'],
      bundle: true,
      format: 'cjs',
      target: ['chrome125', 'firefox125'],
      minify: true,
      write: false,
      legalComments: 'none',
    });
    const template = await readFile('src/templates/injected.ts.tmpl', 'utf8');
    await mkdir('src/generated', {recursive: true});
    await writeFile(
      'src/generated/injected.ts',
      template.replace('SOURCE_CODE', JSON.stringify(text)),
    );
  },
});

export const generatePackageJsonTask = task({
  name: 'generate:package-json',
  run: async () => {
    await mkdir('lib/esm', {recursive: true});
    await writeFile('lib/esm/package.json', JSON.stringify({type: 'module'}));
  },
});

export const generateTask = task({
  name: 'generate',
  dependencies: [
    generateVersionTask,
    generateInjectedTask,
    generatePackageJsonTask,
  ],
});

export const buildTscTask = task({
  name: 'build:tsc',
  dependencies: [generateTask],
  run: async () => {
    await execa('tsc', ['-b']);
  },
});

export const buildTask = task({
  name: 'build',
  dependencies: [buildTscTask],
  run: async () => {
    const formats = ['esm', 'cjs'];
    const packages = (await readdir('third_party', {withFileTypes: true}))
      .filter(dirent => {
        return dirent.isDirectory();
      })
      .map(({name}) => {
        return name;
      });
    const builders = [];
    for (const format of formats) {
      const folder = posixPath.join('lib', format, 'third_party');
      for (const name of packages) {
        const entrypoint = posixPath.join(folder, name, `${name}.js`);
        builders.push(
          await esbuild.build({
            entryPoints: [entrypoint],
            outfile: entrypoint,
            bundle: true,
            allowOverwrite: true,
            format,
            target: 'node18',
            // Do not minify for readability and leave minification to
            // consumers.
            minify: false,
            legalComments: 'inline',
          }),
        );
        let license = '';
        switch (name) {
          case 'rxjs':
            license = await readFile(
              path.join(
                path.dirname(require.resolve('rxjs')),
                '..',
                '..',
                'LICENSE.txt',
              ),
              'utf-8',
            );
            break;
          case 'mitt':
            license = await readFile(
              path.join(path.dirname(require.resolve('mitt')), '..', 'LICENSE'),
              'utf-8',
            );
            break;
          case 'parsel-js':
            license = await readFile(
              path.join(
                path.dirname(require.resolve('parsel-js')),
                '..',
                'LICENSE',
              ),
              'utf-8',
            );
            break;
          default:
            throw new Error(`Add license handling for ${path}`);
        }
        const content = await readFile(entrypoint, 'utf-8');
        await writeFile(
          entrypoint,
          `/**
${license}
*/
${content}`,
          'utf-8',
        );
      }
    }
    await Promise.all(builders);
  },
});
