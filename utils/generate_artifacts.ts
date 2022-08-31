#!/usr/bin/env node
import {writeFile} from 'fs/promises';
import {job} from './internal/job.js';
import {spawnAndLog} from './internal/util.js';

(async () => {
  job('', async ({outputs}) => {
    await writeFile(outputs[0]!, '{"type": "module"}');
  })
    .outputs(['lib/esm/package.json'])
    .build();

  job('', async ({outputs}) => {
    spawnAndLog('api-extractor', 'run', '--local');
    spawnAndLog(
      'eslint',
      '--ext=ts',
      '--no-ignore',
      '--no-eslintrc',
      '-c=.eslintrc.types.cjs',
      '--fix',
      outputs[0]!
    );
  })
    .inputs(['lib/esm/puppeteer/types.d.ts'])
    .outputs(['lib/types.d.ts', 'docs/puppeteer.api.json'])
    .build();
})();
