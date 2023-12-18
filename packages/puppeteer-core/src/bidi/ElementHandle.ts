/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {type AutofillData, ElementHandle} from '../api/ElementHandle.js';
import {UnsupportedOperation} from '../common/Errors.js';
import {throwIfDisposed} from '../util/decorators.js';

import type {BidiFrame} from './Frame.js';
import {BidiJSHandle} from './JSHandle.js';
import type {BidiRealm} from './Realm.js';
import type {Sandbox} from './Sandbox.js';

/**
 * @internal
 */
export class BidiElementHandle<
  ElementType extends Node = Element,
> extends ElementHandle<ElementType> {
  declare handle: BidiJSHandle<ElementType>;

  constructor(sandbox: Sandbox, remoteValue: Bidi.Script.RemoteValue) {
    super(new BidiJSHandle(sandbox, remoteValue));
  }

  override get realm(): Sandbox {
    return this.handle.realm;
  }

  override get frame(): BidiFrame {
    return this.realm.environment;
  }

  context(): BidiRealm {
    return this.handle.context();
  }

  get isPrimitiveValue(): boolean {
    return this.handle.isPrimitiveValue;
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
      if (element instanceof HTMLIFrameElement) {
        return element.contentWindow;
      }
      return;
    })) as BidiJSHandle;
    const value = handle.remoteValue();
    if (value.type === 'window') {
      return this.frame.page().frame(value.value.context);
    }
    return null;
  }

  override uploadFile(this: ElementHandle<HTMLInputElement>): never {
    throw new UnsupportedOperation();
  }
}
