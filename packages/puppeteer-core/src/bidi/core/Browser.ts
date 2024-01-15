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

/**
 * @internal
 */
export type AddPreloadScriptOptions = Omit<
  Bidi.Script.AddPreloadScriptParameters,
  'functionDeclaration' | 'contexts'
> & {
  contexts?: [BrowsingContext, ...BrowsingContext[]];
};

/**
 * @internal
 */
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
    // Session listeners //
    // ///////////////////////
    const session = this.#session;
    session.on('script.realmCreated', info => {
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
    // In case contexts are created or destroyed during `getTree`, we use this
    // set to detect them.
    const contextIds = new Set<string>();
    const created = (info: {context: string}) => {
      contextIds.add(info.context);
    };
    const destroyed = (info: {context: string}) => {
      contextIds.delete(info.context);
    };
    session.on('browsingContext.contextCreated', created);
    session.on('browsingContext.contextDestroyed', destroyed);

    const {
      result: {contexts},
    } = await session.send('browsingContext.getTree', {});

    session.off('browsingContext.contextDestroyed', destroyed);
    session.off('browsingContext.contextCreated', created);

    // Simulating events so contexts are created naturally.
    for (const info of contexts) {
      if (contextIds.has(info.context)) {
        session.emit('browsingContext.contextCreated', info);
      }
      if (info.children) {
        contexts.push(...info.children);
      }
    }
  }

  get #session() {
    return this.session;
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
    await this.#session.send('browser.close', {});
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
    } = await this.#session.send('script.addPreloadScript', {
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
    await this.#session.send('script.removePreloadScript', {
      script,
    });
  }
}
