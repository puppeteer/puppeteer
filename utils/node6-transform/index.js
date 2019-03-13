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

const fs = require('fs');
const path = require('path');
const removeRecursive = require('rimraf').sync;
const transformAsyncFunctions = require('./TransformAsyncFunctions');

const root = path.join(__dirname, '..', '..');
const dest = path.join(__dirname, '..', '..', 'node6');

const excludes = [
  path.resolve(root, 'test', 'assets'),
];

if (fs.existsSync(dest))
  removeRecursive(dest);
fs.mkdirSync(dest);
fs.mkdirSync(path.join(dest, 'utils'));

copyFolder(path.join(root, 'lib'), path.join(dest, 'lib'));
copyFolder(path.join(root, 'test'), path.join(dest, 'test'));
copyFolder(path.join(root, 'utils', 'testrunner'), path.join(dest, 'utils', 'testrunner'));
copyFolder(path.join(root, 'utils', 'testserver'), path.join(dest, 'utils', 'testserver'));

function copyFolder(source, target) {
  if (fs.existsSync(target))
    removeRecursive(target);
  fs.mkdirSync(target);

  fs.readdirSync(source).forEach(file => {
    const from = path.join(source, file);
    const to = path.join(target, file);
    if (fs.lstatSync(from).isDirectory())
      copyFolder(from, to);
    else
      copyFile(from, to);
  });
}

function copyFile(from, to) {
  let text = fs.readFileSync(from);
  const isExcluded = excludes.some(exclude => from.startsWith(exclude));
  if (!isExcluded && from.endsWith('.js')) {
    text = text.toString();
    const prefix = text.startsWith('#!') ? text.substring(0, text.indexOf('\n')) : '';
    text = prefix + transformAsyncFunctions(text.substring(prefix.length));
  }
  fs.writeFileSync(to, text);
}
