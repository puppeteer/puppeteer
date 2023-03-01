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
import {ConsoleMessage, ConsoleMessageLocation} from '../ConsoleMessage.js';
import {EvaluateFunc, HandleFor} from '../types.js';

import {Context, getBidiHandle} from './Context.js';
import {BidiSerializer} from './Serializer.js';

/**
 * @internal
 */
export class Page extends PageBase {
  #context: Context;
  #subscribedEvents = [
    'log.entryAdded',
  ] as Bidi.Session.SubscribeParameters['events'];
  #boundOnLogEntryAdded = this.#onLogEntryAdded.bind(this);

  constructor(context: Context) {
    super();
    this.#context = context;

    this.#context.connection.send('session.subscribe', {
      events: this.#subscribedEvents,
      contexts: [this.#context.id],
    });

    this.#context.on('log.entryAdded', this.#boundOnLogEntryAdded);
  }

  #onLogEntryAdded(event: Bidi.Log.LogEntry): void {
    if (isConsoleLogEntry(event)) {
      const args = event.args.map(arg => {
        return getBidiHandle(this.#context, arg);
      });

      const text = args
        .reduce((value, arg) => {
          const parsedValue = arg.isPrimitiveValue
            ? BidiSerializer.deserialize(arg.remoteValue())
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
    await this.#context.connection.send('session.unsubscribe', {
      events: this.#subscribedEvents,
      contexts: [this.#context.id],
    });

    await this.#context.connection.send('browsingContext.close', {
      context: this.#context.id,
    });

    this.#context.off('log.entryAdded', this.#boundOnLogEntryAdded);
  }

  override async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return this.#context.evaluateHandle(pageFunction, ...args);
  }

  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.#context.evaluate(pageFunction, ...args);
  }
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
