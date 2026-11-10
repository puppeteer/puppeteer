/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {BrowserEvent} from '../api/Browser.js';
import {BrowserContextEvent} from '../api/BrowserContext.js';
import {PageEvent} from '../api/Page.js';

import type {BidiHTTPRequest} from './HTTPRequest.js';
import type {BidiHTTPResponse} from './HTTPResponse.js';
import type {BidiPage} from './Page.js';

// Network events are emitted on the page first, then on its browser context
// and finally on the browser.

/**
 * @internal
 */
export function emitRequest(page: BidiPage, request: BidiHTTPRequest): void {
  page.trustedEmitter.emit(PageEvent.Request, request);
  page
    .browserContext()
    .trustedEmitter.emit(BrowserContextEvent.Request, request);
  page.browser().trustedEmitter.emit(BrowserEvent.Request, request);
}

/**
 * @internal
 */
export function emitRequestServedFromCache(
  page: BidiPage,
  request: BidiHTTPRequest,
): void {
  page.trustedEmitter.emit(PageEvent.RequestServedFromCache, request);
  page
    .browserContext()
    .trustedEmitter.emit(BrowserContextEvent.RequestServedFromCache, request);
  page
    .browser()
    .trustedEmitter.emit(BrowserEvent.RequestServedFromCache, request);
}

/**
 * @internal
 */
export function emitResponse(page: BidiPage, response: BidiHTTPResponse): void {
  page.trustedEmitter.emit(PageEvent.Response, response);
  page
    .browserContext()
    .trustedEmitter.emit(BrowserContextEvent.Response, response);
  page.browser().trustedEmitter.emit(BrowserEvent.Response, response);
}

/**
 * @internal
 */
export function emitRequestFinished(
  page: BidiPage,
  request: BidiHTTPRequest,
): void {
  page.trustedEmitter.emit(PageEvent.RequestFinished, request);
  page
    .browserContext()
    .trustedEmitter.emit(BrowserContextEvent.RequestFinished, request);
  page.browser().trustedEmitter.emit(BrowserEvent.RequestFinished, request);
}

/**
 * @internal
 */
export function emitRequestFailed(
  page: BidiPage,
  request: BidiHTTPRequest,
): void {
  page.trustedEmitter.emit(PageEvent.RequestFailed, request);
  page
    .browserContext()
    .trustedEmitter.emit(BrowserContextEvent.RequestFailed, request);
  page.browser().trustedEmitter.emit(BrowserEvent.RequestFailed, request);
}
