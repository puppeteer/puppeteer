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

import { JSHandle } from './JSHandle.js';

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
  private _type: ConsoleMessageType;
  private _text: string;
  private _args: JSHandle[];
  private _stackTraceLocations: ConsoleMessageLocation[];

  /**
   * @public
   */
  constructor(
    type: ConsoleMessageType,
    text: string,
    args: JSHandle[],
    stackTraceLocations: ConsoleMessageLocation[]
  ) {
    this._type = type;
    this._text = text;
    this._args = args;
    this._stackTraceLocations = stackTraceLocations;
  }

  /**
   * @returns The type of the console message.
   */
  type(): ConsoleMessageType {
    return this._type;
  }

  /**
   * @returns The text of the console message.
   */
  text(): string {
    return this._text;
  }

  /**
   * @returns An array of arguments passed to the console.
   */
  args(): JSHandle[] {
    return this._args;
  }

  /**
   * @returns The location of the console message.
   */
  location(): ConsoleMessageLocation {
    return this._stackTraceLocations.length ? this._stackTraceLocations[0] : {};
  }

  /**
   * @returns The array of locations on the stack of the console message.
   */
  stackTrace(): ConsoleMessageLocation[] {
    return this._stackTraceLocations;
  }
}
