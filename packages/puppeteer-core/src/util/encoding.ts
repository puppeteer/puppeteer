/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @internal
 */
export function stringToTypedArray(
  string: string,
  base64Encoded = false,
): Uint8Array {
  if (base64Encoded) {
    const binaryString = atob(string);
    // @ts-expect-error There are non-proper overloads
    return Uint8Array.from(binaryString, m => {
      return m.codePointAt(0);
    });
  }
  return new TextEncoder().encode(string);
}

/**
 * @internal
 */
export function stringToBase64(str: string): string {
  return typedArrayToBase64(new TextEncoder().encode(str));
}

/**
 * @internal
 */
export function typedArrayToBase64(typedArray: Uint8Array): string {
  // chunkSize should be less V8 limit on number of arguments!
  // https://github.com/v8/v8/blob/d3de848bea727518aee94dd2fd42ba0b62037a27/src/objects/code.h#L444
  const chunkSize = 65534;
  const chunks = [];

  for (let i = 0; i < typedArray.length; i += chunkSize) {
    const chunk = typedArray.subarray(i, i + chunkSize);
    chunks.push(String.fromCodePoint.apply(null, chunk as unknown as number[]));
  }

  const binaryString = chunks.join('');
  return btoa(binaryString);
}

/**
 * @internal
 */
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
