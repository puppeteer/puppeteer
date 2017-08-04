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
const helper = require('./helper');

class RemoteElement {
  /**
   * @param {!Connection} client
   * @param {!Promise<?Object>} remoteObject
   * @param {!Mouse} mouse
   */
  constructor(client, remoteObject, mouse) {
    this._client = client;
    this._remoteObject = remoteObject;
    this._mouse = mouse;
  }

  /**
   * @return {!Promise<{x: number, y: number}>}
   */
  _visibleCenter() {
    return this.eval(element => {
      element.scrollIntoViewIfNeeded();
      let rect = element.getBoundingClientRect();
      if (!rect.top && !rect.right && !rect.bottom && !rect.left)
        throw new Error('Element is not visible.');
      return {
        x: (Math.max(rect.left, 0) + Math.min(rect.right, window.innerWidth)) / 2,
        y: (Math.max(rect.top, 0) + Math.min(rect.bottom, window.innerHeight)) / 2
      };
    });
  }

  /**
   * @param {!Object=} options
   * @return {!Promise}
   */
  async click(options) {
    let {x, y} = await this._visibleCenter();
    await this._mouse.click(x, y, options);
  }

  /**
   * @param {function()} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async eval(pageFunction, ...args) {
    let { exceptionDetails, result: remoteObject }  = await this._client.send('Runtime.callFunctionOn', {
      objectId: (await this._remoteObject).objectId,
      functionDeclaration: `function() {return (${pageFunction})(${args.map(x => JSON.stringify(x)).concat('this').join(',')}); }`,
      returnByValue: false
    });
    if (exceptionDetails)
      throw new Error('Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails));
    return await helper.serializeRemoteObject(this._client, remoteObject);
  }

  async hover() {
    let {x, y} = await this._visibleCenter();
    await this._mouse.move(x, y);
  }

  async focus() {
    await this.eval(element => element.focus());
  }

  /**
   * @param {!Array<string>} filePaths
   * @return {!Promise}
   */
  async uploadFile(...filePaths) {
    filePaths = filePaths.map(filePath => path.resolve(filePath));
    return this._client.send('DOM.setFileInputFiles', {
      files: filePaths,
      objectId: (await this._remoteObject).objectId
    });
  }

  /**
   * @return {!Promise}
   */
  release() {
    let promise = helper.releaseObject(this._client, this._remoteObject);
    this._remoteObject = Promise.reject(new Error('Element was released.'));
    return promise;
  }
}

module.exports = RemoteElement;
helper.tracePublicAPI(RemoteElement);
