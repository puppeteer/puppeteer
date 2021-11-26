import { Protocol } from 'devtools-protocol';
import { HTTPRequest } from './HTTPRequest.js';

type QueuedEvents = {
  responseReceived: Protocol.Network.ResponseReceivedEvent;
  promise: Promise<void>;
  resolver: () => void;
  loadingFinished?: Protocol.Network.LoadingFinishedEvent;
  loadingFailed?: Protocol.Network.LoadingFailedEvent;
};
type RedirectInfoMap = Array<{
  event: Protocol.Network.RequestWillBeSentEvent;
  interceptionId?: string;
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
    string,
    Protocol.Network.RequestWillBeSentEvent
  >();
  requestPaused = new Map<string, Protocol.Fetch.RequestPausedEvent>();
  httpRequest = new Map<string, HTTPRequest>();

  /*
   * The below maps are used to reconcile Network.responseReceivedExtraInfo
   * events with their corresponding request. Each response and redirect
   * response gets an ExtraInfo event, and we don't know which will come first.
   * This means that we have to store a Response or an ExtraInfo for each
   * response, and emit the event when we get both of them. In addition, to
   * handle redirects, we have to make them Arrays to represent the chain of
   * events.
   */
  responseReceivedExtraInfo = new Map<
    string,
    Protocol.Network.ResponseReceivedExtraInfoEvent[]
  >();
  queuedRedirectInfoMap = new Map<string, RedirectInfoMap>();
  queuedEvents = new Map<string, QueuedEvents>();

  forget(requestId: string): void {
    this.requestWillBeSent.delete(requestId);
    this.requestPaused.delete(requestId);
    this.queuedEvents.delete(requestId);
    this.queuedRedirectInfoMap.delete(requestId);
    this.responseReceivedExtraInfo.delete(requestId);
  }
}
