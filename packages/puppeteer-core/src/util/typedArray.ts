/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export function stringToTypedArray(
  string: string,
  base64Encoded = false
): Uint8Array {
  const parsedString = base64Encoded ? atob(string) : string;
  return new TextEncoder().encode(parsedString);
}

export function mergeUint8Arrays(items: Uint8Array[]): Uint8Array {
  let length = 0;
  for (const item of items) {
    length += item.length;
  }

  // Create a new array with total length and merge all source arrays.
  const result = new Uint8Array(length);
  let offset = 0;
  for (const item of items) {
    result.set(item, offset);
    offset += item.length;
  }

  return result;
}
