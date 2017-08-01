/**
 * Copyright 2017 Google Inc. All rights reserved.
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

(async function main() {

const Browser = require('../lib/Browser');
const browser = new Browser();
const page = await browser.newPage();
const profiler = page.profiler();

await profiler.startCpuProfile();
await page.navigate('https://google.com');
const profile = await profiler.stopCpuProfile();

const duration = profile.endTime - profile.startTime;
console.log(`Profile duration: ${duration / 1000 | 0} msec\n`);

console.log(`  Hits\tFunction name`);
console.log('-'.repeat(24));
const functions = profile.nodes.sort((a, b) => b.hitCount - a.hitCount);
for (const f of functions.slice(0, 20))
  console.log(`  ${f.hitCount}\t${f.callFrame.functionName || '<anonymous>'}`);

browser.close();

})();
