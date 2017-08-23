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

const dirPath = 'lib';
const outPath = path.resolve('node6');
const fileNames = fs.readdirSync(path.resolve(dirPath));
const filePaths = fileNames.filter(fileName => fileName.endsWith('.js'));

if (fs.existsSync(outPath))
  removeRecursive(outPath);
fs.mkdirSync(outPath);

filePaths.forEach(filePath => {
  let content = fs.readFileSync(path.resolve(dirPath, filePath)).toString();
  let output = transformAsyncFunctions(content);
  fs.writeFile(path.resolve(outPath, filePath), output, function() {});
});

