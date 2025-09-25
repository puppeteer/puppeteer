/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Event} from 'webdriver-bidi-protocol';
import type {CommandMapping} from 'webdriver-bidi-protocol';

import type {EventEmitter} from '../../common/EventEmitter.js';

export type {CommandMapping};

/**
 * @internal
 */
export type BidiEvents = {
  [K in Event['method']]: Extract<Event, {method: K}>['params'];
};

/**
 * @internal
 */
export interface Connection<Events extends BidiEvents = BidiEvents>
  extends EventEmitter<Events> {
  send<T extends keyof CommandMapping>(
    method: T,
    params: CommandMapping[T]['params'],
  ): Promise<{result: CommandMapping[T]['returnType']}>;
}
