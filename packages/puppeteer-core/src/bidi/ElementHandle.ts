/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {ElementHandle, type AutofillData} from '../api/ElementHandle.js';
import {UnsupportedOperation} from '../common/Errors.js';
import {throwIfDisposed} from '../util/decorators.js';

import type {BidiFrame} from './Frame.js';
import {BidiJSHandle} from './JSHandle.js';
import type {BidiFrameRealm} from './Realm.js';

/**
 * @internal
 */
export class BidiElementHandle<
  ElementType extends Node = Element,
> extends ElementHandle<ElementType> {
  static from<ElementType extends Node = Element>(
    value: Bidi.Script.RemoteValue,
    realm: BidiFrameRealm
  ): BidiElementHandle<ElementType> {
    return new BidiElementHandle(value, realm);
  }

  declare handle: BidiJSHandle<ElementType>;

  constructor(value: Bidi.Script.RemoteValue, realm: BidiFrameRealm) {
    super(BidiJSHandle.from(value, realm));
  }

  override get realm(): BidiFrameRealm {
    // SAFETY: See the super call in the constructor.
    return this.handle.realm as BidiFrameRealm;
  }

  override get frame(): BidiFrame {
    return this.realm.environment;
  }

  remoteValue(): Bidi.Script.RemoteValue {
    return this.handle.remoteValue();
  }

  @throwIfDisposed()
  override async autofill(data: AutofillData): Promise<void> {
    const client = this.frame.client;
    const nodeInfo = await client.send('DOM.describeNode', {
      objectId: this.handle.id,
    });
    const fieldId = nodeInfo.node.backendNodeId;
    const frameId = this.frame._id;
    await client.send('Autofill.trigger', {
      fieldId,
      frameId,
      card: data.creditCard,
    });
  }

  override async contentFrame(
    this: BidiElementHandle<HTMLIFrameElement>
  ): Promise<BidiFrame>;
  @throwIfDisposed()
  @ElementHandle.bindIsolatedHandle
  override async contentFrame(): Promise<BidiFrame | null> {
    using handle = (await this.evaluateHandle(element => {
      if (
        element instanceof HTMLIFrameElement ||
        element instanceof HTMLFrameElement
      ) {
        return element.contentWindow;
      }
      return;
    })) as BidiJSHandle;
    const value = handle.remoteValue();
    if (value.type === 'window') {
      return (
        this.frame
          .page()
          .frames()
          .find(frame => {
            return frame._id === value.value.context;
          }) ?? null
      );
    }
    return null;
  }

  override uploadFile(this: ElementHandle<HTMLInputElement>): never {
    throw new UnsupportedOperation();
  }
}
