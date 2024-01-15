/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {throwIfDisposed} from '../../util/decorators.js';

import type {AddPreloadScriptOptions} from './Browser.js';
import Navigation from './Navigation.js';
import {WindowRealm} from './Realm.js';
import Request from './Request.js';
import type UserContext from './UserContext.js';
import UserPrompt from './UserPrompt.js';

/**
 * @internal
 */
export type CaptureScreenshotOptions = Omit<
  Bidi.BrowsingContext.CaptureScreenshotParameters,
  'context'
>;

/**
 * @internal
 */
export type ReloadOptions = Omit<
  Bidi.BrowsingContext.ReloadParameters,
  'context'
>;

/**
 * @internal
 */
export type PrintOptions = Omit<
  Bidi.BrowsingContext.PrintParameters,
  'context'
>;

/**
 * @internal
 */
export type HandleUserPromptOptions = Omit<
  Bidi.BrowsingContext.HandleUserPromptParameters,
  'context'
>;

/**
 * @internal
 */
export type SetViewportOptions = Omit<
  Bidi.BrowsingContext.SetViewportParameters,
  'context'
>;

/**
 * @internal
 */
export default class BrowsingContext extends EventEmitter<{
  /** Emitted when this context is destroyed. */
  destroyed: void;
  /** Emitted when a child browsing context is created. */
  browsingcontext: {
    /** The newly created child browsing context. */
    browsingContext: BrowsingContext;
  };
  /** Emitted whenever a navigation occurs. */
  navigation: {
    /** The navigation that occurred. */
    navigation: Navigation;
  };
  /** Emitted whenever a request is made. */
  request: {
    /** The request that was made. */
    request: Request;
  };
  /** Emitted whenever a log entry is added. */
  log: {
    /** Entry added to the log. */
    entry: Bidi.Log.Entry;
  };
  /** Emitted whenever a prompt is opened. */
  userprompt: {
    /** The prompt that was opened. */
    userPrompt: UserPrompt;
  };
  /** Emitted whenever the frame emits `DOMContentLoaded` */
  DOMContentLoaded: void;
  /** Emitted whenever the frame emits `load` */
  load: void;
}> {
  static from(
    userContext: UserContext,
    parent: BrowsingContext | undefined,
    id: string,
    url: string
  ): BrowsingContext {
    const browsingContext = new BrowsingContext(userContext, parent, id, url);
    browsingContext.#initialize();
    return browsingContext;
  }

  // keep-sorted start
  #navigation: Navigation | undefined;
  #url: string;
  readonly #children = new Map<string, BrowsingContext>();
  readonly #realms = new Map<string, WindowRealm>();
  readonly #requests = new Map<string, Request>();
  readonly defaultRealm: WindowRealm;
  readonly id: string;
  readonly parent: BrowsingContext | undefined;
  readonly userContext: UserContext;
  disposed = false;
  // keep-sorted end

  private constructor(
    context: UserContext,
    parent: BrowsingContext | undefined,
    id: string,
    url: string
  ) {
    super();

    // keep-sorted start
    this.#url = url;
    this.id = id;
    this.parent = parent;
    this.userContext = context;
    // keep-sorted end

    this.defaultRealm = WindowRealm.from(this);
  }

  #initialize() {
    // ///////////////////////
    // Session listeners //
    // ///////////////////////
    const session = this.#session;
    session.on('browsingContext.contextCreated', info => {
      if (info.parent !== this.id) {
        return;
      }

      const browsingContext = BrowsingContext.from(
        this.userContext,
        this,
        info.context,
        info.url
      );
      browsingContext.on('destroyed', () => {
        this.#children.delete(browsingContext.id);
      });

      this.#children.set(info.context, browsingContext);

      this.emit('browsingcontext', {browsingContext});
    });
    session.on('browsingContext.contextDestroyed', info => {
      if (info.context !== this.id) {
        return;
      }
      this.disposed = true;
      this.emit('destroyed', undefined);
      this.removeAllListeners();
    });

    session.on('browsingContext.domContentLoaded', info => {
      if (info.context !== this.id) {
        return;
      }
      this.#url = info.url;
      this.emit('DOMContentLoaded', undefined);
    });

    session.on('browsingContext.load', info => {
      if (info.context !== this.id) {
        return;
      }
      this.#url = info.url;
      this.emit('load', undefined);
    });

    session.on('browsingContext.navigationStarted', info => {
      if (info.context !== this.id) {
        return;
      }

      this.#requests.clear();

      // Note the navigation ID is null for this event.
      this.#navigation = Navigation.from(this, info.url);
      this.#navigation.on('fragment', ({url}) => {
        this.#url = url;
      });

      this.emit('navigation', {navigation: this.#navigation});
    });
    session.on('network.beforeRequestSent', event => {
      if (event.context !== this.id) {
        return;
      }
      if (this.#requests.has(event.request.request)) {
        return;
      }

      const request = new Request(this, event);
      this.#requests.set(request.id, request);
      this.emit('request', {request});
    });

    session.on('log.entryAdded', entry => {
      if (entry.source.context !== this.id) {
        return;
      }

      this.emit('log', {entry});
    });

    session.on('browsingContext.userPromptOpened', info => {
      if (info.context !== this.id) {
        return;
      }

      const userPrompt = UserPrompt.from(this, info);
      this.emit('userprompt', {userPrompt});
    });
  }

  // keep-sorted start block=yes
  get #session() {
    return this.userContext.browser.session;
  }
  get children(): Iterable<BrowsingContext> {
    return this.#children.values();
  }
  get realms(): Iterable<WindowRealm> {
    return this.#realms.values();
  }
  get top(): BrowsingContext {
    let context = this as BrowsingContext;
    for (let {parent} = context; parent; {parent} = context) {
      context = parent;
    }
    return context;
  }
  get url(): string {
    return this.#url;
  }
  // keep-sorted end

  @throwIfDisposed()
  async activate(): Promise<void> {
    await this.#session.send('browsingContext.activate', {
      context: this.id,
    });
  }

  @throwIfDisposed()
  async captureScreenshot(
    options: CaptureScreenshotOptions = {}
  ): Promise<string> {
    const {
      result: {data},
    } = await this.#session.send('browsingContext.captureScreenshot', {
      context: this.id,
      ...options,
    });
    return data;
  }

  @throwIfDisposed()
  async close(promptUnload?: boolean): Promise<void> {
    await Promise.all(
      [...this.#children.values()].map(async child => {
        await child.close(promptUnload);
      })
    );
    await this.#session.send('browsingContext.close', {
      context: this.id,
      promptUnload,
    });
  }

  @throwIfDisposed()
  async traverseHistory(delta: number): Promise<void> {
    await this.#session.send('browsingContext.traverseHistory', {
      context: this.id,
      delta,
    });
  }

  @throwIfDisposed()
  async navigate(
    url: string,
    wait?: Bidi.BrowsingContext.ReadinessState
  ): Promise<Navigation> {
    await this.#session.send('browsingContext.navigate', {
      context: this.id,
      url,
      wait,
    });
    return await new Promise(resolve => {
      this.once('navigation', ({navigation}) => {
        resolve(navigation);
      });
    });
  }

  @throwIfDisposed()
  async reload(options: ReloadOptions = {}): Promise<Navigation> {
    await this.#session.send('browsingContext.reload', {
      context: this.id,
      ...options,
    });
    return await new Promise(resolve => {
      this.once('navigation', ({navigation}) => {
        resolve(navigation);
      });
    });
  }

  @throwIfDisposed()
  async print(options: PrintOptions = {}): Promise<string> {
    const {
      result: {data},
    } = await this.#session.send('browsingContext.print', {
      context: this.id,
      ...options,
    });
    return data;
  }

  @throwIfDisposed()
  async handleUserPrompt(options: HandleUserPromptOptions = {}): Promise<void> {
    await this.#session.send('browsingContext.handleUserPrompt', {
      context: this.id,
      ...options,
    });
  }

  @throwIfDisposed()
  async setViewport(options: SetViewportOptions = {}): Promise<void> {
    await this.#session.send('browsingContext.setViewport', {
      context: this.id,
      ...options,
    });
  }

  @throwIfDisposed()
  async performActions(actions: Bidi.Input.SourceActions[]): Promise<void> {
    await this.#session.send('input.performActions', {
      context: this.id,
      actions,
    });
  }

  @throwIfDisposed()
  async releaseActions(): Promise<void> {
    await this.#session.send('input.releaseActions', {
      context: this.id,
    });
  }

  @throwIfDisposed()
  createWindowRealm(sandbox: string): WindowRealm {
    return WindowRealm.from(this, sandbox);
  }

  @throwIfDisposed()
  async addPreloadScript(
    functionDeclaration: string,
    options: AddPreloadScriptOptions = {}
  ): Promise<string> {
    return await this.userContext.browser.addPreloadScript(
      functionDeclaration,
      {
        ...options,
        contexts: [this, ...(options.contexts ?? [])],
      }
    );
  }

  @throwIfDisposed()
  async removePreloadScript(script: string): Promise<void> {
    await this.userContext.browser.removePreloadScript(script);
  }
}
