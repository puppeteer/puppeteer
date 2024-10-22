/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WEB_PERMISSION_TO_PROTOCOL_PERMISSION,
  type Permission,
} from '../api/Browser.js';
import {BrowserContext} from '../api/BrowserContext.js';
import type {Page} from '../api/Page.js';
import {assert} from '../util/assert.js';

import type {CdpBrowser} from './Browser.js';
import type {Connection} from './Connection.js';
import type {CdpTarget} from './Target.js';

/**
 * @internal
 */
export class CdpBrowserContext extends BrowserContext {
  #connection: Connection;
  #browser: CdpBrowser;
  #id?: string;

  constructor(connection: Connection, browser: CdpBrowser, contextId?: string) {
    super();
    this.#connection = connection;
    this.#browser = browser;
    this.#id = contextId;
  }

  override get id(): string | undefined {
    return this.#id;
  }

  override targets(): CdpTarget[] {
    return this.#browser.targets().filter(target => {
      return target.browserContext() === this;
    });
  }

  override async pages(): Promise<Page[]> {
    const pages = await Promise.all(
      this.targets()
        .filter(target => {
          return (
            target.type() === 'page' ||
            (target.type() === 'other' &&
              this.#browser._getIsPageTargetCallback()?.(target))
          );
        })
        .map(target => {
          return target.page();
        }),
    );
    return pages.filter((page): page is Page => {
      return !!page;
    });
  }

  override async overridePermissions(
    origin: string,
    permissions: Permission[],
  ): Promise<void> {
    const protocolPermissions = permissions.map(permission => {
      const protocolPermission =
        WEB_PERMISSION_TO_PROTOCOL_PERMISSION.get(permission);
      if (!protocolPermission) {
        throw new Error('Unknown permission: ' + permission);
      }
      return protocolPermission;
    });
    await this.#connection.send('Browser.grantPermissions', {
      origin,
      browserContextId: this.#id || undefined,
      permissions: protocolPermissions,
    });
  }

  override async clearPermissionOverrides(): Promise<void> {
    await this.#connection.send('Browser.resetPermissions', {
      browserContextId: this.#id || undefined,
    });
  }

  override async newPage(): Promise<Page> {
    using _guard = await this.waitForScreenshotOperations();
    return await this.#browser._createPageInContext(this.#id);
  }

  override browser(): CdpBrowser {
    return this.#browser;
  }

  override async close(): Promise<void> {
    assert(this.#id, 'Default BrowserContext cannot be closed!');
    await this.#browser._disposeContext(this.#id);
  }
}
