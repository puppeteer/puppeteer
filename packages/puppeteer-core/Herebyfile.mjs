import {mkdir, readFile, writeFile} from 'fs/promises';

import esbuild from 'esbuild';
import {execa} from 'execa';
import {task} from 'hereby';

export const generateVersionTask = task({
  name: 'generate:version',
  run: async () => {
    const {version} = JSON.parse(await readFile('package.json', 'utf8'));
    await mkdir('src/generated', {recursive: true});
    await writeFile(
      'src/generated/version.ts',
      (await readFile('src/templates/version.ts.tmpl', 'utf8')).replace(
        'PACKAGE_VERSION',
        version
      )
    );
    if (process.env['PUBLISH']) {
      await writeFile(
        '../../versions.js',
        (
          await readFile('../../versions.js', {
            encoding: 'utf-8',
          })
        ).replace("'NEXT'", `'v${version}'`)
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
      platform: 'browser',
      target: 'ES2022',
      minify: true,
      write: false,
    });
    const template = await readFile('src/templates/injected.ts.tmpl', 'utf8');
    await mkdir('src/generated', {recursive: true});
    await writeFile(
      'src/generated/injected.ts',
      template.replace('SOURCE_CODE', JSON.stringify(text))
    );
  },
});

export const generateTask = task({
  name: 'generate',
  dependencies: [generateVersionTask, generateInjectedTask],
});

export const buildTscTask = task({
  name: 'build:tsc',
  dependencies: [generateTask],
  run: async () => {
    await execa('tsc', ['-b']);
    await execa('rollup', ['-c', 'rollup.third_party.config.mjs']);
    await writeFile('lib/esm/package.json', JSON.stringify({type: 'module'}));
  },
});
