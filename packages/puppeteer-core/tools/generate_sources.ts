#!/usr/bin/env node
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'fs/promises';
import path, {join, resolve} from 'path';
import {chdir} from 'process';

import esbuild from 'esbuild';

import {job} from '../../../tools/internal/job.js';

const packageRoot = resolve(join(__dirname, '..'));
chdir(packageRoot);

(async () => {
  await job('', async ({outputs}) => {
    await Promise.all(
      outputs.map(outputs => {
        return mkdir(outputs, {recursive: true});
      })
    );
  })
    .outputs(['src/generated'])
    .build();

  const versionJob = job('', async ({inputs, outputs}) => {
    const version = JSON.parse(await readFile(inputs[0]!, 'utf8')).version;
    await writeFile(
      outputs[0]!,
      (await readFile(inputs[1]!, 'utf8')).replace('PACKAGE_VERSION', version)
    );
  })
    .inputs(['package.json', 'src/templates/version.ts.tmpl'])
    .outputs(['src/generated/version.ts'])
    .build();

  const injectedJob = job('', async ({name, inputs, outputs}) => {
    const input = inputs.find(input => {
      return input.endsWith('injected.ts');
    })!;
    const template = await readFile(
      inputs.find(input => {
        return input.includes('injected.ts.tmpl');
      })!,
      'utf8'
    );
    const tmp = await mkdtemp(name);
    await esbuild.build({
      entryPoints: [input],
      bundle: true,
      outdir: tmp,
      format: 'cjs',
      platform: 'browser',
      target: 'ES2022',
      minify: true,
    });
    const baseName = path.basename(input);
    const content = await readFile(
      path.join(tmp, baseName.replace('.ts', '.js')),
      'utf-8'
    );
    const scriptContent = template.replace(
      'SOURCE_CODE',
      JSON.stringify(content)
    );
    await writeFile(outputs[0]!, scriptContent);
    await rm(tmp, {recursive: true, force: true});
  })
    .inputs(['src/templates/injected.ts.tmpl', 'src/injected/**/*.ts'])
    .outputs(['src/generated/injected.ts'])
    .build();

  await Promise.all([versionJob, injectedJob]);

  if (process.env['PUBLISH']) {
    await job('', async ({inputs}) => {
      const version = JSON.parse(await readFile(inputs[0]!, 'utf8')).version;
      await writeFile(
        inputs[1]!,
        (
          await readFile(inputs[1]!, {
            encoding: 'utf-8',
          })
        ).replace("'NEXT'", `'v${version}'`)
      );
    })
      .inputs(['package.json', '../../versions.js'])
      .build();
  }
})();
