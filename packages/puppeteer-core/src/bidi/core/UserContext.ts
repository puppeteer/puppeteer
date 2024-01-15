import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {assert} from '../../util/assert.js';

import type {Browser} from './Browser.js';
import {BrowsingContext} from './BrowsingContext.js';

export type CreateBrowsingContextOptions = Omit<
  Bidi.BrowsingContext.CreateParameters,
  'type' | 'referenceContext'
> & {
  referenceContext?: BrowsingContext;
};

export class UserContext extends EventEmitter<{
  /**
   * Emitted when a new browsing context is created.
   */
  browsingcontext: {
    /** The new browsing context. */
    browsingContext: BrowsingContext;
  };
}> {
  static create(browser: Browser, id: string): UserContext {
    const context = new UserContext(browser, id);
    context.#initialize();
    return context;
  }

  // keep-sorted start
  // Note these are only top-level contexts.
  readonly #browsingContexts = new Map<string, BrowsingContext>();
  // @ts-expect-error -- TODO: This will be used once the WebDriver BiDi
  // protocol supports it.
  readonly #id: string;
  readonly browser: Browser;
  // keep-sorted end

  private constructor(browser: Browser, id: string) {
    super();

    // keep-sorted start
    this.#id = id;
    this.browser = browser;
    // keep-sorted end
  }

  #initialize() {
    // ///////////////////////
    // Connection listeners //
    // ///////////////////////
    const connection = this.#connection;
    connection.on('browsingContext.contextCreated', info => {
      if (info.parent) {
        return;
      }

      const browsingContext = BrowsingContext.from(
        this,
        undefined,
        info.context,
        info.url
      );
      browsingContext.on('destroyed', () => {
        this.#browsingContexts.delete(browsingContext.id);
      });

      this.#browsingContexts.set(browsingContext.id, browsingContext);

      this.emit('browsingcontext', {browsingContext});
    });
  }

  // keep-sorted start block=yes
  get #connection() {
    return this.browser.session.connection;
  }
  get browsingContexts(): Iterable<BrowsingContext> {
    return this.#browsingContexts.values();
  }
  // keep-sorted end

  async createBrowsingContext(
    type: Bidi.BrowsingContext.CreateType,
    options: CreateBrowsingContextOptions = {}
  ): Promise<BrowsingContext> {
    const {
      result: {context: contextId},
    } = await this.#connection.send('browsingContext.create', {
      type,
      ...options,
      referenceContext: options.referenceContext?.id,
    });

    const browsingContext = this.#browsingContexts.get(contextId)!;
    assert(
      browsingContext,
      'The WebDriver BiDi implementation is failing to create a browsing context correctly.'
    );

    // We use an array to avoid the promise from being awaited.
    return browsingContext;
  }

  async close(): Promise<void> {
    const promises = [];
    for (const browsingContext of this.#browsingContexts.values()) {
      promises.push(browsingContext.close());
    }
    await Promise.all(promises);
  }
}
