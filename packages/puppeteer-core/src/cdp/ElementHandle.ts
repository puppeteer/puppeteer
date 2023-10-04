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

import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import {ElementHandle, type AutofillData} from '../api/ElementHandle.js';
import {debugError} from '../common/util.js';
import {throwIfDisposed} from '../util/decorators.js';

import type {CdpFrame} from './Frame.js';
import type {FrameManager} from './FrameManager.js';
import type {IsolatedWorld} from './IsolatedWorld.js';
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
