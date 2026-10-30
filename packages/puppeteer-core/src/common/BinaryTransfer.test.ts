/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {createFunction, stringifyFunction} from '../util/Function.js';

import {
  decodeBinaryResult,
  withBinaryResultEncoding,
} from './BinaryTransfer.js';

/**
 * Runs `pageFunction` the way a browser would run the wrapped declaration and
 * passes the result through a JSON round trip, which is what the protocol
 * does when a value is returned by value.
 */
async function evaluate<T>(
  pageFunction: (...args: never[]) => unknown,
  ...args: unknown[]
): Promise<T> {
  const wrapped = createFunction(
    withBinaryResultEncoding(stringifyFunction(pageFunction)),
  ) as (...args: unknown[]) => unknown;
  const result = await wrapped(...args);
  // JSON.stringify(undefined) is undefined rather than a string.
  const serialized = JSON.stringify(result);
  return decodeBinaryResult(
    serialized === undefined ? undefined : JSON.parse(serialized),
  ) as T;
}

describe('BinaryTransfer', () => {
  it('should round-trip a Uint8Array', async () => {
    const result = await evaluate<Uint8Array>(() => {
      return new Uint8Array([1, 2, 3]);
    });
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([1, 2, 3]);
  });

  it('should keep the type of a typed array', async () => {
    const float32 = await evaluate<Float32Array>(() => {
      return new Float32Array([1.5, -2.25]);
    });
    expect(float32).toBeInstanceOf(Float32Array);
    expect(Array.from(float32)).toEqual([1.5, -2.25]);

    const float64 = await evaluate<Float64Array>(() => {
      return new Float64Array([Math.PI, -0.1]);
    });
    expect(float64).toBeInstanceOf(Float64Array);
    expect(Array.from(float64)).toEqual([Math.PI, -0.1]);

    const int16 = await evaluate<Int16Array>(() => {
      return new Int16Array([-1, 32767]);
    });
    expect(int16).toBeInstanceOf(Int16Array);
    expect(Array.from(int16)).toEqual([-1, 32767]);

    const bigint64 = await evaluate<BigInt64Array>(() => {
      return new BigInt64Array([BigInt(-1), BigInt('4611686018427387904')]);
    });
    expect(bigint64).toBeInstanceOf(BigInt64Array);
    expect(Array.from(bigint64)).toEqual([
      BigInt(-1),
      BigInt('4611686018427387904'),
    ]);
  });

  it('should keep the viewed range of a typed array', async () => {
    const result = await evaluate<Uint8Array>(() => {
      const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
      return new Uint8Array(bytes.buffer, 2, 4);
    });
    expect(Array.from(result)).toEqual([2, 3, 4, 5]);
  });

  it('should round-trip an ArrayBuffer', async () => {
    const result = await evaluate<ArrayBuffer>(() => {
      return new Uint8Array([7, 8, 9]).buffer;
    });
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(new Uint8Array(result))).toEqual([7, 8, 9]);
  });

  it('should round-trip a DataView', async () => {
    const result = await evaluate<DataView>(() => {
      return new DataView(new Uint8Array([1, 2, 3]).buffer, 1);
    });
    expect(result).toBeInstanceOf(DataView);
    expect(result.byteLength).toBe(2);
    expect(result.getUint8(0)).toBe(2);
  });

  it('should await a promise before encoding', async () => {
    const result = await evaluate<Uint8Array>(async () => {
      await new Promise(resolve => {
        return setTimeout(resolve, 1);
      });
      return new Uint8Array([4, 5]);
    });
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([4, 5]);
  });

  it('should pass arguments through and leave other values alone', async () => {
    expect(
      await evaluate(
        (a: number, b: number) => {
          return a + b;
        },
        2,
        3,
      ),
    ).toBe(5);
    expect(
      await evaluate(() => {
        return {a: 1, b: [1, 2], c: 'x'};
      }),
    ).toEqual({a: 1, b: [1, 2], c: 'x'});
    expect(
      await evaluate(() => {
        return undefined;
      }),
    ).toBe(undefined);
    expect(
      await evaluate(() => {
        return Promise.resolve(42);
      }),
    ).toBe(42);
  });

  it('should encode without Uint8Array.prototype.toBase64', async () => {
    const prototype = Uint8Array.prototype as {toBase64?: unknown};
    const toBase64 = prototype.toBase64;
    delete prototype.toBase64;
    try {
      const bytes = new Uint8Array(70_000);
      bytes[0] = 1;
      bytes[69_999] = 2;
      const result = await evaluate<Uint8Array>(bytes => {
        return bytes;
      }, bytes);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(70_000);
      expect(result[0]).toBe(1);
      expect(result[69_999]).toBe(2);
    } finally {
      if (toBase64) {
        prototype.toBase64 = toBase64;
      }
    }
  });

  it('should only decode encoded binary results', () => {
    for (const value of [
      null,
      undefined,
      'text',
      7,
      {a: 1},
      {__puppeteer_binary__: 'Uint8Array'},
      {__puppeteer_binary__: 1, base64: 'AA=='},
    ]) {
      expect(decodeBinaryResult(value)).toBe(value);
    }
  });

  it('should fall back to bytes for an unknown typed array type', () => {
    const result = decodeBinaryResult({
      __puppeteer_binary__: 'NotATypedArray',
      base64: 'AQID',
    }) as Uint8Array;
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([1, 2, 3]);
  });
});
