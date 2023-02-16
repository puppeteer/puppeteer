/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {Page as PageBase, PageEmittedEvents} from '../../api/Page.js';
import {stringifyFunction} from '../../util/Function.js';
import {ConsoleMessage, ConsoleMessageLocation} from '../ConsoleMessage.js';
import type {EvaluateFunc, HandleFor} from '../types.js';
import {isString} from '../util.js';

import {Connection} from './Connection.js';
import {JSHandle} from './JSHandle.js';
import {BidiSerializer} from './Serializer.js';

/**
 * @internal
 */
export class Page extends PageBase {
  #connection: Connection;
  #subscribedEvents = [
    'log.entryAdded',
  ] as Bidi.Session.SubscribeParameters['events'];
  _contextId: string;

  constructor(connection: Connection, contextId: string) {
    super();
    this.#connection = connection;
    this._contextId = contextId;

    this.connection.send('session.subscribe', {
      events: this.#subscribedEvents,
      contexts: [this._contextId],
    });

    this.connection.on('log.entryAdded', this.#onLogEntryAdded.bind(this));
  }

  #onLogEntryAdded(event: Bidi.Log.LogEntry): void {
    if (isConsoleLogEntry(event)) {
      const args = event.args.map(arg => {
        return getBidiHandle(this, arg);
      });

      const text = args
        .reduce((value, arg) => {
          const parsedValue = arg.isPrimitiveValue
            ? BidiSerializer.deserialize(arg.bidiObject())
            : arg.toString();
          return `${value} ${parsedValue}`;
        }, '')
        .slice(1);

      this.emit(
        PageEmittedEvents.Console,
        new ConsoleMessage(
          event.method as any,
          text,
          args,
          getStackTraceLocations(event.stackTrace)
        )
      );
    } else if (isJavaScriptLogEntry(event)) {
      this.emit(
        PageEmittedEvents.Console,
        new ConsoleMessage(
          event.level as any,
          event.text ?? '',
          [],
          getStackTraceLocations(event.stackTrace)
        )
      );
    }
  }

  override async close(): Promise<void> {
    await this.#connection.send('browsingContext.close', {
      context: this._contextId,
    });
  }

  get connection(): Connection {
    return this.#connection;
  }

  override async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return this.#evaluate(false, pageFunction, ...args);
  }

  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.#evaluate(true, pageFunction, ...args);
  }

  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    returnByValue: true,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    returnByValue: false,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    returnByValue: boolean,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>> | Awaited<ReturnType<Func>>> {
    let responsePromise;
    const resultOwnership = returnByValue ? 'none' : 'root';
    if (isString(pageFunction)) {
      responsePromise = this.#connection.send('script.evaluate', {
        expression: pageFunction,
        target: {context: this._contextId},
        resultOwnership,
        awaitPromise: true,
      });
    } else {
      responsePromise = this.#connection.send('script.callFunction', {
        functionDeclaration: stringifyFunction(pageFunction),
        arguments: await Promise.all(
          args.map(arg => {
            return BidiSerializer.serialize(arg, this);
          })
        ),
        target: {context: this._contextId},
        resultOwnership,
        awaitPromise: true,
      });
    }

    const {result} = await responsePromise;

    if ('type' in result && result.type === 'exception') {
      throw new Error(result.exceptionDetails.text);
    }

    return returnByValue
      ? BidiSerializer.deserialize(result.result)
      : getBidiHandle(this, result.result);
  }
}

/**
 * @internal
 */
export function getBidiHandle(
  context: Page,
  result: Bidi.CommonDataTypes.RemoteValue
): JSHandle {
  if (
    (result.type === 'node' || result.type === 'window') &&
    context._contextId
  ) {
    // TODO: Implement ElementHandle
    return new JSHandle(context, result);
  }
  return new JSHandle(context, result);
}

function isConsoleLogEntry(
  event: Bidi.Log.LogEntry
): event is Bidi.Log.ConsoleLogEntry {
  return event.type === 'console';
}

function isJavaScriptLogEntry(
  event: Bidi.Log.LogEntry
): event is Bidi.Log.JavascriptLogEntry {
  return event.type === 'javascript';
}

function getStackTraceLocations(stackTrace?: Bidi.Script.StackTrace) {
  const stackTraceLocations: ConsoleMessageLocation[] = [];
  if (stackTrace) {
    for (const callFrame of stackTrace.callFrames) {
      stackTraceLocations.push({
        url: callFrame.url,
        lineNumber: callFrame.lineNumber,
        columnNumber: callFrame.columnNumber,
      });
    }
  }
  return stackTraceLocations;
}
