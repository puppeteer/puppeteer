/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {throwIfDisposed} from '../../util/decorators.js';

import type BrowsingContext from './BrowsingContext.js';
import type {SharedWorkerRealm} from './Realm.js';
import type Session from './Session.js';
import UserContext from './UserContext.js';

export type AddPreloadScriptOptions = Omit<
  Bidi.Script.AddPreloadScriptParameters,
  'functionDeclaration' | 'contexts'
> & {
  contexts?: [BrowsingContext, ...BrowsingContext[]];
};

export default class Browser extends EventEmitter<{
  /** Emitted after the browser closes. */
  closed: {
    /** The reason for closing the browser. */
    reason: string;
  };
  /** Emitted after the browser disconnects. */
  disconnected: {
    /** The reason for disconnecting the browser. */
    reason: string;
  };
  /** Emitted when a shared worker is created. */
  sharedworker: {
    /** The realm of the shared worker. */
    realm: SharedWorkerRealm;
  };
}> {
  static async from(session: Session): Promise<Browser> {
    const browser = new Browser(session);
    await browser.#initialize();
    return browser;
  }

  // keep-sorted start
  #reason: string | undefined;
  readonly #userContexts = new Map();
  readonly session: Session;
  // keep-sorted end

  private constructor(session: Session) {
    super();

    // keep-sorted start
    this.session = session;
    // keep-sorted end

    this.#userContexts.set('', UserContext.create(this, ''));
  }

  async #initialize() {
    // ///////////////////////
    // Connection listeners //
    // ///////////////////////
    const connection = this.#connection;
    connection.on('script.realmCreated', info => {
      if (info.type === 'shared-worker') {
        // TODO: Create a SharedWorkerRealm.
      }
    });

    // ///////////////////
    // Parent listeners //
    // ///////////////////
    this.session.once('ended', ({reason}) => {
      this.#reason = reason;
      this.emit('disconnected', {reason});
      this.removeAllListeners();
    });

    // //////////////////////////////
    // Asynchronous initialization //
    // //////////////////////////////
    const {
      result: {contexts},
    } = await connection.send('browsingContext.getTree', {});

    // Simulating events so contexts are created naturally.
    for (const context of contexts) {
      connection.emit('browsingContext.contextCreated', context);
      if (context.children) {
        contexts.push(...context.children);
      }
    }
  }

  get #connection() {
    return this.session.connection;
  }

  get disposed(): boolean {
    return this.#reason !== undefined;
  }

  get defaultUserContext(): UserContext {
    // SAFETY: A UserContext is always created for the default context.
    return this.#userContexts.get('')!;
  }

  get userContexts(): Iterable<UserContext> {
    return this.#userContexts.values();
  }

  @throwIfDisposed((browser: Browser) => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return browser.#reason!;
  })
  async close(): Promise<void> {
    await this.#connection.send('browser.close', {});
    this.#reason = `Browser has already closed.`;
    this.emit('closed', {reason: this.#reason});
    this.removeAllListeners();
  }

  @throwIfDisposed((browser: Browser) => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return browser.#reason!;
  })
  async addPreloadScript(
    functionDeclaration: string,
    options: AddPreloadScriptOptions = {}
  ): Promise<string> {
    const {
      result: {script},
    } = await this.#connection.send('script.addPreloadScript', {
      functionDeclaration,
      ...options,
      contexts: options.contexts?.map(context => {
        return context.id;
      }) as [string, ...string[]],
    });
    return script;
  }

  @throwIfDisposed((browser: Browser) => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return browser.#reason!;
  })
  async removePreloadScript(script: string): Promise<void> {
    await this.#connection.send('script.removePreloadScript', {
      script,
    });
  }
}
