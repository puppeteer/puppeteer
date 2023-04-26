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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {CallbackRegistry} from '../Connection.js';
import {ConnectionTransport} from '../ConnectionTransport.js';
import {debug} from '../Debug.js';
import {EventEmitter} from '../EventEmitter.js';

import {Context} from './Context.js';

const debugProtocolSend = debug('puppeteer:webDriverBiDi:SEND ►');
const debugProtocolReceive = debug('puppeteer:webDriverBiDi:RECV ◀');

/**
 * @internal
 */
interface Commands {
  'script.evaluate': {
    params: Bidi.Script.EvaluateParameters;
    returnType: Bidi.Script.EvaluateResult;
  };
  'script.callFunction': {
    params: Bidi.Script.CallFunctionParameters;
    returnType: Bidi.Script.CallFunctionResult;
  };
  'script.disown': {
    params: Bidi.Script.DisownParameters;
    returnType: Bidi.Script.DisownResult;
  };

  'browsingContext.create': {
    params: Bidi.BrowsingContext.CreateParameters;
    returnType: Bidi.BrowsingContext.CreateResult;
  };
  'browsingContext.close': {
    params: Bidi.BrowsingContext.CloseParameters;
    returnType: Bidi.BrowsingContext.CloseResult;
  };
  'browsingContext.navigate': {
    params: Bidi.BrowsingContext.NavigateParameters;
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

  'session.new': {
    params: {capabilities?: Record<any, unknown>}; // TODO: Update Types in chromium bidi
    returnType: {sessionId: string};
  };
  'session.status': {
    params: object;
    returnType: Bidi.Session.StatusResult;
  };
  'session.subscribe': {
    params: Bidi.Session.SubscribeParameters;
    returnType: Bidi.Session.SubscribeResult;
  };
  'session.unsubscribe': {
    params: Bidi.Session.SubscribeParameters;
    returnType: Bidi.Session.UnsubscribeResult;
  };
  'cdp.sendCommand': {
    params: Bidi.CDP.SendCommandParams;
    returnType: Bidi.CDP.SendCommandResult;
  };
  'cdp.getSession': {
    params: Bidi.CDP.GetSessionParams;
    returnType: Bidi.CDP.GetSessionResult;
  };
}

/**
 * @internal
 */
export class Connection extends EventEmitter {
  #transport: ConnectionTransport;
  #delay: number;
  #timeout? = 0;
  #closed = false;
  #callbacks = new CallbackRegistry();
  #contexts: Map<string, Context> = new Map();

  constructor(transport: ConnectionTransport, delay = 0, timeout?: number) {
    super();
    this.#delay = delay;
    this.#timeout = timeout ?? 180_000;

    this.#transport = transport;
    this.#transport.onmessage = this.onMessage.bind(this);
    this.#transport.onclose = this.#onClose.bind(this);
  }

  get closed(): boolean {
    return this.#closed;
  }

  context(contextId: string): Context | null {
    return this.#contexts.get(contextId) || null;
  }

  send<T extends keyof Commands>(
    method: T,
    params: Commands[T]['params']
  ): Promise<Commands[T]['returnType']> {
    return this.#callbacks.create(method, this.#timeout, id => {
      const stringifiedMessage = JSON.stringify({
        id,
        method,
        params,
      } as Bidi.Message.CommandRequest);
      debugProtocolSend(stringifiedMessage);
      this.#transport.send(stringifiedMessage);
    }) as Promise<Commands[T]['returnType']>;
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
    const object = JSON.parse(message) as
      | Bidi.Message.CommandResponse
      | Bidi.Message.EventMessage;

    if ('id' in object) {
      if ('error' in object) {
        this.#callbacks.reject(
          object.id,
          createProtocolError(object),
          object.message
        );
      } else {
        this.#callbacks.resolve(object.id, object);
      }
    } else {
      this.#handleSpecialEvents(object);
      this.#maybeEmitOnContext(object);
      this.emit(object.method, object.params);
    }
  }

  #maybeEmitOnContext(event: Bidi.Message.EventMessage) {
    let context: Context | undefined;
    // Context specific events
    if ('context' in event.params && event.params.context) {
      context = this.#contexts.get(event.params.context);
      // `log.entryAdded` specific context
    } else if ('source' in event.params && event.params.source.context) {
      context = this.#contexts.get(event.params.source.context);
    }
    context?.emit(event.method, event.params);
  }

  #handleSpecialEvents(event: Bidi.Message.EventMessage) {
    switch (event.method) {
      case 'browsingContext.contextCreated':
        this.#contexts.set(
          event.params.context,
          new Context(this, event.params)
        );
    }
  }

  #onClose(): void {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    this.#transport.onmessage = undefined;
    this.#transport.onclose = undefined;
    this.#callbacks.clear();
  }

  dispose(): void {
    this.#onClose();
    this.#transport.close();
  }
}

/**
 * @internal
 */
function createProtocolError(object: Bidi.Message.ErrorResult): string {
  let message = `${object.error} ${object.message}`;
  if (object.stacktrace) {
    message += ` ${object.stacktrace}`;
  }
  return message;
}
