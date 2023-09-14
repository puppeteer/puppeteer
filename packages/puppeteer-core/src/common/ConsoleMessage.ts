/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import {type JSHandle} from '../api/JSHandle.js';

/**
 * @public
 */
export interface ConsoleMessageLocation {
  /**
   * URL of the resource if known or `undefined` otherwise.
   */
  url?: string;

  /**
   * 0-based line number in the resource if known or `undefined` otherwise.
   */
  lineNumber?: number;

  /**
   * 0-based column number in the resource if known or `undefined` otherwise.
   */
  columnNumber?: number;
}

/**
 * The supported types for console messages.
 * @public
 */
export type ConsoleMessageType =
  | 'log'
  | 'debug'
  | 'info'
  | 'error'
  | 'warning'
  | 'dir'
  | 'dirxml'
  | 'table'
  | 'trace'
  | 'clear'
  | 'startGroup'
  | 'startGroupCollapsed'
  | 'endGroup'
  | 'assert'
  | 'profile'
  | 'profileEnd'
  | 'count'
  | 'timeEnd'
  | 'verbose';

/**
 * ConsoleMessage objects are dispatched by page via the 'console' event.
 * @public
 */
export class ConsoleMessage {
  #type: ConsoleMessageType;
  #text: string;
  #args: JSHandle[];
  #stackTraceLocations: ConsoleMessageLocation[];

  /**
   * @public
   */
  constructor(
    type: ConsoleMessageType,
    text: string,
    args: JSHandle[],
    stackTraceLocations: ConsoleMessageLocation[]
  ) {
    this.#type = type;
    this.#text = text;
    this.#args = args;
    this.#stackTraceLocations = stackTraceLocations;
  }

  /**
   * The type of the console message.
   */
  type(): ConsoleMessageType {
    return this.#type;
  }

  /**
   * The text of the console message.
   */
  text(): string {
    return this.#text;
  }

  /**
   * An array of arguments passed to the console.
   */
  args(): JSHandle[] {
    return this.#args;
  }

  /**
   * The location of the console message.
   */
  location(): ConsoleMessageLocation {
    return this.#stackTraceLocations[0] ?? {};
  }

  /**
   * The array of locations on the stack of the console message.
   */
  stackTrace(): ConsoleMessageLocation[] {
    return this.#stackTraceLocations;
  }
}
