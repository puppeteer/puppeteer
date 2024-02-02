/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
// eslint-disable-next-line no-restricted-imports
import {EventEmitter as NodeEventEmitter} from 'node:events';

import {expectAssignable} from 'tsd';

import type {CommonEventEmitter, EventEmitter, EventType} from 'puppeteer';

declare const emitter: EventEmitter<Record<EventType, any>>;

{
  {
    expectAssignable<CommonEventEmitter<Record<EventType, any>>>(
      new NodeEventEmitter()
    );
  }
  {
    expectAssignable<CommonEventEmitter<Record<EventType, any>>>(emitter);
  }
}
