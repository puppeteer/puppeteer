/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {Observable} from '../../third_party/rxjs/rxjs.js';
import {
  combineLatest,
  defer,
  delayWhen,
  filter,
  first,
  firstValueFrom,
  map,
  of,
  raceWith,
  switchMap,
} from '../../third_party/rxjs/rxjs.js';
import type {CDPSession} from '../api/CDPSession.js';
import type {ElementHandle} from '../api/ElementHandle.js';
import {
  Frame,
  throwIfDetached,
  type GoToOptions,
  type WaitForOptions,
} from '../api/Frame.js';
import type {WaitForSelectorOptions} from '../api/Page.js';
import {PageEvent} from '../api/Page.js';
import {
  ConsoleMessage,
  type ConsoleMessageLocation,
} from '../common/ConsoleMessage.js';
import {TargetCloseError, UnsupportedOperation} from '../common/Errors.js';
import type {TimeoutSettings} from '../common/TimeoutSettings.js';
import type {Awaitable, NodeFor} from '../common/types.js';
import {debugError, fromEmitterEvent, timeout} from '../common/util.js';

import {BidiCdpSession} from './CDPSession.js';
import type {BrowsingContext} from './core/BrowsingContext.js';
import {BidiDeserializer} from './Deserializer.js';
import {BidiDialog} from './Dialog.js';
import {ExposeableFunction} from './ExposedFunction.js';
import {BidiHTTPRequest, requests} from './HTTPRequest.js';
import type {BidiHTTPResponse} from './HTTPResponse.js';
import {BidiJSHandle} from './JSHandle.js';
import type {BidiPage} from './Page.js';
import type {BidiRealm} from './Realm.js';
import {BidiFrameRealm} from './Realm.js';
import {rewriteNavigationError} from './util.js';
import {BidiWebWorker} from './WebWorker.js';

export class BidiFrame extends Frame {
  static from(
    parent: BidiPage | BidiFrame,
    browsingContext: BrowsingContext
  ): BidiFrame {
    const frame = new BidiFrame(parent, browsingContext);
    frame.#initialize();
    return frame;
  }

  readonly #parent: BidiPage | BidiFrame;
  readonly browsingContext: BrowsingContext;
  readonly #frames = new WeakMap<BrowsingContext, BidiFrame>();
  readonly realms: {default: BidiFrameRealm; internal: BidiFrameRealm};

  override readonly _id: string;
  override readonly client: BidiCdpSession;

  private constructor(
    parent: BidiPage | BidiFrame,
    browsingContext: BrowsingContext
  ) {
    super();
    this.#parent = parent;
    this.browsingContext = browsingContext;

    this._id = browsingContext.id;
    this.client = new BidiCdpSession(this);
    this.realms = {
      default: BidiFrameRealm.from(this.browsingContext.defaultRealm, this),
      internal: BidiFrameRealm.from(
        this.browsingContext.createWindowRealm(
          `__puppeteer_internal_${Math.ceil(Math.random() * 10000)}`
        ),
        this
      ),
    };
  }

  #initialize(): void {
    for (const browsingContext of this.browsingContext.children) {
      this.#createFrameTarget(browsingContext);
    }

    this.browsingContext.on('browsingcontext', ({browsingContext}) => {
      this.#createFrameTarget(browsingContext);
    });
    this.browsingContext.on('closed', () => {
      for (const session of BidiCdpSession.sessions.values()) {
        if (session.frame === this) {
          void session.detach().catch(debugError);
        }
      }
      this.page().trustedEmitter.emit(PageEvent.FrameDetached, this);
    });

    this.browsingContext.on('request', ({request}) => {
      const httpRequest = BidiHTTPRequest.from(request, this);
      request.once('success', () => {
        // SAFETY: BidiHTTPRequest will create this before here.
        this.page().trustedEmitter.emit(PageEvent.RequestFinished, httpRequest);
      });

      request.once('error', () => {
        this.page().trustedEmitter.emit(PageEvent.RequestFailed, httpRequest);
      });
    });

    this.browsingContext.on('navigation', ({navigation}) => {
      navigation.once('fragment', () => {
        this.page().trustedEmitter.emit(PageEvent.FrameNavigated, this);
      });
    });
    this.browsingContext.on('load', () => {
      this.page().trustedEmitter.emit(PageEvent.Load, undefined);
    });
    this.browsingContext.on('DOMContentLoaded', () => {
      this._hasStartedLoading = true;
      this.page().trustedEmitter.emit(PageEvent.DOMContentLoaded, undefined);
      this.page().trustedEmitter.emit(PageEvent.FrameNavigated, this);
    });

    this.browsingContext.on('userprompt', ({userPrompt}) => {
      this.page().trustedEmitter.emit(
        PageEvent.Dialog,
        BidiDialog.from(userPrompt)
      );
    });

    this.browsingContext.on('log', ({entry}) => {
      if (this._id !== entry.source.context) {
        return;
      }
      if (isConsoleLogEntry(entry)) {
        const args = entry.args.map(arg => {
          return this.mainRealm().createHandle(arg);
        });

        const text = args
          .reduce((value, arg) => {
            const parsedValue =
              arg instanceof BidiJSHandle && arg.isPrimitiveValue
                ? BidiDeserializer.deserialize(arg.remoteValue())
                : arg.toString();
            return `${value} ${parsedValue}`;
          }, '')
          .slice(1);

        this.page().trustedEmitter.emit(
          PageEvent.Console,
          new ConsoleMessage(
            entry.method as any,
            text,
            args,
            getStackTraceLocations(entry.stackTrace)
          )
        );
      } else if (isJavaScriptLogEntry(entry)) {
        const error = new Error(entry.text ?? '');

        const messageHeight = error.message.split('\n').length;
        const messageLines = error.stack!.split('\n').splice(0, messageHeight);

        const stackLines = [];
        if (entry.stackTrace) {
          for (const frame of entry.stackTrace.callFrames) {
            // Note we need to add `1` because the values are 0-indexed.
            stackLines.push(
              `    at ${frame.functionName || '<anonymous>'} (${frame.url}:${
                frame.lineNumber + 1
              }:${frame.columnNumber + 1})`
            );
            if (stackLines.length >= Error.stackTraceLimit) {
              break;
            }
          }
        }

        error.stack = [...messageLines, ...stackLines].join('\n');
        this.page().trustedEmitter.emit(PageEvent.PageError, error);
      } else {
        debugError(
          `Unhandled LogEntry with type "${entry.type}", text "${entry.text}" and level "${entry.level}"`
        );
      }
    });

    this.browsingContext.on('worker', ({realm}) => {
      const worker = BidiWebWorker.from(this, realm);
      realm.on('destroyed', () => {
        this.page().trustedEmitter.emit(PageEvent.WorkerDestroyed, worker);
      });
      this.page().trustedEmitter.emit(PageEvent.WorkerCreated, worker);
    });
  }

  #createFrameTarget(browsingContext: BrowsingContext) {
    const frame = BidiFrame.from(this, browsingContext);
    this.#frames.set(browsingContext, frame);
    this.page().trustedEmitter.emit(PageEvent.FrameAttached, frame);

    browsingContext.on('closed', () => {
      this.#frames.delete(browsingContext);
    });

    return frame;
  }

  get timeoutSettings(): TimeoutSettings {
    return this.page()._timeoutSettings;
  }

  override mainRealm(): BidiFrameRealm {
    return this.realms.default;
  }

  override isolatedRealm(): BidiFrameRealm {
    return this.realms.internal;
  }

  realm(id: string): BidiRealm | undefined {
    for (const realm of Object.values(this.realms)) {
      if (realm.realm.id === id) {
        return realm;
      }
    }
    return;
  }

  override page(): BidiPage {
    let parent = this.#parent;
    while (parent instanceof BidiFrame) {
      parent = parent.#parent;
    }
    return parent;
  }

  override isOOPFrame(): never {
    throw new UnsupportedOperation();
  }

  override url(): string {
    return this.browsingContext.url;
  }

  override parentFrame(): BidiFrame | null {
    if (this.#parent instanceof BidiFrame) {
      return this.#parent;
    }
    return null;
  }

  override childFrames(): BidiFrame[] {
    return [...this.browsingContext.children].map(child => {
      return this.#frames.get(child)!;
    });
  }

  #detached$() {
    return defer(() => {
      if (this.detached) {
        return of(this as Frame);
      }
      return fromEmitterEvent(
        this.page().trustedEmitter,
        PageEvent.FrameDetached
      ).pipe(
        filter(detachedFrame => {
          return detachedFrame === this;
        })
      );
    });
  }

  @throwIfDetached
  override async goto(
    url: string,
    options: GoToOptions = {}
  ): Promise<BidiHTTPResponse | null> {
    const [response] = await Promise.all([
      this.waitForNavigation(options),
      // Some implementations currently only report errors when the
      // readiness=interactive.
      //
      // Related: https://bugzilla.mozilla.org/show_bug.cgi?id=1846601
      this.browsingContext.navigate(
        url,
        Bidi.BrowsingContext.ReadinessState.Interactive
      ),
    ]).catch(
      rewriteNavigationError(
        url,
        options.timeout ?? this.timeoutSettings.navigationTimeout()
      )
    );
    return response;
  }

  @throwIfDetached
  override async setContent(
    html: string,
    options: WaitForOptions = {}
  ): Promise<void> {
    await Promise.all([
      this.setFrameContent(html),
      firstValueFrom(
        combineLatest([
          this.#waitForLoad$(options),
          this.#waitForNetworkIdle$(options),
        ])
      ),
    ]);
  }

  @throwIfDetached
  override async waitForNavigation(
    options: WaitForOptions = {}
  ): Promise<BidiHTTPResponse | null> {
    const {timeout: ms = this.timeoutSettings.navigationTimeout()} = options;

    const frames = this.childFrames().map(frame => {
      return frame.#detached$();
    });
    return await firstValueFrom(
      combineLatest([
        fromEmitterEvent(this.browsingContext, 'navigation').pipe(
          switchMap(({navigation}) => {
            return this.#waitForLoad$(options).pipe(
              delayWhen(() => {
                if (frames.length === 0) {
                  return of(undefined);
                }
                return combineLatest(frames);
              }),
              raceWith(
                fromEmitterEvent(navigation, 'fragment'),
                fromEmitterEvent(navigation, 'failed').pipe(
                  map(({url}) => {
                    throw new Error(`Navigation failed: ${url}`);
                  })
                ),
                fromEmitterEvent(navigation, 'aborted').pipe(
                  map(({url}) => {
                    throw new Error(`Navigation aborted: ${url}`);
                  })
                )
              ),
              map(() => {
                return navigation;
              })
            );
          })
        ),
        this.#waitForNetworkIdle$(options),
      ]).pipe(
        map(([navigation]) => {
          const request = navigation.request;
          if (!request) {
            return null;
          }
          const httpRequest = requests.get(request)!;
          const lastRedirect = httpRequest.redirectChain().at(-1);
          return (
            lastRedirect !== undefined ? lastRedirect : httpRequest
          ).response();
        }),
        raceWith(
          timeout(ms),
          this.#detached$().pipe(
            map(() => {
              throw new TargetCloseError('Frame detached.');
            })
          )
        )
      )
    );
  }

  override waitForDevicePrompt(): never {
    throw new UnsupportedOperation();
  }

  override get detached(): boolean {
    return this.browsingContext.closed;
  }

  #exposedFunctions = new Map<string, ExposeableFunction<never[], unknown>>();
  async exposeFunction<Args extends unknown[], Ret>(
    name: string,
    apply: (...args: Args) => Awaitable<Ret>
  ): Promise<void> {
    if (this.#exposedFunctions.has(name)) {
      throw new Error(
        `Failed to add page binding with name ${name}: globalThis['${name}'] already exists!`
      );
    }
    const exposeable = new ExposeableFunction(this, name, apply);
    this.#exposedFunctions.set(name, exposeable);
    try {
      await exposeable.expose();
    } catch (error) {
      this.#exposedFunctions.delete(name);
      throw error;
    }
  }

  override waitForSelector<Selector extends string>(
    selector: Selector,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    if (selector.startsWith('aria')) {
      throw new UnsupportedOperation(
        'ARIA selector is not supported for BiDi!'
      );
    }

    return super.waitForSelector(selector, options);
  }

  async createCDPSession(): Promise<CDPSession> {
    const {sessionId} = await this.client.send('Target.attachToTarget', {
      targetId: this._id,
      flatten: true,
    });
    return new BidiCdpSession(this, sessionId);
  }

  @throwIfDetached
  #waitForLoad$(options: WaitForOptions = {}): Observable<void> {
    let {waitUntil = 'load'} = options;
    const {timeout: ms = this.timeoutSettings.navigationTimeout()} = options;

    if (!Array.isArray(waitUntil)) {
      waitUntil = [waitUntil];
    }

    const events = new Set<'load' | 'DOMContentLoaded'>();
    for (const lifecycleEvent of waitUntil) {
      switch (lifecycleEvent) {
        case 'load': {
          events.add('load');
          break;
        }
        case 'domcontentloaded': {
          events.add('DOMContentLoaded');
          break;
        }
      }
    }
    if (events.size === 0) {
      return of(undefined);
    }

    return combineLatest(
      [...events].map(event => {
        return fromEmitterEvent(this.browsingContext, event);
      })
    ).pipe(
      map(() => {}),
      first(),
      raceWith(
        timeout(ms),
        this.#detached$().pipe(
          map(() => {
            throw new Error('Frame detached.');
          })
        )
      )
    );
  }

  @throwIfDetached
  #waitForNetworkIdle$(options: WaitForOptions = {}): Observable<void> {
    let {waitUntil = 'load'} = options;
    if (!Array.isArray(waitUntil)) {
      waitUntil = [waitUntil];
    }

    let concurrency = Infinity;
    for (const event of waitUntil) {
      switch (event) {
        case 'networkidle0': {
          concurrency = Math.min(0, concurrency);
          break;
        }
        case 'networkidle2': {
          concurrency = Math.min(2, concurrency);
          break;
        }
      }
    }
    if (concurrency === Infinity) {
      return of(undefined);
    }

    return this.page().waitForNetworkIdle$({
      idleTime: 500,
      timeout: options.timeout ?? this.timeoutSettings.timeout(),
      concurrency,
    });
  }
}

function isConsoleLogEntry(
  event: Bidi.Log.Entry
): event is Bidi.Log.ConsoleLogEntry {
  return event.type === 'console';
}

function isJavaScriptLogEntry(
  event: Bidi.Log.Entry
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
