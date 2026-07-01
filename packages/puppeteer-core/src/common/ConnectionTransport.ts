/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Details provided by the underlying transport when it closes.
 *
 * @public
 */
export interface ConnectionCloseDetails {
  closeCode?: number;
  closeMessage?: string;
}

/**
 * @public
 */
export interface ConnectionTransport {
  send(message: string): void;
  close(): void;
  onmessage?: (message: string) => void;
  onclose?: (details?: ConnectionCloseDetails) => void;
}
