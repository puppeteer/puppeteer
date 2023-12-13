import {execSync} from 'child_process';

import {runNgSchematicsSandbox} from './sandbox.mjs';

if (process.env.CI) {
  execSync('npm install -g @angular/cli@latest');
  execSync('npm install -g @angular-devkit/schematics-cli');
}

await Promise.all([
  runNgSchematicsSandbox({
    isMulti: false,
    isInit: true,
  }),
  runNgSchematicsSandbox({
    isMulti: true,
    isInit: true,
  }),
]);

await runNgSchematicsSandbox({
  isMulti: false,
  isSmoke: true,
});

await runNgSchematicsSandbox({
  isMulti: true,
  isSmoke: true,
});
