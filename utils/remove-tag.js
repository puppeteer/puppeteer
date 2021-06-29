#!/usr/bin/env node
/**
 * Copyright 2018 Google Inc. All rights reserved.
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
const glob = require('glob');
const fs = require('fs');

//look for all .md files in the given location.
const files = glob.sync(`./new-docs/*.md`);

files.forEach(function (file) {
  const str = file;
  const data = fs.readFileSync(str, 'utf-8');
  const newValue = data.replace(/<!-- -->/gim, '');

  //overwrite <!-- --> syntax with empty string  in.md files.
  fs.writeFileSync(str, newValue, 'utf-8', function (err, data) {
    if (err) throw err;
    console.log('Done!');
  });
});
