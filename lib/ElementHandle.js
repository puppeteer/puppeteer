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

  /**
   * @return {!Promise<ElementHandle>}
   */
  async _parentIFrameElementHandle() {
    if (!this._frame._parentFrame)
      return null;

    const rootElementHandle = await this._frame.$('*');
    const rootElementDescriptionHandle = await this._client.send('DOM.describeNode', { objectId: rootElementHandle._remoteObjectId() });
    const rootElementDescription = rootElementDescriptionHandle.node;

    const parentsIframes = await this._frame._parentFrame.$$('iframe');
    if (!parentsIframes.length)
      throw new Error('No iframe elements found in parent');

    for (const parentsIframe of parentsIframes) {
      const iframeDescriptionHandle = await this._client.send('DOM.describeNode', { objectId: parentsIframe._remoteObjectId(), pierce: true, depth: 2 });
      const iframesRootDescription = iframeDescriptionHandle.node.contentDocument.children[0];
      if (iframesRootDescription.backendNodeId === rootElementDescription.backendNodeId)
        return parentsIframe;
    }
    throw new Error('Error finding frame\'s root element in parent');
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
    let currentElement = this;
    let boundingBox = null;
    while (currentElement) {
      const elementBoundingRect = await currentElement._frame.evaluate((element, addBorder) => {
        if (!element.ownerDocument.contains(element))
          return null;
        element.scrollIntoViewIfNeeded();
        const rect = element.getBoundingClientRect();
        const style = element.currentStyle || window.getComputedStyle(element);
        return {
          x: Math.max(rect.x, 0) + (addBorder ? parseInt(style.borderLeftWidth, 10) : 0),
          y: Math.max(rect.y, 0) + (addBorder ? parseInt(style.borderTopWidth, 10) : 0),
          width: Math.min(rect.width, window.innerWidth),
          height: Math.min(rect.height, window.innerHeight)
        };
      }, currentElement, !!boundingBox);
      if (!elementBoundingRect)
        throw new Error('Element is detached from DOM');

      if (!boundingBox) {
        boundingBox = elementBoundingRect;
      } else {
        boundingBox.x += elementBoundingRect.x;
        boundingBox.y += elementBoundingRect.y;
      }
      currentElement = await currentElement._parentIFrameElementHandle();
    }
    return boundingBox;
  }
}

module.exports = ElementHandle;
helper.tracePublicAPI(ElementHandle);
