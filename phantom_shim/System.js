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

const readline = require('readline');
const await = require('./utilities').await;
const os = require('os');

class System {
  /**
     * @param {!Array<string>} args
     */
  constructor(args) {
    this.args = args;
    this.env = {};
    Object.assign(this.env, process.env);
    this.stdin = new StandardInput(process.stdin);
    this.stdout = new StandardOutput(process.stdout);
    this.stderr = new StandardOutput(process.stderr);
    this.platform = 'phantomjs';
    this.pid = process.pid;
    this.isSSLSupported = false;
    this.os = {
      architecture: os.arch(),
      name: os.type(),
      version: os.release()
    };
  }
}

class StandardInput {
  /**
     * @param {!Readable} readableStream
     */
  constructor(readableStream) {
    this._readline = readline.createInterface({
      input: readableStream
    });
    this._lines = [];
    this._closed = false;
    this._readline.on('line', line => this._lines.push(line));
    this._readline.on('close', () => this._closed = true);
  }

  /**
     * @return {string}
     */
  readLine() {
    if (this._closed && !this._lines.length)
      return '';
    if (!this._lines.length) {
      const linePromise = new Promise(fulfill => this._readline.once('line', fulfill));
      await(linePromise);
    }
    return this._lines.shift();
  }

  /**
     * @return {string}
     */
  read() {
    if (!this._closed) {
      const closePromise = new Promise(fulfill => this._readline.once('close', fulfill));
      await(closePromise);
    }
    const text = this._lines.join('\n');
    this._lines = [];
    return text;
  }

  close() {
    this._readline.close();
  }
}

class StandardOutput {
  /**
     * @param {!Writable} writableStream
     */
  constructor(writableStream) {
    this._stream = writableStream;
  }

  /**
     * @param {string} data
     */
  write(data) {
    this._stream.write(data);
  }

  /**
     * @param {string} data
     */
  writeLine(data) {
    this._stream.write(data + '\n');
  }

  flush() {
  }

  close() {
    this._stream.end();
  }
}

module.exports = System;
