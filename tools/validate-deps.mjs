/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteerPackageJson from '../packages/puppeteer/package.json' with {type: 'json'};
import puppeteerCorePackageJson from '../packages/puppeteer-core/package.json' with {type: 'json'};

const syncDeps = ['chromium-bidi', 'devtools-protocol', 'typed-query-selector'];
const syncDevDeps = ['@types/node'];

const areDepsSynced = ({
  depsToCheck,
  firstPackage,
  secondPackage,
  depsType = 'dependencies',
}) => {
  let noError = true;
  for (const dep of depsToCheck) {
    if (!firstPackage[depsType][dep]) {
      console.log(`Dependency ${dep} does not exit in ${firstPackage['name']}`);
      noError = false;
    }
    if (!secondPackage[depsType][dep]) {
      console.log(
        `Dependency ${dep} does not exit in ${secondPackage['name']}`,
      );
      noError = false;
    }

    if (firstPackage[depsType][dep] !== secondPackage[depsType][dep]) {
      console.log(`Dependency ${dep} not synced.`);
      noError = false;
    }
  }

  return noError;
};

const resultDeps = areDepsSynced({
  depsToCheck: syncDeps,
  firstPackage: puppeteerCorePackageJson,
  secondPackage: puppeteerPackageJson,
});
const resultDevDeps = areDepsSynced({
  depsToCheck: syncDevDeps,
  firstPackage: puppeteerCorePackageJson,
  secondPackage: puppeteerPackageJson,
  depsType: 'devDependencies',
});

process.exit(resultDeps && resultDevDeps ? 0 : 1);
