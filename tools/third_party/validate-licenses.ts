// The MIT License

// Copyright (c) 2010-2022 Google LLC. http://angular.io/license

// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Taken and adapted from https://github.com/angular/angular-cli/blob/173823d/scripts/validate-licenses.ts.

import * as path from 'path';

import checker from 'license-checker';
import spdxSatisfies from 'spdx-satisfies';

/**
 * A general note on some black listed specific licenses:
 *
 * - CC0 This is not a valid license. It does not grant copyright of the
 *   code/asset, and does not resolve patents or other licensed work. The
 *   different claims also have no standing in court and do not provide
 *   protection to or from Google and/or third parties. We cannot use nor
 *   contribute to CC0 licenses.
 * - Public Domain Same as CC0, it is not a valid license.
 */
const allowedLicenses = [
  // Regular valid open source licenses supported by Google.
  'MIT',
  'ISC',
  'Apache-2.0',
  'Python-2.0',
  'Artistic-2.0',
  'BlueOak-1.0.0',

  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSD-4-Clause',

  // All CC-BY licenses have a full copyright grant and attribution section.
  'CC-BY-3.0',
  'CC-BY-4.0',

  // Have a full copyright grant. Validated by opensource team.
  'Unlicense',
  'CC0-1.0',
  '0BSD',

  // Combinations.
  '(AFL-2.1 OR BSD-2-Clause)',
];

// Name variations of SPDX licenses that some packages have.
// Licenses not included in SPDX but accepted will be converted to MIT.
const licenseReplacements: {[key: string]: string} = {
  // Just a longer string that our script catches. SPDX official name is the shorter one.
  'Apache License, Version 2.0': 'Apache-2.0',
  Apache2: 'Apache-2.0',
  'Apache 2.0': 'Apache-2.0',
  'Apache v2': 'Apache-2.0',
  'AFLv2.1': 'AFL-2.1',
  // BSD is BSD-2-clause by default.
  BSD: 'BSD-2-Clause',
};

// Specific packages to ignore, add a reason in a comment. Format: package-name@version.
const ignoredPackages = [
  // * Development only
  'spdx-license-ids@3.0.5', // CC0 but it's content only (index.json, no code) and not distributed.
];

// Check if a license is accepted by an array of accepted licenses
function _passesSpdx(licenses: string[], accepted: string[]) {
  try {
    return spdxSatisfies(licenses.join(' AND '), accepted.join(' OR '));
  } catch {
    return false;
  }
}

function main(): Promise<number> {
  return new Promise(resolve => {
    const startFolder = path.join(__dirname, '..', '..');
    checker.init(
      {start: startFolder, excludePrivatePackages: true},
      (err: Error, json: object) => {
        if (err) {
          console.error(`Something happened:\n${err.message}`);
          resolve(1);
        } else {
          console.info(`Testing ${Object.keys(json).length} packages.\n`);

          // Packages with bad licenses are those that neither pass SPDX nor are ignored.
          const badLicensePackages = Object.keys(json)
            .map(key => {
              return {
                id: key,
                licenses: ([] as string[])
                  .concat((json[key] as {licenses: string[]}).licenses)
                  // `*` is used when the license is guessed.
                  .map(x => {
                    return x.replace(/\*$/, '');
                  })
                  .map(x => {
                    return x in licenseReplacements
                      ? licenseReplacements[x]
                      : x;
                  }),
              };
            })
            .filter(pkg => {
              return !_passesSpdx(pkg.licenses, allowedLicenses);
            })
            .filter(pkg => {
              return !ignoredPackages.find(ignored => {
                return ignored === pkg.id;
              });
            });

          // Report packages with bad licenses
          if (badLicensePackages.length > 0) {
            console.error('Invalid package licences found:');
            badLicensePackages.forEach(pkg => {
              console.error(`${pkg.id}: ${JSON.stringify(pkg.licenses)}`);
            });
            console.error(
              `\n${badLicensePackages.length} total packages with invalid licenses.`
            );
            resolve(2);
          } else {
            console.info('All package licenses are valid.');
            resolve(0);
          }
        }
      }
    );
  });
}

main().then(code => {
  return process.exit(code);
});
