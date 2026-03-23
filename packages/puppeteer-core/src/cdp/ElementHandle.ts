/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Protocol} from 'devtools-protocol';
import type {FilePayload} from '../common/types.js';
import type {CDPSession} from '../api/CDPSession.js';
import {
  bindIsolatedHandle,
  ElementHandle,
  type AutofillData,
} from '../api/ElementHandle.js';
import type {AwaitableIterable} from '../common/types.js';
import {debugError} from '../common/util.js';
import {environment} from '../environment.js';
import {assert} from '../util/assert.js';
import {AsyncIterableUtil} from '../util/AsyncIterableUtil.js';
import {throwIfDisposed} from '../util/decorators.js';

import type {CdpFrame} from './Frame.js';
import type {FrameManager} from './FrameManager.js';
import type {IsolatedWorld} from './IsolatedWorld.js';
import {CdpJSHandle} from './JSHandle.js';

const NON_ELEMENT_NODE_ROLES = new Set(['StaticText', 'InlineTextBox']);

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

  constructor(
    world: IsolatedWorld,
    remoteObject: Protocol.Runtime.RemoteObject,
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
    this: ElementHandle<HTMLIFrameElement>,
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
      debugError(error);
      // Fallback to Element.scrollIntoView if DOM.scrollIntoViewIfNeeded is not supported
      await super.scrollIntoView();
    }
  }

  @throwIfDisposed()
  @bindIsolatedHandle
  override async uploadFile(
    this: CdpElementHandle<HTMLInputElement>,
    ...files: Array<string | FilePayload>
  ): Promise<void> {
    // Separate file payloads from file paths
    const filePayloads: FilePayload[] = [];
    const filePaths: string[] = [];

    for (const file of files) {
      if (typeof file === 'string') {
        filePaths.push(file);
      } else {
        filePayloads.push(file);
      }
    }

    // Cannot mix paths and payloads in a single call
    assert(
      filePayloads.length === 0 || filePaths.length === 0,
      'Cannot mix file paths and file payloads in a single call to uploadFile',
    );

    const isMultiple = await this.evaluate(element => {
      return element.multiple;
    });
    assert(
      files.length <= 1 || isMultiple,
      'Multiple file uploads only work with <input type=file multiple>',
    );

    // ============================================
    // PATH A: Buffer/FilePayload (NEW CODE PATH)
    // ============================================
    if (filePayloads.length > 0) {
      // Convert buffers to base64, inject as File objects
      // via DataTransfer API in the browser
      const payloads = filePayloads.map(payload => ({
        name: payload.name,
        mimeType:
          payload.mimeType || 'application/octet-stream',
        data: payload.buffer.toString('base64'),
        lastModified: payload.lastModified ?? Date.now(),
      }));

      await this.evaluate((element, payloads) => {
        const dt = new DataTransfer();
        for (const payload of payloads) {
          const binaryString = atob(payload.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const file = new File([bytes], payload.name, {
            type: payload.mimeType,
            lastModified: payload.lastModified,
          });
          dt.items.add(file);
        }
        element.files = dt.files;
        element.dispatchEvent(
          new Event('input', {bubbles: true, composed: true}),
        );
        element.dispatchEvent(
          new Event('change', {bubbles: true}),
        );
      }, payloads);
      return;
    }

    // ============================================
    // PATH B: File paths (EXISTING CODE — unchanged)
    // ============================================

    // Locate all files and confirm that they exist.
    const path = environment.value.path;
    let resolvedPaths = filePaths;
    if (path) {
      resolvedPaths = filePaths.map(filePath => {
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
     * DOM.setFileInputFiles does not actually update the files
     * in that case, so the solution is to eval the element
     * value to a new FileList directly.
     */
    if (resolvedPaths.length === 0) {
      await this.evaluate(element => {
        element.files = new DataTransfer().files;
        element.dispatchEvent(
          new Event('input', {bubbles: true, composed: true}),
        );
        element.dispatchEvent(
          new Event('change', {bubbles: true}),
        );
      });
      return;
    }

    const {
      node: {backendNodeId},
    } = await this.client.send('DOM.describeNode', {
      objectId: this.id,
    });
    await this.client.send('DOM.setFileInputFiles', {
      objectId: this.id,
      files: resolvedPaths,
      backendNodeId,
    });
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

    return yield* AsyncIterableUtil.map(results, node => {
      return this.realm.adoptBackendNode(node.backendDOMNodeId) as Promise<
        ElementHandle<Node>
      >;
    });
  }

  override async backendNodeId(): Promise<number> {
    if (this.#backendNodeId) {
      return this.#backendNodeId;
    }
    const {node} = await this.client.send('DOM.describeNode', {
      objectId: this.handle.id,
    });
    this.#backendNodeId = node.backendNodeId;
    return this.#backendNodeId;
  }
}
