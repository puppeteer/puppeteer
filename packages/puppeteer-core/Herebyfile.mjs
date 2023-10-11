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
      target: 'chrome117',
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
    const packages = ['mitt', 'rxjs'];
    const formats = ['esm', 'cjs'];
    const builders = [];
    for (const name of packages) {
      for (const format of formats) {
        const filePath = `lib/${format}/third_party/${name}/${name}.js`;
        builders.push(
          await esbuild.build({
            entryPoints: [filePath],
            outfile: filePath,
            bundle: true,
            allowOverwrite: true,
            format,
            target: 'node16',
            minify: true,
          })
        );
      }
    }
    await Promise.all(builders);
  },
});
