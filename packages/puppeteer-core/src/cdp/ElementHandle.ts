/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import {
  bindIsolatedHandle,
  ElementHandle,
  type AutofillData,
} from '../api/ElementHandle.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import type {AwaitableIterable} from '../common/types.js';
import {environment} from '../environment.js';
import {assert} from '../util/assert.js';
import {throwIfDisposed} from '../util/decorators.js';

import type {CdpFrame} from './Frame.js';
import type {FrameManager} from './FrameManager.js';
import type {IsolatedWorld} from './IsolatedWorld.js';
import {CdpJSHandle} from './JSHandle.js';

const NON_ELEMENT_NODE_ROLES = new Set(['StaticText', 'InlineTextBox']);
const QUERY_AX_TREE_BATCH_SIZE = 64;

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
  declare protected readonly handle: CdpJSHandle<ElementType>;
  #backendNodeId?: number;
  #logger: Logger;

  constructor(
    world: IsolatedWorld,
    remoteObject: Protocol.Runtime.RemoteObject,
    logger: Logger,
    backendNodeId?: Protocol.DOM.BackendNodeId,
  ) {
    super(new CdpJSHandle(world, remoteObject, logger), logger);
    this.#logger = logger;
    this.#backendNodeId = backendNodeId;
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
    this: ElementHandle<HTMLIFrameElement>,
  ): Promise<CdpFrame>;

  @throwIfDisposed()
  override async contentFrame(): Promise<CdpFrame | null> {
    const nodeInfo = await this.client.send('DOM.describeNode', {
      objectId: this.id,
    });
    this.#backendNodeId ??= nodeInfo.node.backendNodeId;
    if (typeof nodeInfo.node.frameId !== 'string') {
      return null;
    }
    return this.#frameManager.frame(nodeInfo.node.frameId);
  }

  @throwIfDisposed()
  @bindIsolatedHandle
  override async scrollIntoView(
    this: CdpElementHandle<Element>,
  ): Promise<void> {
    await this.assertConnectedElement();
    try {
      await this.client.send('DOM.scrollIntoViewIfNeeded', {
        objectId: this.id,
      });
    } catch (error) {
      this.#logger?.(DEBUG_PREFIXES.error)?.(error);
      // Fallback to Element.scrollIntoView if DOM.scrollIntoViewIfNeeded is not supported
      await super.scrollIntoView();
    }
  }

  @throwIfDisposed()
  @bindIsolatedHandle
  override async uploadFile(
    this: CdpElementHandle<HTMLInputElement>,
    ...files: string[]
  ): Promise<void> {
    const isMultiple = await this.evaluate(element => {
      return element.multiple;
    });
    assert(
      files.length <= 1 || isMultiple,
      'Multiple file uploads only work with <input type=file multiple>',
    );

    // Locate all files and confirm that they exist.
    const path = environment.value.path;
    if (path) {
      files = files.map(filePath => {
        if (
          path.win32.isAbsolute(filePath) ||
          path.posix.isAbsolute(filePath)
        ) {
          return filePath;
        } else {
          return path.resolve(filePath);
        }
      });
    }

    /**
     * The zero-length array is a special case, it seems that
     * DOM.setFileInputFiles does not actually update the files in that case, so
     * the solution is to eval the element value to a new FileList directly.
     */
    if (files.length === 0) {
      // XXX: These events should converted to trusted events. Perhaps do this
      // in `DOM.setFileInputFiles`?
      await this.evaluate(element => {
        element.files = new DataTransfer().files;

        // Dispatch events for this case because it should behave akin to a user action.
        element.dispatchEvent(
          new Event('input', {bubbles: true, composed: true}),
        );
        element.dispatchEvent(new Event('change', {bubbles: true}));
      });
      return;
    }

    const backendNodeId = await this.backendNodeId();
    await this.client.send('DOM.setFileInputFiles', {
      objectId: this.id,
      files,
      backendNodeId,
    });
  }

  @throwIfDisposed()
  override async autofill(data: AutofillData): Promise<void> {
    const fieldId = await this.backendNodeId();
    const frameId = this.frame._id;
    await this.client.send('Autofill.trigger', {
      fieldId,
      frameId,
      card: data.creditCard,
      address: data.address,
    });
  }

  override async *queryAXTree(
    name?: string | undefined,
    role?: string | undefined,
  ): AwaitableIterable<ElementHandle<Node>> {
    const {nodes} = await this.client.send('Accessibility.queryAXTree', {
      objectId: this.id,
      accessibleName: name,
      role,
    });

    const results = nodes.filter(node => {
      if (node.ignored) {
        return false;
      }
      if (!node.role) {
        return false;
      }
      if (NON_ELEMENT_NODE_ROLES.has(node.role.value)) {
        return false;
      }
      return true;
    });

    if (results.length === 0) {
      return;
    }

    // Resolve the first match lazily so single-element queries (queryOne)
    // do not issue extra DOM.resolveNode RPCs.
    yield (await this.realm.adoptBackendNode(
      results[0]!.backendDOMNodeId,
    )) as ElementHandle<Node>;

    // Pipeline remaining resolutions in bounded batches for multi-element
    // queries ($$ / $$eval) while disposing unconsumed handles on early exit.
    for (let i = 1; i < results.length; i += QUERY_AX_TREE_BATCH_SIZE) {
      const chunk = results.slice(i, i + QUERY_AX_TREE_BATCH_SIZE);
      const settled = await Promise.allSettled(
        chunk.map(node => {
          return this.realm.adoptBackendNode(node.backendDOMNodeId) as Promise<
            ElementHandle<Node>
          >;
        }),
      );
      let consumed = 0;
      try {
        for (const outcome of settled) {
          if (outcome.status === 'rejected') {
            throw outcome.reason;
          }
          consumed++;
          yield outcome.value;
        }
      } finally {
        for (const outcome of settled.slice(consumed)) {
          if (outcome.status === 'fulfilled') {
            void outcome.value.dispose();
          }
        }
      }
    }
  }

  @throwIfDisposed()
  override async backendNodeId(): Promise<number> {
    if (this.#backendNodeId !== undefined) {
      return this.#backendNodeId;
    }
    const {node} = await this.client.send('DOM.describeNode', {
      objectId: this.handle.id,
    });
    this.#backendNodeId = node.backendNodeId;
    return this.#backendNodeId;
  }
}
