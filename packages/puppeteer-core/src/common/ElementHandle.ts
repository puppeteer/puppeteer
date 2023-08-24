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

import {Protocol} from 'devtools-protocol';

import {AutofillData, ElementHandle, Point} from '../api/ElementHandle.js';
import {Page, ScreenshotOptions} from '../api/Page.js';
import {assert} from '../util/assert.js';

import {CDPSession} from './Connection.js';
import {ExecutionContext} from './ExecutionContext.js';
import {Frame} from './Frame.js';
import {FrameManager} from './FrameManager.js';
import {WaitForSelectorOptions} from './IsolatedWorld.js';
import {CDPJSHandle} from './JSHandle.js';
import {NodeFor} from './types.js';
import {debugError} from './util.js';

/**
 * The CDPElementHandle extends ElementHandle now to keep compatibility
 * with `instanceof` because of that we need to have methods for
 * CDPJSHandle to in this implementation as well.
 *
 * @internal
 */
export class CDPElementHandle<
  ElementType extends Node = Element,
> extends ElementHandle<ElementType> {
  #frame: Frame;
  declare handle: CDPJSHandle<ElementType>;

  constructor(
    context: ExecutionContext,
    remoteObject: Protocol.Runtime.RemoteObject,
    frame: Frame
  ) {
    super(new CDPJSHandle(context, remoteObject));
    this.#frame = frame;
  }

  /**
   * @internal
   */
  executionContext(): ExecutionContext {
    return this.handle.executionContext();
  }

  /**
   * @internal
   */
  get client(): CDPSession {
    return this.handle.client;
  }

  override remoteObject(): Protocol.Runtime.RemoteObject {
    return this.handle.remoteObject();
  }

  get #frameManager(): FrameManager {
    return this.#frame._frameManager;
  }

  get #page(): Page {
    return this.#frame.page();
  }

  override get frame(): Frame {
    return this.#frame;
  }

  override async $<Selector extends string>(
    selector: Selector
  ): Promise<CDPElementHandle<NodeFor<Selector>> | null> {
    return super.$(selector) as Promise<CDPElementHandle<
      NodeFor<Selector>
    > | null>;
  }

  override async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<CDPElementHandle<NodeFor<Selector>>>> {
    return super.$$(selector) as Promise<
      Array<CDPElementHandle<NodeFor<Selector>>>
    >;
  }

  override async waitForSelector<Selector extends string>(
    selector: Selector,
    options?: WaitForSelectorOptions
  ): Promise<CDPElementHandle<NodeFor<Selector>> | null> {
    return (await super.waitForSelector(selector, options)) as CDPElementHandle<
      NodeFor<Selector>
    > | null;
  }

  override async contentFrame(
    this: ElementHandle<HTMLIFrameElement>
  ): Promise<Frame>;
  override async contentFrame(): Promise<Frame | null> {
    const nodeInfo = await this.client.send('DOM.describeNode', {
      objectId: this.id,
    });
    if (typeof nodeInfo.node.frameId !== 'string') {
      return null;
    }
    return this.#frameManager.frame(nodeInfo.node.frameId);
  }

  override async scrollIntoView(
    this: CDPElementHandle<Element>
  ): Promise<void> {
    await this.assertConnectedElement();
    try {
      await this.client.send('DOM.scrollIntoViewIfNeeded', {
        objectId: this.id,
      });
    } catch (error) {
      debugError(error);
      // Fallback to Element.scrollIntoView if DOM.scrollIntoViewIfNeeded is not supported
      await super.scrollIntoView();
    }
  }

  /**
   * This method creates and captures a dragevent from the element.
   */
  override async drag(
    this: CDPElementHandle<Element>,
    target: Point
  ): Promise<Protocol.Input.DragData> {
    assert(
      this.#page.isDragInterceptionEnabled(),
      'Drag Interception is not enabled!'
    );
    await this.scrollIntoViewIfNeeded();
    const start = await this.clickablePoint();
    return await this.#page.mouse.drag(start, target);
  }

  override async dragEnter(
    this: CDPElementHandle<Element>,
    data: Protocol.Input.DragData = {items: [], dragOperationsMask: 1}
  ): Promise<void> {
    await this.scrollIntoViewIfNeeded();
    const target = await this.clickablePoint();
    await this.#page.mouse.dragEnter(target, data);
  }

  override async dragOver(
    this: CDPElementHandle<Element>,
    data: Protocol.Input.DragData = {items: [], dragOperationsMask: 1}
  ): Promise<void> {
    await this.scrollIntoViewIfNeeded();
    const target = await this.clickablePoint();
    await this.#page.mouse.dragOver(target, data);
  }

  override async drop(
    this: CDPElementHandle<Element>,
    data: Protocol.Input.DragData = {items: [], dragOperationsMask: 1}
  ): Promise<void> {
    await this.scrollIntoViewIfNeeded();
    const destination = await this.clickablePoint();
    await this.#page.mouse.drop(destination, data);
  }

  override async dragAndDrop(
    this: CDPElementHandle<Element>,
    target: CDPElementHandle<Node>,
    options?: {delay: number}
  ): Promise<void> {
    assert(
      this.#page.isDragInterceptionEnabled(),
      'Drag Interception is not enabled!'
    );
    await this.scrollIntoViewIfNeeded();
    const startPoint = await this.clickablePoint();
    const targetPoint = await target.clickablePoint();
    await this.#page.mouse.dragAndDrop(startPoint, targetPoint, options);
  }

  override async uploadFile(
    this: CDPElementHandle<HTMLInputElement>,
    ...filePaths: string[]
  ): Promise<void> {
    const isMultiple = await this.evaluate(element => {
      return element.multiple;
    });
    assert(
      filePaths.length <= 1 || isMultiple,
      'Multiple file uploads only work with <input type=file multiple>'
    );

    // Locate all files and confirm that they exist.
    let path: typeof import('path');
    try {
      path = await import('path');
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          `JSHandle#uploadFile can only be used in Node-like environments.`
        );
      }
      throw error;
    }
    const files = filePaths.map(filePath => {
      if (path.win32.isAbsolute(filePath) || path.posix.isAbsolute(filePath)) {
        return filePath;
      } else {
        return path.resolve(filePath);
      }
    });
    const {node} = await this.client.send('DOM.describeNode', {
      objectId: this.id,
    });
    const {backendNodeId} = node;

    /*  The zero-length array is a special case, it seems that
         DOM.setFileInputFiles does not actually update the files in that case,
         so the solution is to eval the element value to a new FileList directly.
     */
    if (files.length === 0) {
      await this.evaluate(element => {
        element.files = new DataTransfer().files;

        // Dispatch events for this case because it should behave akin to a user action.
        element.dispatchEvent(new Event('input', {bubbles: true}));
        element.dispatchEvent(new Event('change', {bubbles: true}));
      });
    } else {
      await this.client.send('DOM.setFileInputFiles', {
        objectId: this.id,
        files,
        backendNodeId,
      });
    }
  }

  override async screenshot(
    this: CDPElementHandle<Element>,
    options: ScreenshotOptions = {}
  ): Promise<string | Buffer> {
    let needsViewportReset = false;

    let boundingBox = await this.boundingBox();
    assert(boundingBox, 'Node is either not visible or not an HTMLElement');

    const viewport = this.#page.viewport();

    if (
      viewport &&
      (boundingBox.width > viewport.width ||
        boundingBox.height > viewport.height)
    ) {
      const newViewport = {
        width: Math.max(viewport.width, Math.ceil(boundingBox.width)),
        height: Math.max(viewport.height, Math.ceil(boundingBox.height)),
      };
      await this.#page.setViewport(Object.assign({}, viewport, newViewport));

      needsViewportReset = true;
    }

    await this.scrollIntoViewIfNeeded();

    boundingBox = await this.boundingBox();
    assert(boundingBox, 'Node is either not visible or not an HTMLElement');
    assert(boundingBox.width !== 0, 'Node has 0 width.');
    assert(boundingBox.height !== 0, 'Node has 0 height.');

    const layoutMetrics = await this.client.send('Page.getLayoutMetrics');
    // Fallback to `layoutViewport` in case of using Firefox.
    const {pageX, pageY} =
      layoutMetrics.cssVisualViewport || layoutMetrics.layoutViewport;

    const clip = Object.assign({}, boundingBox);
    clip.x += pageX;
    clip.y += pageY;

    const imageData = await this.#page.screenshot(
      Object.assign(
        {},
        {
          clip,
        },
        options
      )
    );

    if (needsViewportReset && viewport) {
      await this.#page.setViewport(viewport);
    }

    return imageData;
  }

  override async autofill(data: AutofillData): Promise<void> {
    const nodeInfo = await this.client.send('DOM.describeNode', {
      objectId: this.handle.id,
    });
    const fieldId = nodeInfo.node.backendNodeId;
    const frameId = this.#frame._id;
    await this.client.send('Autofill.trigger', {
      fieldId,
      frameId,
      card: data.creditCard,
    });
  }

  override assertElementHasWorld(): asserts this {
    assert(this.executionContext()._world);
  }
}
