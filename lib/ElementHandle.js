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
const {helper, debugError} = require('./helper');

class ElementHandle extends JSHandle {
  /**
   * @param {!Puppeteer.ExecutionContext} context
   * @param {!Puppeteer.CDPSession} client
   * @param {!Protocol.Runtime.RemoteObject} remoteObject
   * @param {!Puppeteer.Page} page
   * @param {!Puppeteer.FrameManager} frameManager
   */
  constructor(context, client, remoteObject, page, frameManager) {
    super(context, client, remoteObject);
    this._client = client;
    this._remoteObject = remoteObject;
    this._page = page;
    this._frameManager = frameManager;
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
   * @return {!Promise<?Puppeteer.Frame>}
   */
  async contentFrame() {
    const nodeInfo = await this._client.send('DOM.describeNode', {
      objectId: this._remoteObject.objectId
    });
    if (typeof nodeInfo.node.frameId !== 'string')
      return null;
    return this._frameManager.frame(nodeInfo.node.frameId);
  }

  async _scrollIntoViewIfNeeded() {
    const error = await this.executionContext().evaluate(element => {
      if (!element.isConnected)
        return 'Node is detached from document';
      if (element.nodeType !== Node.ELEMENT_NODE)
        return 'Node is not of type HTMLElement';
      element.scrollIntoViewIfNeeded();
      return false;
    }, this);
    if (error)
      throw new Error(error);
  }

  /**
   * @return {!Promise<{x: number, y: number}>}
   */
  async _visibleCenter() {
    await this._scrollIntoViewIfNeeded();
    const box = await this._assertBoundingBox();
    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2
    };
  }

  /**
   * @return {!Promise<void|Protocol.DOM.getBoxModelReturnValue>}
   */
  _getBoxModel() {
    return this._client.send('DOM.getBoxModel', {
      objectId: this._remoteObject.objectId
    }).catch(error => debugError(error));
  }

  /**
   * @param {!Array<number>} quad
   * @return {!Array<object>}
   */
  _fromProtocolQuad(quad) {
    return [
      {x: quad[0], y: quad[1]},
      {x: quad[2], y: quad[3]},
      {x: quad[4], y: quad[5]},
      {x: quad[6], y: quad[7]}
    ];
  }

  async hover() {
    const {x, y} = await this._visibleCenter();
    await this._page.mouse.move(x, y);
  }

  /**
   * @param {!Object=} options
   */
  async click(options = {}) {
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

  /**
   * @return {!Promise<?{x: number, y: number, width: number, height: number}>}
   */
  async boundingBox() {
    const result = await this._getBoxModel();

    if (!result)
      return null;

    const quad = result.model.border;
    const x = Math.min(quad[0], quad[2], quad[4], quad[6]);
    const y = Math.min(quad[1], quad[3], quad[5], quad[7]);
    const width = Math.max(quad[0], quad[2], quad[4], quad[6]) - x;
    const height = Math.max(quad[1], quad[3], quad[5], quad[7]) - y;

    return {x, y, width, height};
  }

  /**
   * @return {!Promise<?object>}
   */
  async boxModel() {
    const result = await this._getBoxModel();

    if (!result)
      return null;

    const {content, padding, border, margin, width, height} = result.model;
    return {
      content: this._fromProtocolQuad(content),
      padding: this._fromProtocolQuad(padding),
      border: this._fromProtocolQuad(border),
      margin: this._fromProtocolQuad(margin),
      width,
      height
    };
  }

  /**
   * @return {!Promise<?{x: number, y: number, width: number, height: number}>}
   */
  async _assertBoundingBox() {
    const boundingBox = await this.boundingBox();
    if (boundingBox)
      return boundingBox;

    throw new Error('Node is either not visible or not an HTMLElement');
  }

  /**
   *
   * @param {!Object=} options
   * @returns {!Promise<Object>}
   */
  async screenshot(options = {}) {
    let needsViewportReset = false;

    let boundingBox = await this._assertBoundingBox();

    const viewport = this._page.viewport();

    if (boundingBox.width > viewport.width || boundingBox.height > viewport.height) {
      const newViewport = {
        width: Math.max(viewport.width, Math.ceil(boundingBox.width)),
        height: Math.max(viewport.height, Math.ceil(boundingBox.height)),
      };
      await this._page.setViewport(Object.assign({}, viewport, newViewport));

      needsViewportReset = true;
    }

    await this.executionContext().evaluate(function(element) {
      element.scrollIntoView({block: 'center', inline: 'center', behavior: 'instant'});
    }, this);

    boundingBox = await this._assertBoundingBox();

    const { layoutViewport: { pageX, pageY } } = await this._client.send('Page.getLayoutMetrics');

    const clip = Object.assign({}, boundingBox);
    clip.x += pageX;
    clip.y += pageY;

    const imageData = await this._page.screenshot(Object.assign({}, {
      clip
    }, options));

    if (needsViewportReset)
      await this._page.setViewport(viewport);

    return imageData;
  }

  /**
   * @param {string} selector
   * @return {!Promise<?ElementHandle>}
   */
  async $(selector) {
    const handle = await this.executionContext().evaluateHandle(
        (element, selector) => element.querySelector(selector),
        this, selector
    );
    const element = handle.asElement();
    if (element)
      return element;
    await handle.dispose();
    return null;
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $$(selector) {
    const arrayHandle = await this.executionContext().evaluateHandle(
        (element, selector) => element.querySelectorAll(selector),
        this, selector
    );
    const properties = await arrayHandle.getProperties();
    await arrayHandle.dispose();
    const result = [];
    for (const property of properties.values()) {
      const elementHandle = property.asElement();
      if (elementHandle)
        result.push(elementHandle);
    }
    return result;
  }

  /**
   * @param {string} expression
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $x(expression) {
    const arrayHandle = await this.executionContext().evaluateHandle(
        (element, expression) => {
          const document = element.ownerDocument || element;
          const iterator = document.evaluate(expression, element, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
          const array = [];
          let item;
          while ((item = iterator.iterateNext()))
            array.push(item);
          return array;
        },
        this, expression
    );
    const properties = await arrayHandle.getProperties();
    await arrayHandle.dispose();
    const result = [];
    for (const property of properties.values()) {
      const elementHandle = property.asElement();
      if (elementHandle)
        result.push(elementHandle);
    }
    return result;
  }
}

module.exports = ElementHandle;
helper.tracePublicAPI(ElementHandle);
