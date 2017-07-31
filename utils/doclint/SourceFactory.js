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

const path = require('path');
const fs = require('fs');

const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const writeFileAsync = promisify(fs.writeFile);

const PROJECT_DIR = path.join(__dirname, '..', '..');

class Source {
  /**
   * @param {string} filePath
   * @param {string} text
   */
  constructor(filePath, text) {
    this._filePath = filePath;
    this._projectPath = path.relative(PROJECT_DIR, filePath);
    this._name = path.basename(filePath);
    this._text = text;
    this._hasUpdatedText = false;
  }

  /**
   * @return {string}
   */
  filePath() {
    return this._filePath;
  }

  /**
   * @return {string}
   */
  projectPath() {
    return this._projectPath;
  }

  /**
   * @return {string}
   */
  name() {
    return this._name;
  }

  /**
   * @param {string} text
   * @return {boolean}
   */
  setText(text) {
    if (text === this._text)
      return false;
    this._hasUpdatedText = true;
    this._text = text;
    return true;
  }

  /**
   * @return {string}
   */
  text() {
    return this._text;
  }

  /**
   * @return {boolean}
   */
  hasUpdatedText() {
    return this._hasUpdatedText;
  }
}

class SourceFactory {
  constructor() {
    this._sources = new Map();
  }

  /**
   * @return {!Array<!Source>}
   */
  sources() {
    return Array.from(this._sources.values());
  }

  /**
   * @return {!Promise<boolean>}
   */
  async saveChangedSources() {
    const changedSources = Array.from(this._sources.values()).filter(source => source.hasUpdatedText());
    if (!changedSources.length)
      return false;
    await Promise.all(changedSources.map(source => writeFileAsync(source.filePath(), source.text())));
    return true;
  }

  /**
   * @param {string} filePath
   * @return {!Promise<Source>}
   */
  async readFile(filePath) {
    filePath = path.resolve(filePath);
    let source = this._sources.get(filePath);
    if (!source) {
      const text = await readFileAsync(filePath, {encoding: 'utf8'});
      source = new Source(filePath, text);
      this._sources.set(filePath, source);
    }
    return source;
  }

  /**
   * @param {string} dirPath
   * @param {string=} extension
   * @return {!Promise<!Array<!Source>>}
   */
  async readdir(dirPath, extension = '') {
    const fileNames = await readdirAsync(dirPath);
    const filePaths = fileNames.filter(fileName => fileName.endsWith(extension)).map(fileName => path.join(dirPath, fileName));
    return Promise.all(filePaths.map(filePath => this.readFile(filePath)));
  }

  /**
   * @param {string} filePath
   * @param {string} text
   * @return {!Source}
   */
  createForTest(filePath, text) {
    return new Source(filePath, text);
  }
}

/**
 * @param {function(?)} nodeFunction
 * @return {function(?):!Promise<?>}
 */
function promisify(nodeFunction) {
  /**
   * @param {!Array<?>} options
   * @return {!Promise<?>}
   */
  return function(...options) {
    return new Promise(function(fulfill, reject) {
      options.push(callback);
      nodeFunction.call(null, ...options);
      function callback(err, result) {
        if (err)
          reject(err);
        else
          fulfill(result);
      }
    });
  };
}

module.exports = SourceFactory;
