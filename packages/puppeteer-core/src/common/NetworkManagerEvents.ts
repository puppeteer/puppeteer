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

import type {HTTPRequest} from '../api/HTTPRequest.js';
import type {HTTPResponse} from '../api/HTTPResponse.js';

import type {EventType} from './EventEmitter.js';

/**
 * We use symbols to prevent any external parties listening to these events.
 * They are internal to Puppeteer.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace NetworkManagerEvent {
  export const Request = Symbol('NetworkManager.Request');
  export const RequestServedFromCache = Symbol(
    'NetworkManager.RequestServedFromCache'
  );
  export const Response = Symbol('NetworkManager.Response');
  export const RequestFailed = Symbol('NetworkManager.RequestFailed');
  export const RequestFinished = Symbol('NetworkManager.RequestFinished');
}

/**
 * @internal
 */
export interface NetworkManagerEvents extends Record<EventType, unknown> {
  [NetworkManagerEvent.Request]: HTTPRequest;
  [NetworkManagerEvent.RequestServedFromCache]: HTTPRequest | undefined;
  [NetworkManagerEvent.Response]: HTTPResponse;
  [NetworkManagerEvent.RequestFailed]: HTTPRequest;
  [NetworkManagerEvent.RequestFinished]: HTTPRequest;
}
