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
const util = require('util');
const fs = require('fs');

const readFileAsync = util.promisify(fs.readFile);
const readdirAsync = util.promisify(fs.readdir);
const writeFileAsync = util.promisify(fs.writeFile);

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
   * @returns {string}
   */
  filePath() {
    return this._filePath;
  }

  /**
   * @returns {string}
   */
  projectPath() {
    return this._projectPath;
  }

  /**
   * @returns {string}
   */
  name() {
    return this._name;
  }

  /**
   * @param {string} text
   * @returns {boolean}
   */
  setText(text) {
    if (text === this._text) return false;
    this._hasUpdatedText = true;
    this._text = text;
    return true;
  }

  /**
   * @returns {string}
   */
  text() {
    return this._text;
  }

  /**
   * @returns {boolean}
   */
  hasUpdatedText() {
    return this._hasUpdatedText;
  }

  async save() {
    await writeFileAsync(this.filePath(), this.text());
  }

  /**
   * @param {string} filePath
   * @returns {!Promise<Source>}
   */
  static async readFile(filePath) {
    filePath = path.resolve(filePath);
    const text = await readFileAsync(filePath, { encoding: 'utf8' });
    return new Source(filePath, text);
  }

  /**
   * @param {string} dirPath
   * @param {string=} extension
   * @returns {!Promise<!Array<!Source>>}
   */
  static async readdir(dirPath, extension = '') {
    const fileNames = await readdirAsync(dirPath);
    const filePaths = fileNames
      .filter((fileName) => fileName.endsWith(extension))
      .map((fileName) => path.join(dirPath, fileName))
      .filter((filePath) => {
        const stats = fs.lstatSync(filePath);
        return stats.isDirectory() === false;
      });
    return Promise.all(filePaths.map((filePath) => Source.readFile(filePath)));
  }
}
module.exports = Source;
