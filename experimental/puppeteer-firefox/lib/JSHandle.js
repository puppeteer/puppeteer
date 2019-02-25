const {assert, debugError} = require('./helper');
const path = require('path');

class JSHandle {

  /**
   * @param {!ExecutionContext} context
   * @param {*} payload
   */
  constructor(context, payload) {
    this._context = context;
    this._session = this._context._session;
    this._executionContextId = this._context._executionContextId;
    this._objectId = payload.objectId;
    this._type = payload.type;
    this._subtype = payload.subtype;
    this._disposed = false;
    this._protocolValue = {
      unserializableValue: payload.unserializableValue,
      value: payload.value,
      objectId: payload.objectId,
    };
  }

  /**
   * @return {ExecutionContext}
   */
  executionContext() {
    return this._context;
  }

  /**
   * @override
   * @return {string}
   */
  toString() {
    if (this._objectId)
      return 'JSHandle@' + (this._subtype || this._type);
    return 'JSHandle:' + this._deserializeValue(this._protocolValue);
  }

  /**
   * @param {string} propertyName
   * @return {!Promise<?JSHandle>}
   */
  async getProperty(propertyName) {
    const objectHandle = await this._context.evaluateHandle((object, propertyName) => {
      const result = {__proto__: null};
      result[propertyName] = object[propertyName];
      return result;
    }, this, propertyName);
    const properties = await objectHandle.getProperties();
    const result = properties.get(propertyName) || null;
    await objectHandle.dispose();
    return result;
  }

  /**
   * @return {!Promise<Map<string, !JSHandle>>}
   */
  async getProperties() {
    const response = await this._session.send('Runtime.getObjectProperties', {
      executionContextId: this._executionContextId,
      objectId: this._objectId,
    });
    const result = new Map();
    for (const property of response.properties) {
      result.set(property.name, createHandle(this._context, property.value, null));
    }
    return result;
  }

  _deserializeValue({unserializableValue, value}) {
    if (unserializableValue === 'Infinity')
      return Infinity;
    if (unserializableValue === '-Infinity')
      return -Infinity;
    if (unserializableValue === '-0')
      return -0;
    if (unserializableValue === 'NaN')
      return NaN;
    return value;
  }

  async jsonValue() {
    if (!this._objectId)
      return this._deserializeValue(this._protocolValue);
    const simpleValue = await this._session.send('Runtime.callFunction', {
      executionContextId: this._executionContextId,
      returnByValue: true,
      functionDeclaration: (e => e).toString(),
      args: [this._protocolValue],
    });
    return this._deserializeValue(simpleValue.result);
  }

  /**
   * @return {?ElementHandle}
   */
  asElement() {
    return null;
  }

  async dispose() {
    if (!this._objectId)
      return;
    this._disposed = true;
    await this._session.send('Runtime.disposeObject', {
      executionContextId: this._executionContextId,
      objectId: this._objectId,
    }).catch(error => {
      // Exceptions might happen in case of a page been navigated or closed.
      // Swallow these since they are harmless and we don't leak anything in this case.
      debugError(error);
    });
  }
}

class ElementHandle extends JSHandle {
  /**
   * @param {Frame} frame
   * @param {ExecutionContext} context
   * @param {*} payload
   */
  constructor(frame, context, payload) {
    super(context, payload);
    this._frame = frame;
    this._frameId = frame._frameId;
  }

  /**
   * @return {?Frame}
   */
  async contentFrame() {
    const {frameId} = await this._session.send('Page.contentFrame', {
      frameId: this._frameId,
      objectId: this._objectId,
    });
    if (!frameId)
      return null;
    const frame = this._frame._frameManager.frame(frameId);
    return frame;
  }

  /**
   * @override
   * @return {!ElementHandle}
   */
  asElement() {
    return this;
  }

  /**
   * @return {!Promise<{width: number, height: number, x: number, y: number}>}
   */
  async boundingBox() {
    return await this._session.send('Page.getBoundingBox', {
      frameId: this._frameId,
      objectId: this._objectId,
    });
  }

  /**
   * @param {{encoding?: string, path?: string}} options
   */
  async screenshot(options = {}) {
    const clip = await this._session.send('Page.getBoundingBox', {
      frameId: this._frameId,
      objectId: this._objectId,
    });
    if (!clip)
      throw new Error('Node is either not visible or not an HTMLElement');
    assert(clip.width, 'Node has 0 width.');
    assert(clip.height, 'Node has 0 height.');
    await this._scrollIntoViewIfNeeded();

    return await this._frame._page.screenshot(Object.assign({}, options, {
      clip: {
        x: clip.x,
        y: clip.y,
        width: clip.width,
        height: clip.height,
      },
    }));
  }

  /**
   * @returns {!Promise<boolean>}
   */
  isIntersectingViewport() {
    return this._frame.evaluate(async element => {
      const visibleRatio = await new Promise(resolve => {
        const observer = new IntersectionObserver(entries => {
          resolve(entries[0].intersectionRatio);
          observer.disconnect();
        });
        observer.observe(element);
        // Firefox doesn't call IntersectionObserver callback unless
        // there are rafs.
        requestAnimationFrame(() => {});
      });
      return visibleRatio > 0;
    }, this);
  }

  /**
   * @param {string} selector
   * @return {!Promise<?ElementHandle>}
   */
  async $(selector) {
    const handle = await this._frame.evaluateHandle(
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
    const arrayHandle = await this._frame.evaluateHandle(
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
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $eval(selector, pageFunction, ...args) {
    const elementHandle = await this.$(selector);
    if (!elementHandle)
      throw new Error(`Error: failed to find element matching selector "${selector}"`);
    const result = await this._frame.evaluate(pageFunction, elementHandle, ...args);
    await elementHandle.dispose();
    return result;
  }

  /**
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $$eval(selector, pageFunction, ...args) {
    const arrayHandle = await this._frame.evaluateHandle(
        (element, selector) => Array.from(element.querySelectorAll(selector)),
        this, selector
    );

    const result = await this._frame.evaluate(pageFunction, arrayHandle, ...args);
    await arrayHandle.dispose();
    return result;
  }

  /**
   * @param {string} expression
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $x(expression) {
    const arrayHandle = await this._frame.evaluateHandle(
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

  async _scrollIntoViewIfNeeded() {
    const error = await this._frame.evaluate(async(element) => {
      if (!element.isConnected)
        return 'Node is detached from document';
      if (element.nodeType !== Node.ELEMENT_NODE)
        return 'Node is not of type HTMLElement';
      const visibleRatio = await new Promise(resolve => {
        const observer = new IntersectionObserver(entries => {
          resolve(entries[0].intersectionRatio);
          observer.disconnect();
        });
        observer.observe(element);
        // Firefox doesn't call IntersectionObserver callback unless
        // there are rafs.
        requestAnimationFrame(() => {});
      });
      if (visibleRatio !== 1.0)
        element.scrollIntoView({block: 'center', inline: 'center', behavior: 'instant'});
      return false;
    }, this);
    if (error)
      throw new Error(error);
  }

  /**
   * @param {!{delay?: number, button?: string, clickCount?: number}=} options
   */
  async click(options) {
    await this._scrollIntoViewIfNeeded();
    const {x, y} = await this._clickablePoint();
    await this._frame._page.mouse.click(x, y, options);
  }

  async tap() {
    await this._scrollIntoViewIfNeeded();
    const {x, y} = await this._clickablePoint();
    await this._frame._page.touchscreen.tap(x, y);
  }

  /**
   * @param {!Array<string>} filePaths
   */
  async uploadFile(...filePaths) {
    const files = filePaths.map(filePath => path.resolve(filePath));
    await this._session.send('Page.setFileInputFiles', {
      frameId: this._frameId,
      objectId: this._objectId,
      files,
    });
  }

  async hover() {
    await this._scrollIntoViewIfNeeded();
    const {x, y} = await this._clickablePoint();
    await this._frame._page.mouse.move(x, y);
  }

  async focus() {
    await this._frame.evaluate(element => element.focus(), this);
  }

  /**
   * @param {string} text
   * @param {{delay: (number|undefined)}=} options
   */
  async type(text, options) {
    await this.focus();
    await this._frame._page.keyboard.type(text, options);
  }

  /**
   * @param {string} key
   * @param {!{delay?: number}=} options
   */
  async press(key, options) {
    await this.focus();
    await this._frame._page.keyboard.press(key, options);
  }


  /**
   * @return {!Promise<!{x: number, y: number}>}
   */
  async _clickablePoint() {
    const result = await this._session.send('Page.getContentQuads', {
      frameId: this._frameId,
      objectId: this._objectId,
    }).catch(debugError);
    if (!result || !result.quads.length)
      throw new Error('Node is either not visible or not an HTMLElement');
    // Filter out quads that have too small area to click into.
    const quads = result.quads.filter(quad => computeQuadArea(quad) > 1);
    if (!quads.length)
      throw new Error('Node is either not visible or not an HTMLElement');
    // Return the middle point of the first quad.
    return computeQuadCenter(quads[0]);
  }
}

function createHandle(context, result, exceptionDetails) {
  const frame = context.frame();
  if (exceptionDetails) {
    if (exceptionDetails.value)
      throw new Error('Evaluation failed: ' + JSON.stringify(exceptionDetails.value));
    else
      throw new Error('Evaluation failed: ' + exceptionDetails.text + '\n' + exceptionDetails.stack);
  }
  return result.subtype === 'node' ? new ElementHandle(frame, context, result) : new JSHandle(context, result);
}

function computeQuadArea(quad) {
  // Compute sum of all directed areas of adjacent triangles
  // https://en.wikipedia.org/wiki/Polygon#Simple_polygons
  let area = 0;
  const points = [quad.p1, quad.p2, quad.p3, quad.p4];
  for (let i = 0; i < points.length; ++i) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += (p1.x * p2.y - p2.x * p1.y) / 2;
  }
  return Math.abs(area);
}

function computeQuadCenter(quad) {
  let x = 0, y = 0;
  for (const point of [quad.p1, quad.p2, quad.p3, quad.p4]) {
    x += point.x;
    y += point.y;
  }
  return {x: x / 4, y: y / 4};
}


module.exports = {JSHandle, ElementHandle, createHandle};
