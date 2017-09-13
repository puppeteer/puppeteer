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

copyFolder(path.join(__dirname, '..', '..', 'lib'), path.join(__dirname, '..', '..', 'node6'));
copyFolder(path.join(__dirname, '..', '..', 'test'), path.join(__dirname, '..', '..', 'node6-test'));


function copyFolder(source, target) {
  if (fs.existsSync(target))
    removeRecursive(target);
  fs.mkdirSync(target);

  fs.readdirSync(source).forEach(file => {
    const from = path.join(source, file);
    const to = path.join(target, file);
    if (fs.lstatSync(from).isDirectory()) {
      copyFolder(from, to);
    } else {
      let text = fs.readFileSync(from);
      if (file.endsWith('.js'))
        text = transformAsyncFunctions(text.toString()).replace(/require\('\.\.\/lib\//g, `require('../node6/`);
      fs.writeFileSync(to, text);
    }
  });
}
