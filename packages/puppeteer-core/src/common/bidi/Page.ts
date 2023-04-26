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

import type {Readable} from 'stream';

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {HTTPResponse} from '../../api/HTTPResponse.js';
import {
  Page as PageBase,
  PageEmittedEvents,
  ScreenshotOptions,
  WaitForOptions,
} from '../../api/Page.js';
import {isErrorLike} from '../../util/ErrorLike.js';
import {ConsoleMessage, ConsoleMessageLocation} from '../ConsoleMessage.js';
import {Handler} from '../EventEmitter.js';
import {PDFOptions} from '../PDFOptions.js';
import {Viewport} from '../PuppeteerViewport.js';
import {EvaluateFunc, HandleFor} from '../types.js';
import {debugError, waitWithTimeout} from '../util.js';

import {Context, getBidiHandle} from './Context.js';
import {BidiSerializer} from './Serializer.js';

/**
 * @internal
 */
export class Page extends PageBase {
  #context: Context;
  #subscribedEvents = new Map<string, Handler<any>>([
    ['log.entryAdded', this.#onLogEntryAdded.bind(this)],
    ['browsingContext.load', this.#onLoad.bind(this)],
    ['browsingContext.domContentLoaded', this.#onDOMLoad.bind(this)],
  ]) as Map<Bidi.Session.SubscribeParametersEvent, Handler>;
  #viewport: Viewport | null = null;

  constructor(context: Context) {
    super();
    this.#context = context;

    this.#context.connection
      .send('session.subscribe', {
        events: [
          ...this.#subscribedEvents.keys(),
        ] as Bidi.Session.SubscribeParameters['events'],
        contexts: [this.#context.id],
      })
      .catch(error => {
        if (isErrorLike(error) && !error.message.includes('Target closed')) {
          throw error;
        }
      });

    for (const [event, subscriber] of this.#subscribedEvents) {
      this.#context.on(event, subscriber);
    }
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
      let message = event.text ?? '';

      if (event.stackTrace) {
        for (const callFrame of event.stackTrace.callFrames) {
          const location =
            callFrame.url +
            ':' +
            callFrame.lineNumber +
            ':' +
            callFrame.columnNumber;
          const functionName = callFrame.functionName || '<anonymous>';
          message += `\n    at ${functionName} (${location})`;
        }
      }

      const error = new Error(message);
      error.stack = ''; // Don't capture Puppeteer stacktrace.

      this.emit(PageEmittedEvents.PageError, error);
    } else {
      debugError(
        `Unhandled LogEntry with type "${event.type}", text "${event.text}" and level "${event.level}"`
      );
    }
  }

  #onLoad(_event: Bidi.BrowsingContext.NavigationInfo): void {
    this.emit(PageEmittedEvents.Load);
  }

  #onDOMLoad(_event: Bidi.BrowsingContext.NavigationInfo): void {
    this.emit(PageEmittedEvents.DOMContentLoaded);
  }

  override async close(): Promise<void> {
    await this.#context.connection.send('session.unsubscribe', {
      events: [...this.#subscribedEvents.keys()],
      contexts: [this.#context.id],
    });

    await this.#context.connection.send('browsingContext.close', {
      context: this.#context.id,
    });

    for (const [event, subscriber] of this.#subscribedEvents) {
      this.#context.off(event, subscriber);
    }
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

  override async goto(
    url: string,
    options?: WaitForOptions & {
      referer?: string | undefined;
      referrerPolicy?: string | undefined;
    }
  ): Promise<HTTPResponse | null> {
    return this.#context.goto(url, options);
  }

  override url(): string {
    return this.#context.url();
  }

  override setDefaultNavigationTimeout(timeout: number): void {
    this.#context._timeoutSettings.setDefaultNavigationTimeout(timeout);
  }

  override setDefaultTimeout(timeout: number): void {
    this.#context._timeoutSettings.setDefaultTimeout(timeout);
  }

  override async setContent(
    html: string,
    options: WaitForOptions = {}
  ): Promise<void> {
    await this.#context.setContent(html, options);
  }

  override async content(): Promise<string> {
    return await this.evaluate(() => {
      let retVal = '';
      if (document.doctype) {
        retVal = new XMLSerializer().serializeToString(document.doctype);
      }
      if (document.documentElement) {
        retVal += document.documentElement.outerHTML;
      }
      return retVal;
    });
  }

  override async setViewport(viewport: Viewport): Promise<void> {
    // TODO: use BiDi commands when available.
    const mobile = false;
    const width = viewport.width;
    const height = viewport.height;
    const deviceScaleFactor = 1;
    const screenOrientation = {angle: 0, type: 'portraitPrimary'};

    await this.#context.sendCDPCommand('Emulation.setDeviceMetricsOverride', {
      mobile,
      width,
      height,
      deviceScaleFactor,
      screenOrientation,
    });

    this.#viewport = viewport;
  }

  override viewport(): Viewport | null {
    return this.#viewport;
  }

  override async pdf(options: PDFOptions = {}): Promise<Buffer> {
    const {path = undefined} = options;
    const {
      printBackground: background,
      margin,
      landscape,
      width,
      height,
      pageRanges,
      scale,
      preferCSSPageSize,
      timeout,
    } = this._getPDFOptions(options, 'cm');
    const {result} = await waitWithTimeout(
      this.#context.connection.send('browsingContext.print', {
        context: this.#context._contextId,
        background,
        margin,
        orientation: landscape ? 'landscape' : 'portrait',
        page: {
          width,
          height,
        },
        pageRanges: pageRanges.split(', '),
        scale,
        shrinkToFit: !preferCSSPageSize,
      }),
      'browsingContext.print',
      timeout
    );

    const buffer = Buffer.from(result.data, 'base64');

    await this._maybeWriteBufferToFile(path, buffer);

    return buffer;
  }

  override async createPDFStream(
    options?: PDFOptions | undefined
  ): Promise<Readable> {
    const buffer = await this.pdf(options);
    try {
      const {Readable} = await import('stream');
      return Readable.from(buffer);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          'Can only pass a file path in a Node-like environment.'
        );
      }
      throw error;
    }
  }

  override screenshot(
    options: ScreenshotOptions & {encoding: 'base64'}
  ): Promise<string>;
  override screenshot(
    options?: ScreenshotOptions & {encoding?: 'binary'}
  ): never;
  override async screenshot(
    options: ScreenshotOptions = {}
  ): Promise<Buffer | string> {
    const {path = undefined, encoding, ...args} = options;
    if (Object.keys(args).length >= 1) {
      throw new Error('BiDi only supports "encoding" and "path" options');
    }

    const {result} = await this.#context.connection.send(
      'browsingContext.captureScreenshot',
      {
        context: this.#context._contextId,
      }
    );

    if (encoding === 'base64') {
      return result.data;
    }

    const buffer = Buffer.from(result.data, 'base64');
    await this._maybeWriteBufferToFile(path, buffer);

    return buffer;
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

function getStackTraceLocations(
  stackTrace?: Bidi.Script.StackTrace
): ConsoleMessageLocation[] {
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
