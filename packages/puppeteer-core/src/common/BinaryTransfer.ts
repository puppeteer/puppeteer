/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {stringToTypedArray} from '../util/encoding.js';
import {stringifyFunction} from '../util/Function.js';

/**
 * Marks an object produced by {@link encodeBinaryResult} in the page.
 */
const BINARY_RESULT_KEY = '__puppeteer_binary__';

interface EncodedBinaryResult {
  [BINARY_RESULT_KEY]: string;
  base64: string;
}

interface TypedArrayConstructor {
  new (
    buffer: ArrayBuffer,
    byteOffset?: number,
    length?: number,
  ): ArrayBufferView;
  readonly BYTES_PER_ELEMENT: number;
  readonly name: string;
}

const TYPED_ARRAYS = new Map<string, TypedArrayConstructor>();
for (const constructor of [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array,
  BigUint64Array,
  // Not available in every supported Node.js version.
  (globalThis as {Float16Array?: TypedArrayConstructor}).Float16Array,
] as Array<TypedArrayConstructor | undefined>) {
  if (constructor) {
    TYPED_ARRAYS.set(constructor.name, constructor);
  }
}

/**
 * Runs in the page. Turns a typed array, `DataView` or `ArrayBuffer` into an
 * object that survives the protocol's by-value (JSON) serialization. A promise
 * is awaited first. Anything else is returned as is.
 *
 * This function is stringified and sent to the page with every call, so it
 * must not reference anything outside of itself, and its comments live here
 * to keep the payload small. The type is taken from the `toString` tag, which
 * is the built-in type even for subclasses. Browsers without
 * `Uint8Array.prototype.toBase64` (Chrome and Firefox before 133) fall back to
 * `btoa` over chunks that stay below V8's limit on the number of arguments.
 */
function encodeBinaryResult(value: unknown): unknown {
  if (value instanceof Promise) {
    return value.then(encodeBinaryResult);
  }
  try {
    let type: string;
    let bytes: Uint8Array;
    if (ArrayBuffer.isView(value)) {
      type = Object.prototype.toString.call(value).slice(8, -1);
      bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    } else if (value instanceof ArrayBuffer) {
      type = 'ArrayBuffer';
      bytes = new Uint8Array(value);
    } else {
      return value;
    }
    let base64: string;
    if ('toBase64' in bytes) {
      base64 = (bytes as unknown as {toBase64(): string}).toBase64();
    } else {
      const chunks: string[] = [];
      for (let i = 0; i < bytes.length; i += 65534) {
        chunks.push(
          String.fromCharCode.apply(
            null,
            bytes.subarray(i, i + 65534) as unknown as number[],
          ),
        );
      }
      base64 = btoa(chunks.join(''));
    }
    return {__puppeteer_binary__: type, base64};
  } catch {
    return value;
  }
}

const ENCODE_BINARY_RESULT = stringifyFunction(encodeBinaryResult);

/**
 * Wraps a stringified page function so that a typed array, `DataView` or
 * `ArrayBuffer` it returns is encoded with {@link encodeBinaryResult} before
 * the protocol serializes the result by value.
 *
 * The page function is called in argument position, never from a variable
 * initializer: SpiderMonkey names an anonymous function inside an initializer
 * after the variable (`result<`), which would change the stack traces of
 * evaluation errors. The newline before the closing parenthesis keeps a
 * trailing `//# sourceURL` comment in the declaration from swallowing it.
 *
 * @internal
 */
export function withBinaryResultEncoding(functionDeclaration: string): string {
  return `function (...args) {
  return (${ENCODE_BINARY_RESULT})((${functionDeclaration}
  ).apply(this, args));
}`;
}

/**
 * Restores a value that {@link encodeBinaryResult} produced in the page once
 * the protocol has deserialized it. Anything else is returned as is.
 *
 * @internal
 */
export function decodeBinaryResult(value: unknown): unknown {
  if (!isEncodedBinaryResult(value)) {
    return value;
  }
  const bytes = stringToTypedArray(value.base64, true);
  // `Buffer.from` may return a view into a shared pool. Copy such a view into
  // a buffer that starts at offset 0 so that every element size is aligned.
  const buffer =
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? bytes.buffer
      : bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        );
  const type = value[BINARY_RESULT_KEY];
  if (type === 'ArrayBuffer') {
    return buffer;
  }
  if (type === 'DataView') {
    return new DataView(buffer);
  }
  const constructor = TYPED_ARRAYS.get(type);
  if (!constructor) {
    // The page returned a typed array this Node.js version does not have.
    return new Uint8Array(buffer);
  }
  return new constructor(
    buffer,
    0,
    buffer.byteLength / constructor.BYTES_PER_ELEMENT,
  );
}

function isEncodedBinaryResult(value: unknown): value is EncodedBinaryResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record[BINARY_RESULT_KEY] === 'string' &&
    typeof record['base64'] === 'string'
  );
}
