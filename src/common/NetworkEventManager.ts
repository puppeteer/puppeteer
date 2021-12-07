import { Protocol } from 'devtools-protocol';
import { HTTPRequest } from './HTTPRequest.js';

export type QueuedEvents = {
  responseReceived: Protocol.Network.ResponseReceivedEvent;
  promise: Promise<void>;
  resolver: () => void;
  loadingFinished?: Protocol.Network.LoadingFinishedEvent;
  loadingFailed?: Protocol.Network.LoadingFailedEvent;
};

export type FetchRequestId = string;
export type NetworkRequestId = string;

export type RedirectInfoMap = Array<{
  event: Protocol.Network.RequestWillBeSentEvent;
  fetchRequestId?: FetchRequestId;
}>;

/**
 * @internal
 *
 * Helper class to track network events by request ID
 */
export class NetworkEventManager {
  /*
   * There are four possible orders of events:
   *  A. `_onRequestWillBeSent`
   *  B. `_onRequestWillBeSent`, `_onRequestPaused`
   *  C. `_onRequestPaused`, `_onRequestWillBeSent`
   *  D. `_onRequestPaused`, `_onRequestWillBeSent`, `_onRequestPaused`,
   *     `_onRequestWillBeSent`, `_onRequestPaused`, `_onRequestPaused`
   *     (see crbug.com/1196004)
   *
   * For `_onRequest` we need the event from `_onRequestWillBeSent` and
   * optionally the `interceptionId` from `_onRequestPaused`.
   *
   * If request interception is disabled, call `_onRequest` once per call to
   * `_onRequestWillBeSent`.
   * If request interception is enabled, call `_onRequest` once per call to
   * `_onRequestPaused` (once per `interceptionId`).
   *
   * Events are stored to allow for subsequent events to call `_onRequest`.
   *
   * Note that (chains of) redirect requests have the same `requestId` (!) as
   * the original request. We have to anticipate series of events like these:
   *  A. `_onRequestWillBeSent`,
   *     `_onRequestWillBeSent`, ...
   *  B. `_onRequestWillBeSent`, `_onRequestPaused`,
   *     `_onRequestWillBeSent`, `_onRequestPaused`, ...
   *  C. `_onRequestWillBeSent`, `_onRequestPaused`,
   *     `_onRequestPaused`, `_onRequestWillBeSent`, ...
   *  D. `_onRequestPaused`, `_onRequestWillBeSent`,
   *     `_onRequestPaused`, `_onRequestWillBeSent`, `_onRequestPaused`,
   *     `_onRequestWillBeSent`, `_onRequestPaused`, `_onRequestPaused`, ...
   *     (see crbug.com/1196004)
   */
  requestWillBeSent = new Map<
    NetworkRequestId,
    Protocol.Network.RequestWillBeSentEvent
  >();
  requestPaused = new Map<
    NetworkRequestId,
    Protocol.Fetch.RequestPausedEvent
  >();
  httpRequest = new Map<NetworkRequestId, HTTPRequest>();

  /*
   * The below maps are used to reconcile Network.responseReceivedExtraInfo
   * events with their corresponding request. Each response and redirect
   * response gets an ExtraInfo event, and we don't know which will come first.
   * This means that we have to store a Response or an ExtraInfo for each
   * response, and emit the event when we get both of them. In addition, to
   * handle redirects, we have to make them Arrays to represent the chain of
   * events.
   */
  private _responseReceivedExtraInfo = new Map<
    NetworkRequestId,
    Protocol.Network.ResponseReceivedExtraInfoEvent[]
  >();
  private _queuedRedirectInfoMap = new Map<NetworkRequestId, RedirectInfoMap>();
  queuedEvents = new Map<NetworkRequestId, QueuedEvents>();

  forget(networkRequestId: NetworkRequestId): void {
    this.requestWillBeSent.delete(networkRequestId);
    this.requestPaused.delete(networkRequestId);
    this.queuedEvents.delete(networkRequestId);
    this._queuedRedirectInfoMap.delete(networkRequestId);
    this._responseReceivedExtraInfo.delete(networkRequestId);
  }

  responseExtraInfo(
    networkRequestId: NetworkRequestId
  ): Protocol.Network.ResponseReceivedExtraInfoEvent[] {
    if (!this._responseReceivedExtraInfo.has(networkRequestId)) {
      this._responseReceivedExtraInfo.set(networkRequestId, []);
    }
    return this._responseReceivedExtraInfo.get(networkRequestId);
  }

  queuedRedirectInfo(fetchRequestId: FetchRequestId): RedirectInfoMap {
    if (!this._queuedRedirectInfoMap.has(fetchRequestId)) {
      this._queuedRedirectInfoMap.set(fetchRequestId, []);
    }
    return this._queuedRedirectInfoMap.get(fetchRequestId);
  }
}
