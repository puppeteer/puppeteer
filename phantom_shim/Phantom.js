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
const vm = require('vm');
const url = require('url');

const VERSION = [0, 0, 1];

module.exports.version = VERSION;

/**
 * @param {!Object} context
 * @param {string} scriptPath
 */
module.exports.create = function(context, scriptPath) {
  const phantom = {
    page: {
      onConsoleMessage: null,
    },

    /**
     * @param {string} relative
     * @param {string} base
     * @return {string}
     */
    resolveRelativeUrl: function(relative, base) {
      return url.resolve(base, relative);
    },

    /**
     * @param {string} url
     * @return {string}
     */
    fullyDecodeUrl: function(url) {
      return decodeURI(url);
    },

    libraryPath: path.dirname(scriptPath),

    onError: null,

    /**
     * @return {string}
     */
    get outputEncoding() {
      return 'UTF-8';
    },

    /**
     * @param {string} value
     */
    set outputEncoding(value) {
      throw new Error('Phantom.outputEncoding setter is not implemented');
    },

    /**
     * @return {boolean}
     */
    get cookiesEnabled() {
      return true;
    },

    /**
     * @param {boolean} value
     */
    set cookiesEnabled(value) {
      throw new Error('Phantom.cookiesEnabled setter is not implemented');
    },

    /**
     * @return {!{major: number, minor: number, patch: number}}
     */
    get version() {
      return {
        major: VERSION[0],
        minor: VERSION[1],
        patch: VERSION[2],
      };
    },

    /**
     * @param {number=} code
     */
    exit: function(code) {
      process.exit(code);
    },

    /**
     * @param {string} filePath
     * @return {boolean}
     */
    injectJs: function(filePath) {
      filePath = path.resolve(phantom.libraryPath, filePath);
      if (!fs.existsSync(filePath))
        return false;
      let code = fs.readFileSync(filePath, 'utf8');
      if (code.startsWith('#!'))
        code = code.substring(code.indexOf('\n'));
      vm.runInContext(code, context, {
        filename: filePath,
        displayErrors: true
      });
      return true;
    },

    /**
     * @param {string} moduleSource
     * @param {string} filename
     */
    loadModule: function(moduleSource, filename) {
      const code = [
        '(function(require, exports, module) {\n',
        moduleSource,
        '\n}.call({},',
        'require.cache[\'' + filename + '\']._getRequire(),',
        'require.cache[\'' + filename + '\'].exports,',
        'require.cache[\'' + filename + '\']',
        '));'
      ].join('');
      vm.runInContext(code, context, {
        filename: filename,
        displayErrors: true
      });
    },
  };
  return phantom;
};
