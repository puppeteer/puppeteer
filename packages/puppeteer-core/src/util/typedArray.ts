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
  return Uint8Array.from(
    [...parsedString].map(char => {
      return char.charCodeAt(0);
    })
  );
}

export function mergeUint8Arrays(mergables: Uint8Array[]): Uint8Array {
  let length = 0;
  mergables.forEach(item => {
    length += item.length;
  });

  // Create a new array with total length and merge all source arrays.
  const mergedArray = new Uint8Array(length);
  let offset = 0;
  mergables.forEach(item => {
    mergedArray.set(item, offset);
    offset += item.length;
  });

  return mergedArray;
}
