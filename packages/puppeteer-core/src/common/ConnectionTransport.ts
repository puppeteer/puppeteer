/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @public
 */
export interface ConnectionTransport {
  send(message: string|object): void;
  close(): void;
  onmessage?: (message: string|object) => void;
  onclose?: () => void;
}
