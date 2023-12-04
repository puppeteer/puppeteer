import {execSync} from 'child_process';

import {runNgSchematicsSandbox} from './sandbox.mjs';

if (process.env.CI) {
  execSync('npm install -g @angular/cli@latest');
  execSync('npm install -g @angular-devkit/schematics-cli');
}

await Promise.all([
  runNgSchematicsSandbox({
    isInit: true,
  }),
  runNgSchematicsSandbox({
    isInit: true,
    isMulti: true,
  }),
]);

await runNgSchematicsSandbox({
  isSmoke: true,
});

await runNgSchematicsSandbox({
  isMulti: true,
  isSmoke: true,
});
