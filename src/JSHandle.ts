/**
 * Copyright 2019 Google Inc. All rights reserved.
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

import * as path from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as mime from 'mime-types';

import {helper, assert, debugError} from './helper';
import { ExecutionContext } from './ExecutionContext';
import { CDPSession } from './Connection';
import { AnyFunction, Evalable, JSEvalable } from './types';
import { Page, ScreenshotOptions } from './Page';
import { FrameManager, Frame } from './FrameManager';
import { Protocol } from './protocol';

const readFileAsync = promisify(readFile);

export interface BoxModel {
  content: {
      x: number;
      y: number;
  }[];
  padding: {
      x: number;
      y: number;
  }[];
  border: {
      x: number;
      y: number;
  }[];
  margin: {
      x: number;
      y: number;
  }[];
  width: number;
  height: number;
};

export function createJSHandle(context: ExecutionContext, remoteObject: Protocol.Runtime.RemoteObject) {
  const frame = context.frame();
  if (remoteObject.subtype === 'node' && frame) {
    const frameManager = frame._frameManager;
    return new ElementHandle(context, context.client, remoteObject, frameManager.page(), frameManager);
  }
  return new JSHandle(context, context.client, remoteObject);
}

export class JSHandle<T = any> implements JSEvalable<T> {
  _disposed = false;

  constructor(public context: ExecutionContext, protected client: CDPSession, public _remoteObject: Protocol.Runtime.RemoteObject) {
  }

  executionContext(): ExecutionContext {
    return this.context;
  }

  async evaluate(pageFunction: AnyFunction|string, ...args: any[]): Promise<any> {
    return await this.executionContext().evaluate(pageFunction, this, ...args);
  }

  async evaluateHandle(pageFunction: AnyFunction | string, ...args: any[]): Promise<JSHandle> {
    return await this.executionContext().evaluateHandle(pageFunction, this, ...args);
  }

  async getProperty(propertyName: string): Promise<JSHandle | null> {
    const objectHandle = await this.evaluateHandle((object: Record<string, unknown>, propertyName: string) => {
      const result = Object.create(null) as Record<string, unknown>;
      result[propertyName] = object[propertyName];
      return result;
    }, propertyName);
    const properties = await objectHandle.getProperties();
    const result = properties.get(propertyName) || null;
    await objectHandle.dispose();
    return result;
  }

  async getProperties(): Promise<Map<string, JSHandle>> {
    const response = await this.client.send('Runtime.getProperties', {
      objectId: this._remoteObject.objectId!,
      ownProperties: true
    });
    const result = new Map();
    for (const property of response.result) {
      if (!property.enumerable)
        continue;
      result.set(property.name, createJSHandle(this.context, property.value!));
    }
    return result;
  }

  async jsonValue(): Promise<any> {
    if (this._remoteObject.objectId) {
      const response = await this.client.send('Runtime.callFunctionOn', {
        functionDeclaration: 'function() { return this; }',
        objectId: this._remoteObject.objectId,
        returnByValue: true,
        awaitPromise: true,
      });
      return helper.valueFromRemoteObject(response.result);
    }
    return helper.valueFromRemoteObject(this._remoteObject);
  }

  asElement(): ElementHandle | null {
    return null;
  }

  async dispose() {
    if (this._disposed)
      return;
    this._disposed = true;
    await helper.releaseObject(this.client, this._remoteObject);
  }

  toString(): string {
    if (this._remoteObject.objectId) {
      const type =  this._remoteObject.subtype || this._remoteObject.type;
      return 'JSHandle@' + type;
    }
    return 'JSHandle:' + helper.valueFromRemoteObject(this._remoteObject);
  }
}

export class ElementHandle<E extends Element = Element> extends JSHandle<E> implements Evalable {
  _page: Page
  _frameManager: FrameManager
  _disposed: boolean

  constructor(context: ExecutionContext, client: CDPSession, remoteObject: Protocol.Runtime.RemoteObject, page: Page, frameManager: FrameManager) {
    super(context, client, remoteObject);
    this._page = page;
    this._frameManager = frameManager;
    this._disposed = false;
  }

  asElement(): this {
    return this;
  }

  async contentFrame(): Promise<Frame | null> {
    const nodeInfo = await this.client.send('DOM.describeNode', {
      objectId: this._remoteObject.objectId
    });
    if (typeof nodeInfo.node.frameId !== 'string')
      return null;
    return this._frameManager.frame(nodeInfo.node.frameId);
  }

  async _scrollIntoViewIfNeeded() {
    const error: string | false = await this.evaluate(async(element, pageJavascriptEnabled) => {
      if (!element.isConnected)
        return 'Node is detached from document';
      if (element.nodeType !== Node.ELEMENT_NODE)
        return 'Node is not of type HTMLElement';
      // force-scroll if page's javascript is disabled.
      if (!pageJavascriptEnabled) {
        element.scrollIntoView({block: 'center', inline: 'center', behavior: 'instant'});
        return false;
      }
      const visibleRatio = await new Promise(resolve => {
        const observer = new IntersectionObserver(entries => {
          resolve(entries[0].intersectionRatio);
          observer.disconnect();
        });
        observer.observe(element);
      });
      if (visibleRatio !== 1.0)
        element.scrollIntoView({block: 'center', inline: 'center', behavior: 'instant'});
      return false;
    }, this._page._javascriptEnabled);
    if (error)
      throw new Error(error);
  }

  async _clickablePoint(): Promise<{x: number, y: number}> {
    const [result, layoutMetrics] = await Promise.all([
      this.client.send('DOM.getContentQuads', {
        objectId: this._remoteObject.objectId
      }).catch(debugError),
      this.client.send('Page.getLayoutMetrics'),
    ]);
    if (!result || !result.quads.length)
      throw new Error('Node is either not visible or not an HTMLElement');
    // Filter out quads that have too small area to click into.
    const {clientWidth, clientHeight} = layoutMetrics.layoutViewport;
    const quads = (result.quads as number[][]).map(quad => this._fromProtocolQuad(quad)).map((quad: Array<{x: number, y: number}>) => this._intersectQuadWithViewport(quad, clientWidth, clientHeight)).filter(quad => computeQuadArea(quad) > 1);
    if (!quads.length)
      throw new Error('Node is either not visible or not an HTMLElement');
    // Return the middle point of the first quad.
    const quad = quads[0];
    let x = 0;
    let y = 0;
    for (const point of quad) {
      x += point.x;
      y += point.y;
    }
    return {
      x: x / 4,
      y: y / 4
    };
  }

  _getBoxModel(): Promise<void|Protocol.DOM.getBoxModelReturnValue> {
    return this.client.send('DOM.getBoxModel', {
      objectId: this._remoteObject.objectId
    }).catch(error => debugError(error));
  }

  _fromProtocolQuad(quad: Array<number>): Array<{x: number, y: number}> {
    return [
      {x: quad[0], y: quad[1]},
      {x: quad[2], y: quad[3]},
      {x: quad[4], y: quad[5]},
      {x: quad[6], y: quad[7]}
    ];
  }

  _intersectQuadWithViewport(quad: Array<{x: number, y: number}>, width: number, height: number): Array<{x: number, y: number}> {
    return quad.map(point => ({
      x: Math.min(Math.max(point.x, 0), width),
      y: Math.min(Math.max(point.y, 0), height),
    }));
  }

  async hover() {
    await this._scrollIntoViewIfNeeded();
    const {x, y} = await this._clickablePoint();
    await this._page.mouse.move(x, y);
  }

  async click(options?: {delay?: number, button?: "left"|"right"|"middle", clickCount?: number}) {
    await this._scrollIntoViewIfNeeded();
    const {x, y} = await this._clickablePoint();
    await this._page.mouse.click(x, y, options);
  }

  async select(...values: string[]): Promise<string[]> {
    for (const value of values)
      assert(helper.isString(value), 'Values must be strings. Found value "' + value + '" of type "' + (typeof value) + '"');
    return this.evaluate((element: HTMLSelectElement, values) => {
      if (element.nodeName.toLowerCase() !== 'select')
        throw new Error('Element is not a <select> element.');

      const options = Array.from(element.options);
      element.value = '';
      for (const option of options) {
        option.selected = values.includes(option.value);
        if (option.selected && !element.multiple)
          break;
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return options.filter(option => option.selected).map(option => option.value);
    }, values);
  }

  async uploadFile(...filePaths: string[]) {
    const promises = filePaths.map(filePath => readFileAsync(filePath));
    const files: Array<{name: string, content: string; mimeType: string | false}> = [];
    for (let i = 0; i < filePaths.length; i++) {
      const buffer = await promises[i];
      const filePath = path.basename(filePaths[i]);
      const file = {
        name: filePath,
        content: buffer.toString('base64'),
        mimeType: mime.lookup(filePath),
      };
      files.push(file);
    }
    await this.evaluateHandle(async(element: HTMLInputElement, files: Array<{name: string, content: string; mimeType: string | false}>) => {
      const dt = new DataTransfer();
      for (const item of files) {
        const response = await fetch(`data:${item.mimeType};base64,${item.content}`);
        const file = new File([await response.blob()], item.name);
        dt.items.add(file);
      }
      element.files = dt.files;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }, files);
  }

  async tap() {
    await this._scrollIntoViewIfNeeded();
    const {x, y} = await this._clickablePoint();
    await this._page.touchscreen.tap(x, y);
  }

  async focus() {
    await this.evaluate(element => element.focus());
  }

  async type(text: string, options?: {delay: (number|undefined)}) {
    await this.focus();
    await this._page.keyboard.type(text, options);
  }

  async press(key: string, options?: {delay?: number, text?: string}) {
    await this.focus();
    await this._page.keyboard.press(key, options);
  }

  async boundingBox(): Promise<{x: number, y: number, width: number, height: number} | null> {
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

  async boxModel(): Promise<BoxModel | null> {
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

  async screenshot(options: ScreenshotOptions = {}): Promise<string|Buffer> {
    let needsViewportReset = false;

    let boundingBox = await this.boundingBox();
    assert(boundingBox, 'Node is either not visible or not an HTMLElement');

    const viewport = this._page.viewport();

    if (viewport && (boundingBox.width > viewport.width || boundingBox.height > viewport.height)) {
      const newViewport = {
        width: Math.max(viewport.width, Math.ceil(boundingBox.width)),
        height: Math.max(viewport.height, Math.ceil(boundingBox.height)),
      };
      await this._page.setViewport(Object.assign({}, viewport, newViewport));

      needsViewportReset = true;
    }

    await this._scrollIntoViewIfNeeded();

    boundingBox = await this.boundingBox();
    assert(boundingBox, 'Node is either not visible or not an HTMLElement');
    assert(boundingBox.width !== 0, 'Node has 0 width.');
    assert(boundingBox.height !== 0, 'Node has 0 height.');

    const { layoutViewport: { pageX, pageY } } = await this.client.send('Page.getLayoutMetrics');

    const clip = Object.assign({}, boundingBox);
    clip.x += pageX;
    clip.y += pageY;

    const imageData = await this._page.screenshot(Object.assign({}, {
      clip
    }, options));

    if (needsViewportReset)
      await this._page.setViewport(viewport!);

    return imageData;
  }

  async $(selector: string): Promise<ElementHandle | null> {
    const handle = await this.evaluateHandle(
        (element: Element, selector: string) => element.querySelector(selector),
        selector
    );
    const element = handle.asElement();
    if (element)
      return element;
    await handle.dispose();
    return null;
  }

  async $$(selector: string): Promise<Array<ElementHandle>> {
    const arrayHandle = await this.evaluateHandle(
        (element: Element, selector: string) => element.querySelectorAll(selector),
        selector
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

  async $eval(selector: string, pageFunction: AnyFunction|string, ...args: any[]): Promise<any> {
    const elementHandle = await this.$(selector);
    if (!elementHandle)
      throw new Error(`Error: failed to find element matching selector "${selector}"`);
    const result = await elementHandle.evaluate(pageFunction, ...args);
    await elementHandle.dispose();
    return result;
  }

  async $$eval(selector: string, pageFunction: AnyFunction|string, ...args: any[]): Promise<any> {
    const arrayHandle = await this.evaluateHandle(
        (element: Element, selector: string) => Array.from(element.querySelectorAll(selector)),
        selector
    );

    const result = await arrayHandle.evaluate(pageFunction, ...args);
    await arrayHandle.dispose();
    return result;
  }

  async $x(expression: string): Promise<Array<ElementHandle>> {
    const arrayHandle = await this.evaluateHandle(
        (element: Document, expression: string) => {
          const document = element.ownerDocument || element;
          const iterator = document.evaluate(expression, element, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
          const array: Node[] = [];
          let item;
          while ((item = iterator.iterateNext()))
            array.push(item);
          return array;
        },
        expression
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

  isIntersectingViewport(): Promise<boolean> {
    return this.evaluate(async element => {
      const visibleRatio = await new Promise<number>(resolve => {
        const observer = new IntersectionObserver(entries => {
          resolve(entries[0].intersectionRatio);
          observer.disconnect();
        });
        observer.observe(element);
      });
      return visibleRatio > 0;
    });
  }
}

function computeQuadArea(quad: Array<{x: number, y: number}>) {
  // Compute sum of all directed areas of adjacent triangles
  // https://en.wikipedia.org/wiki/Polygon#Simple_polygons
  let area = 0;
  for (let i = 0; i < quad.length; ++i) {
    const p1 = quad[i];
    const p2 = quad[(i + 1) % quad.length];
    area += (p1.x * p2.y - p2.x * p1.y) / 2;
  }
  return Math.abs(area);
}
