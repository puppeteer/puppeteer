import {execSync} from 'child_process';

import {
  createMultiSandbox,
  createSingleSandbox,
  runSchematicsSmoke,
} from './sandbox.mjs';

if (process.env.CI) {
  execSync('npm install -g @angular/cli@latest');
  execSync('npm install -g @angular-devkit/schematics-cli');
}

const [single, multi] = await Promise.all([
  createSingleSandbox(),
  createMultiSandbox(),
]);

await runSchematicsSmoke(single);
await runSchematicsSmoke(multi);
