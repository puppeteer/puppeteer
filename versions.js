/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const versionsPerRelease = new Map([
  // This is a mapping from Chromium version => Puppeteer version.
  // In Chromium roll patches, use 'v16.1.1' for the Puppeteer version.
  ['105.0.5173.0', 'v15.5.0'],
  ['104.0.5109.0', 'v15.1.0'],
  ['103.0.5059.0', 'v14.2.0'],
  ['102.0.5002.0', 'v14.0.0'],
  ['101.0.4950.0', 'v13.6.0'],
  ['100.0.4889.0', 'v13.5.0'],
  ['99.0.4844.16', 'v13.2.0'],
  ['98.0.4758.0', 'v13.1.0'],
  ['97.0.4692.0', 'v12.0.0'],
  ['93.0.4577.0', 'v10.2.0'],
  ['92.0.4512.0', 'v10.0.0'],
  ['91.0.4469.0', 'v9.0.0'],
  ['90.0.4427.0', 'v8.0.0'],
  ['90.0.4403.0', 'v7.0.0'],
  ['89.0.4389.0', 'v6.0.0'],
  ['88.0.4298.0', 'v5.5.0'],
  ['87.0.4272.0', 'v5.4.0'],
  ['86.0.4240.0', 'v5.3.0'],
  ['85.0.4182.0', 'v5.2.1'],
  ['84.0.4147.0', 'v5.1.0'],
  ['83.0.4103.0', 'v3.1.0'],
  ['81.0.4044.0', 'v3.0.0'],
  ['80.0.3987.0', 'v2.1.0'],
  ['79.0.3942.0', 'v2.0.0'],
  ['78.0.3882.0', 'v1.20.0'],
  ['77.0.3803.0', 'v1.19.0'],
  ['76.0.3803.0', 'v1.17.0'],
  ['75.0.3765.0', 'v1.15.0'],
  ['74.0.3723.0', 'v1.13.0'],
  ['73.0.3679.0', 'v1.12.2'],
]);

// The same major version as the current Chrome Stable per https://chromestatus.com/roadmap.
const lastMaintainedChromiumVersion = '103.0.5059.0';

if (!versionsPerRelease.has(lastMaintainedChromiumVersion)) {
  throw new Error(
    'lastMaintainedChromiumVersion is missing from versionsPerRelease'
  );
}

module.exports = {
  versionsPerRelease,
  lastMaintainedChromiumVersion,
};
