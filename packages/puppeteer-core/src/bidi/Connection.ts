/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {CallbackRegistry} from '../common/CallbackRegistry.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {debug} from '../common/Debug.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';
import {assert} from '../util/assert.js';

import {type BrowsingContext, cdpSessions} from './BrowsingContext.js';

const debugProtocolSend = debug('puppeteer:webDriverBiDi:SEND ►');
const debugProtocolReceive = debug('puppeteer:webDriverBiDi:RECV ◀');

/**
 * @internal
 */
export interface Commands {
  'script.evaluate': {
    params: Bidi.Script.EvaluateParameters;
    returnType: Bidi.Script.EvaluateResult;
  };
  'script.callFunction': {
    params: Bidi.Script.CallFunctionParameters;
    returnType: Bidi.Script.EvaluateResult;
  };
  'script.disown': {
    params: Bidi.Script.DisownParameters;
    returnType: Bidi.EmptyResult;
  };
  'script.addPreloadScript': {
    params: Bidi.Script.AddPreloadScriptParameters;
    returnType: Bidi.Script.AddPreloadScriptResult;
  };
  'script.removePreloadScript': {
    params: Bidi.Script.RemovePreloadScriptParameters;
    returnType: Bidi.EmptyResult;
  };

  'browser.close': {
    params: Bidi.EmptyParams;
    returnType: Bidi.EmptyResult;
  };

  'browsingContext.activate': {
    params: Bidi.BrowsingContext.ActivateParameters;
    returnType: Bidi.EmptyResult;
  };
  'browsingContext.create': {
    params: Bidi.BrowsingContext.CreateParameters;
    returnType: Bidi.BrowsingContext.CreateResult;
  };
  'browsingContext.close': {
    params: Bidi.BrowsingContext.CloseParameters;
    returnType: Bidi.EmptyResult;
  };
  'browsingContext.getTree': {
    params: Bidi.BrowsingContext.GetTreeParameters;
    returnType: Bidi.BrowsingContext.GetTreeResult;
  };
  'browsingContext.navigate': {
    params: Bidi.BrowsingContext.NavigateParameters;
    returnType: Bidi.BrowsingContext.NavigateResult;
  };
  'browsingContext.reload': {
    params: Bidi.BrowsingContext.ReloadParameters;
    returnType: Bidi.BrowsingContext.NavigateResult;
  };
  'browsingContext.print': {
    params: Bidi.BrowsingContext.PrintParameters;
    returnType: Bidi.BrowsingContext.PrintResult;
  };
  'browsingContext.captureScreenshot': {
    params: Bidi.BrowsingContext.CaptureScreenshotParameters;
    returnType: Bidi.BrowsingContext.CaptureScreenshotResult;
  };
  'browsingContext.handleUserPrompt': {
    params: Bidi.BrowsingContext.HandleUserPromptParameters;
    returnType: Bidi.EmptyResult;
  };
  'browsingContext.setViewport': {
    params: Bidi.BrowsingContext.SetViewportParameters;
    returnType: Bidi.EmptyResult;
  };
  'browsingContext.traverseHistory': {
    params: Bidi.BrowsingContext.TraverseHistoryParameters;
    returnType: Bidi.EmptyResult;
  };

  'input.performActions': {
    params: Bidi.Input.PerformActionsParameters;
    returnType: Bidi.EmptyResult;
  };
  'input.releaseActions': {
    params: Bidi.Input.ReleaseActionsParameters;
    returnType: Bidi.EmptyResult;
  };

  'session.end': {
    params: Bidi.EmptyParams;
    returnType: Bidi.EmptyResult;
  };
  'session.new': {
    params: Bidi.Session.NewParameters;
    returnType: Bidi.Session.NewResult;
  };
  'session.status': {
    params: object;
    returnType: Bidi.Session.StatusResult;
  };
  'session.subscribe': {
    params: Bidi.Session.SubscriptionRequest;
    returnType: Bidi.EmptyResult;
  };
  'session.unsubscribe': {
    params: Bidi.Session.SubscriptionRequest;
    returnType: Bidi.EmptyResult;
  };
  'cdp.sendCommand': {
    params: Bidi.Cdp.SendCommandParameters;
    returnType: Bidi.Cdp.SendCommandResult;
  };
  'cdp.getSession': {
    params: Bidi.Cdp.GetSessionParameters;
    returnType: Bidi.Cdp.GetSessionResult;
  };
}

/**
 * @internal
 */
export type BidiEvents = {
  [K in Bidi.ChromiumBidi.Event['method']]: Extract<
    Bidi.ChromiumBidi.Event,
    {method: K}
  >['params'];
};

/**
 * @internal
 */
export class BidiConnection extends EventEmitter<BidiEvents> {
  #url: string;
  #transport: ConnectionTransport;
  #delay: number;
  #timeout? = 0;
  #closed = false;
  #callbacks = new CallbackRegistry();
  #browsingContexts = new Map<string, BrowsingContext>();

  constructor(
    url: string,
    transport: ConnectionTransport,
    delay = 0,
    timeout?: number
  ) {
    super();
    this.#url = url;
    this.#delay = delay;
    this.#timeout = timeout ?? 180_000;

    this.#transport = transport;
    this.#transport.onmessage = this.onMessage.bind(this);
    this.#transport.onclose = this.unbind.bind(this);
  }

  get closed(): boolean {
    return this.#closed;
  }

  get url(): string {
    return this.#url;
  }

  send<T extends keyof Commands>(
    method: T,
    params: Commands[T]['params']
  ): Promise<{result: Commands[T]['returnType']}> {
    assert(!this.#closed, 'Protocol error: Connection closed.');

    return this.#callbacks.create(method, this.#timeout, id => {
      const stringifiedMessage = JSON.stringify({
        id,
        method,
        params,
      } as Bidi.Command);
      debugProtocolSend(stringifiedMessage);
      this.#transport.send(stringifiedMessage);
    }) as Promise<{result: Commands[T]['returnType']}>;
  }

  /**
   * @internal
   */
  protected async onMessage(message: string): Promise<void> {
    if (this.#delay) {
      await new Promise(f => {
        return setTimeout(f, this.#delay);
      });
    }
    debugProtocolReceive(message);
    const object: Bidi.ChromiumBidi.Message = JSON.parse(message);
    if ('type' in object) {
      switch (object.type) {
        case 'success':
          this.#callbacks.resolve(object.id, object);
          return;
        case 'error':
          if (object.id === null) {
            break;
          }
          this.#callbacks.reject(
            object.id,
            createProtocolError(object),
            object.message
          );
          return;
        case 'event':
          if (isCdpEvent(object)) {
            cdpSessions
              .get(object.params.session)
              ?.emit(object.params.event, object.params.params);
            return;
          }
          this.#maybeEmitOnContext(object);
          // SAFETY: We know the method and parameter still match here.
          this.emit(
            object.method,
            object.params as BidiEvents[keyof BidiEvents]
          );
          return;
      }
    }
    // Even if the response in not in BiDi protocol format but `id` is provided, reject
    // the callback. This can happen if the endpoint supports CDP instead of BiDi.
    if ('id' in object) {
      this.#callbacks.reject(
        (object as {id: number}).id,
        `Protocol Error. Message is not in BiDi protocol format: '${message}'`,
        object.message
      );
    }
    debugError(object);
  }

  #maybeEmitOnContext(event: Bidi.ChromiumBidi.Event) {
    let context: BrowsingContext | undefined;
    // Context specific events
    if ('context' in event.params && event.params.context !== null) {
      context = this.#browsingContexts.get(event.params.context);
      // `log.entryAdded` specific context
    } else if (
      'source' in event.params &&
      event.params.source.context !== undefined
    ) {
      context = this.#browsingContexts.get(event.params.source.context);
    }
    context?.emit(event.method, event.params);
  }

  registerBrowsingContexts(context: BrowsingContext): void {
    this.#browsingContexts.set(context.id, context);
  }

  getBrowsingContext(contextId: string): BrowsingContext {
    const currentContext = this.#browsingContexts.get(contextId);
    if (!currentContext) {
      throw new Error(`BrowsingContext ${contextId} does not exist.`);
    }
    return currentContext;
  }

  getTopLevelContext(contextId: string): BrowsingContext {
    let currentContext = this.#browsingContexts.get(contextId);
    if (!currentContext) {
      throw new Error(`BrowsingContext ${contextId} does not exist.`);
    }
    while (currentContext.parent) {
      contextId = currentContext.parent;
      currentContext = this.#browsingContexts.get(contextId);
      if (!currentContext) {
        throw new Error(`BrowsingContext ${contextId} does not exist.`);
      }
    }
    return currentContext;
  }

  unregisterBrowsingContexts(id: string): void {
    this.#browsingContexts.delete(id);
  }

  /**
   * Unbinds the connection, but keeps the transport open. Useful when the transport will
   * be reused by other connection e.g. with different protocol.
   * @internal
   */
  unbind(): void {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    // Both may still be invoked and produce errors
    this.#transport.onmessage = () => {};
    this.#transport.onclose = () => {};

    this.#browsingContexts.clear();
    this.#callbacks.clear();
  }

  /**
   * Unbinds the connection and closes the transport.
   */
  dispose(): void {
    this.unbind();
    this.#transport.close();
  }
}

/**
 * @internal
 */
function createProtocolError(object: Bidi.ErrorResponse): string {
  let message = `${object.error} ${object.message}`;
  if (object.stacktrace) {
    message += ` ${object.stacktrace}`;
  }
  return message;
}

function isCdpEvent(event: Bidi.ChromiumBidi.Event): event is Bidi.Cdp.Event {
  return event.method.startsWith('cdp.');
}
