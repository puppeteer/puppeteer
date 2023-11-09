import type {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';

import type {Connection} from '../cdp/Connection.js';
import {EventEmitter, type EventType} from '../common/EventEmitter.js';

/**
 * @public
 */
export type CDPEvents = {
  [Property in keyof ProtocolMapping.Events]: ProtocolMapping.Events[Property][0];
};

/**
 * Events that the CDPSession class emits.
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CDPSessionEvent {
  /** @internal */
  export const Disconnected = Symbol('CDPSession.Disconnected');
  /** @internal */
  export const Swapped = Symbol('CDPSession.Swapped');
  /**
   * Emitted when the session is ready to be configured during the auto-attach
   * process. Right after the event is handled, the session will be resumed.
   *
   * @internal
   */
  export const Ready = Symbol('CDPSession.Ready');
  export const SessionAttached = 'sessionattached' as const;
  export const SessionDetached = 'sessiondetached' as const;
}

/**
 * @public
 */
export interface CDPSessionEvents
  extends CDPEvents,
    Record<EventType, unknown> {
  /** @internal */
  [CDPSessionEvent.Disconnected]: undefined;
  /** @internal */
  [CDPSessionEvent.Swapped]: CDPSession;
  /** @internal */
  [CDPSessionEvent.Ready]: CDPSession;
  [CDPSessionEvent.SessionAttached]: CDPSession;
  [CDPSessionEvent.SessionDetached]: CDPSession;
}

/**
 * The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * @remarks
 *
 * Protocol methods can be called with {@link CDPSession.send} method and protocol
 * events can be subscribed to with `CDPSession.on` method.
 *
 * Useful links: {@link https://chromedevtools.github.io/devtools-protocol/ | DevTools Protocol Viewer}
 * and {@link https://github.com/aslushnikov/getting-started-with-cdp/blob/HEAD/README.md | Getting Started with DevTools Protocol}.
 *
 * @example
 *
 * ```ts
 * const client = await page.target().createCDPSession();
 * await client.send('Animation.enable');
 * client.on('Animation.animationCreated', () =>
 *   console.log('Animation created!')
 * );
 * const response = await client.send('Animation.getPlaybackRate');
 * console.log('playback rate is ' + response.playbackRate);
 * await client.send('Animation.setPlaybackRate', {
 *   playbackRate: response.playbackRate / 2,
 * });
 * ```
 *
 * @public
 */
export abstract class CDPSession extends EventEmitter<CDPSessionEvents> {
  /**
   * @internal
   */
  constructor() {
    super();
  }

  abstract connection(): Connection | undefined;

  /**
   * Parent session in terms of CDP's auto-attach mechanism.
   *
   * @internal
   */
  parentSession(): CDPSession | undefined {
    return undefined;
  }

  abstract send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;

  /**
   * Detaches the cdpSession from the target. Once detached, the cdpSession object
   * won't emit any events and can't be used to send messages.
   */
  abstract detach(): Promise<void>;

  /**
   * Returns the session's id.
   */
  abstract id(): string;
}
