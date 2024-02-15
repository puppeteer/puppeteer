/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {inertIfDisposed, throwIfDisposed} from '../../util/decorators.js';
import {DisposableStack, disposeSymbol} from '../../util/disposable.js';

import type {BrowsingContext} from './BrowsingContext.js';
import {SharedWorkerRealm} from './Realm.js';
import type {Session} from './Session.js';
import {UserContext} from './UserContext.js';

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
export class Browser extends EventEmitter<{
  /** Emitted before the browser closes. */
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
  #closed = false;
  #reason: string | undefined;
  readonly #disposables = new DisposableStack();
  readonly #userContexts = new Map<string, UserContext>();
  readonly session: Session;
  readonly #sharedWorkers = new Map<string, SharedWorkerRealm>();
  // keep-sorted end

  private constructor(session: Session) {
    super();
    // keep-sorted start
    this.session = session;
    // keep-sorted end
  }

  async #initialize() {
    const sessionEmitter = this.#disposables.use(
      new EventEmitter(this.session)
    );
    sessionEmitter.once('ended', ({reason}) => {
      this.dispose(reason);
    });

    sessionEmitter.on('script.realmCreated', info => {
      if (info.type !== 'shared-worker') {
        return;
      }
      this.#sharedWorkers.set(
        info.realm,
        SharedWorkerRealm.from(this, info.realm, info.origin)
      );
    });

    await this.#syncUserContexts();
    await this.#syncBrowsingContexts();
  }

  async #syncUserContexts() {
    const {
      result: {userContexts},
    } = await this.session.send('browser.getUserContexts', {});

    for (const context of userContexts) {
      this.#createUserContext(context.userContext);
    }
  }

  async #syncBrowsingContexts() {
    // In case contexts are created or destroyed during `getTree`, we use this
    // set to detect them.
    const contextIds = new Set<string>();
    let contexts: Bidi.BrowsingContext.Info[];

    {
      using sessionEmitter = new EventEmitter(this.session);
      sessionEmitter.on('browsingContext.contextCreated', info => {
        contextIds.add(info.context);
      });
      const {result} = await this.session.send('browsingContext.getTree', {});
      contexts = result.contexts;
    }

    // Simulating events so contexts are created naturally.
    for (const info of contexts) {
      if (!contextIds.has(info.context)) {
        this.session.emit('browsingContext.contextCreated', info);
      }
      if (info.children) {
        contexts.push(...info.children);
      }
    }
  }

  #createUserContext(id: string) {
    const userContext = UserContext.create(this, id);
    this.#userContexts.set(userContext.id, userContext);

    const userContextEmitter = this.#disposables.use(
      new EventEmitter(userContext)
    );
    userContextEmitter.once('closed', () => {
      userContextEmitter.removeAllListeners();

      this.#userContexts.delete(userContext.id);
    });

    return userContext;
  }

  // keep-sorted start block=yes
  get closed(): boolean {
    return this.#closed;
  }
  get defaultUserContext(): UserContext {
    // SAFETY: A UserContext is always created for the default context.
    return this.#userContexts.get(UserContext.DEFAULT)!;
  }
  get disconnected(): boolean {
    return this.#reason !== undefined;
  }
  get disposed(): boolean {
    return this.disconnected;
  }
  get userContexts(): Iterable<UserContext> {
    return this.#userContexts.values();
  }
  // keep-sorted end

  @inertIfDisposed
  dispose(reason?: string, closed = false): void {
    this.#closed = closed;
    this.#reason = reason;
    this[disposeSymbol]();
  }

  @throwIfDisposed<Browser>(browser => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return browser.#reason!;
  })
  async close(): Promise<void> {
    try {
      await this.session.send('browser.close', {});
    } finally {
      this.dispose('Browser already closed.', true);
    }
  }

  @throwIfDisposed<Browser>(browser => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return browser.#reason!;
  })
  async addPreloadScript(
    functionDeclaration: string,
    options: AddPreloadScriptOptions = {}
  ): Promise<string> {
    const {
      result: {script},
    } = await this.session.send('script.addPreloadScript', {
      functionDeclaration,
      ...options,
      contexts: options.contexts?.map(context => {
        return context.id;
      }) as [string, ...string[]],
    });
    return script;
  }

  @throwIfDisposed<Browser>(browser => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return browser.#reason!;
  })
  async removePreloadScript(script: string): Promise<void> {
    await this.session.send('script.removePreloadScript', {
      script,
    });
  }

  @throwIfDisposed<Browser>(browser => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return browser.#reason!;
  })
  async createUserContext(): Promise<UserContext> {
    const {
      result: {userContext: context},
    } = await this.session.send('browser.createUserContext', {});
    return this.#createUserContext(context);
  }

  [disposeSymbol](): void {
    this.#reason ??=
      'Browser was disconnected, probably because the session ended.';
    if (this.closed) {
      this.emit('closed', {reason: this.#reason});
    }
    this.emit('disconnected', {reason: this.#reason});

    this.#disposables.dispose();
    super[disposeSymbol]();
  }
}
