#!/usr/bin/env node
import esbuild from 'esbuild';
import {mkdir, mkdtemp, readFile, writeFile} from 'fs/promises';
import path from 'path';
import rimraf from 'rimraf';
import {job} from './internal/job.js';

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

  await job('', async ({name, inputs, outputs}) => {
    const tmp = await mkdtemp(name);
    await esbuild.build({
      entryPoints: [inputs[0]!],
      bundle: true,
      outdir: tmp,
      format: 'cjs',
      platform: 'browser',
      target: 'ES2019',
    });
    const baseName = path.basename(inputs[0]!);
    const content = await readFile(
      path.join(tmp, baseName.replace('.ts', '.js')),
      'utf-8'
    );
    const scriptContent = `/** @internal */
export const source = ${JSON.stringify(content)};
`;
    await writeFile(outputs[0]!, scriptContent);
    await rimraf.sync(tmp);
  })
    .inputs(['src/injected/**.ts'])
    .outputs(['src/generated/injected.ts'])
    .build();

  job('', async ({inputs, outputs}) => {
    const version = JSON.parse(await readFile(inputs[0]!, 'utf8')).version;
    await writeFile(
      outputs[0]!,
      (
        await readFile(outputs[0]!, {
          encoding: 'utf-8',
        })
      ).replace("'NEXT'", `v${version}`)
    );
  })
    .inputs(['package.json'])
    .outputs(['versions.js'])
    .build();

  job('', async ({inputs, outputs}) => {
    const version = JSON.parse(await readFile(inputs[0]!, 'utf8')).version;
    await writeFile(
      outputs[0]!,
      (await readFile(inputs[1]!, 'utf8')).replace('PACKAGE_VERSION', version)
    );
  })
    .inputs(['package.json', 'src/templates/version.ts.tmpl'])
    .outputs(['src/generated/version.ts'])
    .build();
})();
