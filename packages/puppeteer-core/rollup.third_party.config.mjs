/**
 * Copyright 2022 Google Inc. All rights reserved.
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
import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import {globSync} from 'glob';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const configs = [];

// Note we don't use path.join here. We cannot since `glob` does not support
// the backslash path separator.
for (const file of globSync(`lib/esm/third_party/**/*.js`)) {
  configs.push({
    input: file,
    output: [
      {
        file,
        format: 'esm',
      },
      {
        file: file.replace('/esm/', '/cjs/'),
        format: 'cjs',
      },
    ],
    plugins: [
      terser(),
      nodeResolve(),
      // This is used internally within the polyfill. It gets ignored for the
      // most part via this plugin.
      nodePolyfills({include: ['util']}),
      commonjs({
        transformMixedEsModules: true,
      }),
    ],
  });
}

export default configs;
