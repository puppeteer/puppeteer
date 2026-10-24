/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {EventEmitter as NodeEventEmitter} from 'node:events';

import type {CommonEventEmitter, EventEmitter, EventType} from 'puppeteer';
import {expectAssignable, expectType} from 'tsd';

declare const emitter: EventEmitter<Record<EventType, any>>;
declare const typedEmitter: EventEmitter<{foo: number; bar: string}>;

{
  {
    expectAssignable<CommonEventEmitter<Record<EventType, any>>>(
      new NodeEventEmitter(),
    );
  }
  {
    expectAssignable<CommonEventEmitter<Record<EventType, any>>>(emitter);
  }
  {
    typedEmitter.on('*', (type, event) => {
      expectType<'foo' | 'bar'>(type);
      expectType<number | string>(event);
    });
  }
}
