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
const {JSHandle} = require('./ExecutionContext');
const {helper} = require('./helper');

class ElementHandle extends JSHandle {
  /**
   * @param {Puppeteer.ExecutionContext} context
   * @param {Puppeteer.Session} client
   * @param {!Object} remoteObject
   * @param {Puppeteer.Page} page
   */
  constructor(context, client, remoteObject, page) {
    super(context, client, remoteObject);
    this._client = client;
    this._remoteObject = remoteObject;
    this._page = page;
    this._disposed = false;
  }

  /**
   * @override
   * @return {?ElementHandle}
   */
  asElement() {
    return this;
  }

  /**
   * @return {!Promise<{x: number, y: number}>}
   */
  async _visibleCenter() {
    const error = await this.executionContext().evaluate(element => {
      if (!element.ownerDocument.contains(element))
        return 'Node is detached from document';
      if (element.nodeType !== Node.ELEMENT_NODE)
        return 'Node is not of type HTMLElement';
      element.scrollIntoViewIfNeeded();
    }, this);
    if (error)
      throw new Error(error);
    const {model} = await this._client.send('DOM.getBoxModel', {
      objectId: this._remoteObject.objectId
    });
    return {
      x: (model.content[0] + model.content[4]) / 2,
      y: (model.content[1] + model.content[5]) / 2
    };
  }

  async hover() {
    const {x, y} = await this._visibleCenter();
    await this._page.mouse.move(x, y);
  }

  /**
   * @param {!Object=} options
   */
  async click(options) {
    const {x, y} = await this._visibleCenter();
    await this._page.mouse.click(x, y, options);
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
    await this._page.touchscreen.tap(x, y);
  }

  async focus() {
    await this.executionContext().evaluate(element => element.focus(), this);
  }

  /**
   * @param {string} text
   * @param {{delay: (number|undefined)}=} options
   */
  async type(text, options) {
    await this.focus();
    await this._page.keyboard.type(text, options);
  }

  /**
   * @param {string} key
   * @param {!Object=} options
   */
  async press(key, options) {
    await this.focus();
    await this._page.keyboard.press(key, options);
  }
}

module.exports = ElementHandle;
helper.tracePublicAPI(ElementHandle);
