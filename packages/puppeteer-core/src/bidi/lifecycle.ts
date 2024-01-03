/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {
  ObservableInput,
  ObservedValueOf,
  OperatorFunction,
} from '../../third_party/rxjs/rxjs.js';
import {catchError} from '../../third_party/rxjs/rxjs.js';
import type {PuppeteerLifeCycleEvent} from '../cdp/LifecycleWatcher.js';
import {ProtocolError, TimeoutError} from '../common/Errors.js';

/**
 * @internal
 */
export type BiDiNetworkIdle = Extract<
  PuppeteerLifeCycleEvent,
  'networkidle0' | 'networkidle2'
> | null;

/**
 * @internal
 */
export function getBiDiLifeCycles(
  event: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[]
): [
  Extract<PuppeteerLifeCycleEvent, 'load' | 'domcontentloaded'>,
  BiDiNetworkIdle,
] {
  if (Array.isArray(event)) {
    const pageLifeCycle = event.some(lifeCycle => {
      return lifeCycle !== 'domcontentloaded';
    })
      ? 'load'
      : 'domcontentloaded';

    const networkLifeCycle = event.reduce((acc, lifeCycle) => {
      if (lifeCycle === 'networkidle0') {
        return lifeCycle;
      } else if (acc !== 'networkidle0' && lifeCycle === 'networkidle2') {
        return lifeCycle;
      }
      return acc;
    }, null as BiDiNetworkIdle);

    return [pageLifeCycle, networkLifeCycle];
  }

  if (event === 'networkidle0' || event === 'networkidle2') {
    return ['load', event];
  }

  return [event, null];
}

/**
 * @internal
 */
export const lifeCycleToReadinessState = new Map<
  PuppeteerLifeCycleEvent,
  Bidi.BrowsingContext.ReadinessState
>([
  ['load', Bidi.BrowsingContext.ReadinessState.Complete],
  ['domcontentloaded', Bidi.BrowsingContext.ReadinessState.Interactive],
]);

export function getBiDiReadinessState(
  event: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[]
): [Bidi.BrowsingContext.ReadinessState, BiDiNetworkIdle] {
  const lifeCycles = getBiDiLifeCycles(event);
  const readiness = lifeCycleToReadinessState.get(lifeCycles[0])!;
  return [readiness, lifeCycles[1]];
}

/**
 * @internal
 */
export const lifeCycleToSubscribedEvent = new Map<
  PuppeteerLifeCycleEvent,
  'browsingContext.load' | 'browsingContext.domContentLoaded'
>([
  ['load', 'browsingContext.load'],
  ['domcontentloaded', 'browsingContext.domContentLoaded'],
]);

/**
 * @internal
 */
export function getBiDiLifecycleEvent(
  event: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[]
): [
  'browsingContext.load' | 'browsingContext.domContentLoaded',
  BiDiNetworkIdle,
] {
  const lifeCycles = getBiDiLifeCycles(event);
  const bidiEvent = lifeCycleToSubscribedEvent.get(lifeCycles[0])!;
  return [bidiEvent, lifeCycles[1]];
}

/**
 * @internal
 */
export function rewriteNavigationError<T, R extends ObservableInput<T>>(
  message: string,
  ms: number
): OperatorFunction<T, T | ObservedValueOf<R>> {
  return catchError<T, R>(error => {
    if (error instanceof ProtocolError) {
      error.message += ` at ${message}`;
    } else if (error instanceof TimeoutError) {
      error.message = `Navigation timeout of ${ms} ms exceeded`;
    }
    throw error;
  });
}
