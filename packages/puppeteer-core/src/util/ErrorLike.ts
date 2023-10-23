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

import type {ProtocolError} from '../common/Errors.js';

/**
 * @internal
 */
export interface ErrorLike extends Error {
  name: string;
  message: string;
}

/**
 * @internal
 */
export function isErrorLike(obj: unknown): obj is ErrorLike {
  return (
    typeof obj === 'object' && obj !== null && 'name' in obj && 'message' in obj
  );
}

/**
 * @internal
 */
export function isErrnoException(obj: unknown): obj is NodeJS.ErrnoException {
  return (
    isErrorLike(obj) &&
    ('errno' in obj || 'code' in obj || 'path' in obj || 'syscall' in obj)
  );
}

/**
 * @internal
 */
export function rewriteError(
  error: ProtocolError,
  message: string,
  originalMessage?: string
): Error {
  error.message = message;
  error.originalMessage = originalMessage ?? error.originalMessage;
  return error;
}

/**
 * @internal
 */
export function createProtocolErrorMessage(object: {
  error: {message: string; data: any; code: number};
}): string {
  let message = `${object.error.message}`;
  // TODO: remove the type checks when we stop connecting to BiDi with a CDP
  // client.
  if (
    object.error &&
    typeof object.error === 'object' &&
    'data' in object.error
  ) {
    message += ` ${object.error.data}`;
  }
  return message;
}
