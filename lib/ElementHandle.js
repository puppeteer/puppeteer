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
const {helper} = require('./helper');

class ElementHandle {
  /**
   * @param {!Frame} frame
   * @param {!Connection} client
   * @param {!Object} remoteObject
   * @param {!Mouse} mouse
   * @param {!Touchscreen} touchscreen;
   */
  constructor(frame, client, remoteObject, mouse, touchscreen) {
    this._frame = frame;
    this._client = client;
    this._remoteObject = remoteObject;
    this._mouse = mouse;
    this._touchscreen = touchscreen;
    this._disposed = false;
  }

  /**
   * @return {?string}
   */
  _remoteObjectId() {
    return this._disposed ? null : this._remoteObject.objectId;
  }

  async dispose() {
    if (this._disposed)
      return;
    this._disposed = true;
    await helper.releaseObject(this._client, this._remoteObject);
  }

  /**
   * @return {!Promise<{x: number, y: number}>}
   */
  async _visibleCenter() {
    const box = await this.boundingBox();
    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2
    };
  }

  async hover() {
    const {x, y} = await this._visibleCenter();
    await this._mouse.move(x, y);
  }

  /**
   * @param {!Object=} options
   */
  async click(options) {
    const {x, y} = await this._visibleCenter();
    await this._mouse.click(x, y, options);
  }

  /**
   * @param {!Array<string>} filePaths
   * @return {!Promise}
   */
  async uploadFile(...filePaths) {
    const files = filePaths.map(filePath => path.resolve(filePath));
    const objectId = this._remoteObject.objectId;
    return this._client.send('DOM.setFileInputFiles', { objectId, files });
  }

  async tap() {
    const {x, y} = await this._visibleCenter();
    await this._touchscreen.tap(x, y);
  }

  /**
   * @return {!Promise<Object>}
   */
  async boundingBox() {
    const success = await this._frame.evaluate(element => {
      if (!element.ownerDocument.contains(element))
        return false;
      element.scrollIntoViewIfNeeded();
      return true;
    }, this);
    if (!success)
      throw new Error('Element is detached from DOM');

    const boxModel = await this._client.send('DOM.getBoxModel', { objectId: this._remoteObjectId() });
    if (!boxModel || !boxModel.model)
      return null;
    return {
      x: boxModel.model.margin[0],
      y: boxModel.model.margin[1],
      width: boxModel.model.width,
      height: boxModel.model.height
    };
  }
}

module.exports = ElementHandle;
helper.tracePublicAPI(ElementHandle);
