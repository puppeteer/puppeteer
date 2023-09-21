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

import {type Protocol} from 'devtools-protocol';

import {type CDPSession} from '../api/CDPSession.js';
import {ElementHandle, type AutofillData} from '../api/ElementHandle.js';
import {debugError} from '../common/util.js';
import {assert} from '../util/assert.js';
import {throwIfDisposed} from '../util/decorators.js';

import {type CdpFrame} from './Frame.js';
import {type FrameManager} from './FrameManager.js';
import {type IsolatedWorld} from './IsolatedWorld.js';
import {CdpJSHandle} from './JSHandle.js';

/**
 * The CdpElementHandle extends ElementHandle now to keep compatibility
 * with `instanceof` because of that we need to have methods for
 * CdpJSHandle to in this implementation as well.
 *
 * @internal
 */
export class CdpElementHandle<
  ElementType extends Node = Element,
> extends ElementHandle<ElementType> {
  protected declare readonly handle: CdpJSHandle<ElementType>;

  constructor(
    world: IsolatedWorld,
    remoteObject: Protocol.Runtime.RemoteObject
  ) {
    super(new CdpJSHandle(world, remoteObject));
  }

  override get realm(): IsolatedWorld {
    return this.handle.realm;
  }

  get client(): CDPSession {
    return this.handle.client;
  }

  override remoteObject(): Protocol.Runtime.RemoteObject {
    return this.handle.remoteObject();
  }

  get #frameManager(): FrameManager {
    return this.frame._frameManager;
  }

  override get frame(): CdpFrame {
    return this.realm.environment as CdpFrame;
  }

  override async contentFrame(
    this: ElementHandle<HTMLIFrameElement>
  ): Promise<CdpFrame>;

  @throwIfDisposed()
  override async contentFrame(): Promise<CdpFrame | null> {
    const nodeInfo = await this.client.send('DOM.describeNode', {
      objectId: this.id,
    });
    if (typeof nodeInfo.node.frameId !== 'string') {
      return null;
    }
    return this.#frameManager.frame(nodeInfo.node.frameId);
  }

  @throwIfDisposed()
  @ElementHandle.bindIsolatedHandle
  override async scrollIntoView(
    this: CdpElementHandle<Element>
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

  @throwIfDisposed()
  @ElementHandle.bindIsolatedHandle
  override async uploadFile(
    this: CdpElementHandle<HTMLInputElement>,
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

  @throwIfDisposed()
  override async autofill(data: AutofillData): Promise<void> {
    const nodeInfo = await this.client.send('DOM.describeNode', {
      objectId: this.handle.id,
    });
    const fieldId = nodeInfo.node.backendNodeId;
    const frameId = this.frame._id;
    await this.client.send('Autofill.trigger', {
      fieldId,
      frameId,
      card: data.creditCard,
    });
  }
}
