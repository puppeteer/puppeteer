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
const deasync = require('deasync');
const removeRecursive = require('rimraf').sync;
const copyRecursive = deasync(require('ncp').ncp);

class FileSystem {
  constructor() {
    this.separator = path.sep;
  }

  /**
     * @return {string}
     */
  get workingDirectory() {
    return process.cwd();
  }

  /**
     * @param {string} directoryPath
     */
  changeWorkingDirectory(directoryPath) {
    try {
      process.chdir(directoryPath);
      return true;
    } catch (e){
      return false;
    }
  }

  /**
     * @param {string} relativePath
     * @return {string}
     */
  absolute(relativePath) {
    relativePath = path.normalize(relativePath);
    if (path.isAbsolute(relativePath))
      return relativePath;
    return path.resolve(path.join(process.cwd(), relativePath));
  }

  /**
     * @param {string} filePath
     * @return {boolean}
     */
  exists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
     * @param {string} fromPath
     * @param {string} toPath
     */
  copy(fromPath, toPath) {
    const content = fs.readFileSync(fromPath);
    fs.writeFileSync(toPath, content);
  }

  /**
     * @param {string} fromPath
     * @param {string} toPath
     */
  move(fromPath, toPath) {
    const content = fs.readFileSync(fromPath);
    fs.writeFileSync(toPath, content);
    fs.unlinkSync(fromPath);
  }

  /**
     * @param {string} filePath
     * @return {number}
     */
  size(filePath) {
    return fs.statSync(filePath).size;
  }

  /**
     * @param {string} filePath
     */
  touch(filePath) {
    fs.closeSync(fs.openSync(filePath, 'a'));
  }

  /**
     * @param {string} filePath
     */
  remove(filePath) {
    fs.unlinkSync(filePath);
  }

  /**
     * @param {string} filePath
     * @return {boolean}
     */
  lastModified(filePath) {
    return fs.statSync(filePath).mtime;
  }

  /**
     * @param {string} dirPath
     * @return {boolean}
     */
  makeDirectory(dirPath) {
    try {
      fs.mkdirSync(dirPath);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
     * @param {string} dirPath
     * @return {boolean}
     */
  makeTree(dirPath) {
    return this.makeDirectory(dirPath);
  }

  /**
     * @param {string} dirPath
     */
  removeTree(dirPath) {
    removeRecursive(dirPath);
  }

  /**
     * @param {string} fromPath
     * @param {string} toPath
     */
  copyTree(fromPath, toPath) {
    copyRecursive(fromPath, toPath);
  }

  /**
     * @param {string} dirPath
     * @return {!Array<string>}
     */
  list(dirPath) {
    return fs.readdirSync(dirPath);
  }

  /**
     * @param {string} linkPath
     * @return {string}
     */
  readLink(linkPath) {
    return fs.readlinkSync(linkPath);
  }

  /**
     * @param {string} filePath
     * @param {Object} data
     * @param {string} mode
     */
  write(filePath, data, mode) {
    const fd = new FileDescriptor(filePath, mode, 'utf8');
    fd.write(data);
    fd.close();
  }

  /**
     * @param {string} somePath
     * @return {boolean}
     */
  isAbsolute(somePath) {
    return path.isAbsolute(somePath);
  }

  /**
     * @return {string}
     */
  read(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
     * @param {string} filePath
     * @return {boolean}
     */
  isFile(filePath) {
    return fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
  }

  /**
     * @param {string} dirPath
     * @return {boolean}
     */
  isDirectory(dirPath) {
    return fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();
  }

  /**
     * @param {string} filePath
     * @return {boolean}
     */
  isLink(filePath) {
    return fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink();
  }

  /**
     * @param {string} filePath
     * @return {boolean}
     */
  isReadable(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
     * @param {string} filePath
     * @return {boolean}
     */
  isWritable(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.W_OK);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
     * @param {string} filePath
     * @return {boolean}
     */
  isExecutable(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.X_OK);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
     * @param {string} somePath
     * @return {!Array<string>}
     */
  split(somePath) {
    somePath = path.normalize(somePath);
    if (somePath.endsWith(path.sep))
      somePath = somePath.substring(0, somePath.length - path.sep.length);
    return somePath.split(path.sep);
  }

  /**
     * @param {string} path1
     * @param {string} path2
     * @return {string}
     */
  join(...args) {
    if (args[0] === '' && args.length > 1)
      args[0] = path.sep;
    args = args.filter(part => typeof part === 'string');
    return path.join.apply(path, args);
  }

  /**
     * @param {string} filePath
     * @param {(string|!Object)} option
     * @return {!FileDescriptor}
     */
  open(filePath, option) {
    if (typeof option === 'string')
      return new FileDescriptor(filePath, option);
    return new FileDescriptor(filePath, option.mode);
  }
}

const fdwrite = deasync(fs.write);
const fdread = deasync(fs.read);

class FileDescriptor {
  /**
     * @param {string} filePath
     * @param {string} mode
     */
  constructor(filePath, mode) {
    this._position = 0;
    this._encoding = 'utf8';
    if (mode === 'rb') {
      this._mode = 'r';
      this._encoding = 'latin1';
    } else if (mode === 'wb' || mode === 'b') {
      this._mode = 'w';
      this._encoding = 'latin1';
    } else if (mode === 'rw+') {
      this._mode = 'a+';
      this._position = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    } else {
      this._mode = mode;
    }
    this._fd = fs.openSync(filePath, this._mode);
  }

  /**
     * @param {string} data
     */
  write(data) {
    const buffer = Buffer.from(data, this._encoding);
    const written = fdwrite(this._fd, buffer, 0, buffer.length, this._position);
    this._position += written;
  }

  getEncoding() {
    return 'UTF-8';
  }

  /**
     * @param {string} data
     */
  writeLine(data) {
    this.write(data + '\n');
  }

  /**
     * @param {number=} size
     * @return {string}
     */
  read(size) {
    let position = this._position;
    if (!size) {
      size = fs.fstatSync(this._fd).size;
      position = 0;
    }
    const buffer = new Buffer(size);
    const bytesRead = fdread(this._fd, buffer, 0, size, position);
    this._position += bytesRead;
    return buffer.toString(this._encoding);
  }

  flush() {
    // noop.
  }

  /**
     * @param {number} position
     */
  seek(position) {
    this._position = position;
  }

  close() {
    fs.closeSync(this._fd);
  }

  /**
     * @return {boolean}
     */
  atEnd() {
  }
}

module.exports = FileSystem;
