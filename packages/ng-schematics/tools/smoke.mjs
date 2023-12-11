import {execSync} from 'child_process';

import {AngularProjectMulti, AngularProjectSingle} from './projects.mjs';

if (process.env.CI) {
  // Need to install in CI
  execSync('npm install -g @angular/cli@latest');
  execSync('npm install -g @angular-devkit/schematics-cli');
}

const single = new AngularProjectSingle();
const multi = new AngularProjectMulti();

await Promise.all([single.create(), multi.create()]);
await Promise.all([single.runSmoke(), multi.runSmoke()]);
