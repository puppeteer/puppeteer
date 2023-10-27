/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {debugError} from '../common/util.js';

/**
 * @internal
 */
export class BidiDeserializer {
  static deserializeNumber(value: Bidi.Script.SpecialNumber | number): number {
    switch (value) {
      case '-0':
        return -0;
      case 'NaN':
        return NaN;
      case 'Infinity':
        return Infinity;
      case '-Infinity':
        return -Infinity;
      default:
        return value;
    }
  }

  static deserializeLocalValue(result: Bidi.Script.RemoteValue): unknown {
    switch (result.type) {
      case 'array':
        return result.value?.map(value => {
          return BidiDeserializer.deserializeLocalValue(value);
        });
      case 'set':
        return result.value?.reduce((acc: Set<unknown>, value) => {
          return acc.add(BidiDeserializer.deserializeLocalValue(value));
        }, new Set());
      case 'object':
        return result.value?.reduce((acc: Record<any, unknown>, tuple) => {
          const {key, value} = BidiDeserializer.deserializeTuple(tuple);
          acc[key as any] = value;
          return acc;
        }, {});
      case 'map':
        return result.value?.reduce((acc: Map<unknown, unknown>, tuple) => {
          const {key, value} = BidiDeserializer.deserializeTuple(tuple);
          return acc.set(key, value);
        }, new Map());
      case 'promise':
        return {};
      case 'regexp':
        return new RegExp(result.value.pattern, result.value.flags);
      case 'date':
        return new Date(result.value);
      case 'undefined':
        return undefined;
      case 'null':
        return null;
      case 'number':
        return BidiDeserializer.deserializeNumber(result.value);
      case 'bigint':
        return BigInt(result.value);
      case 'boolean':
        return Boolean(result.value);
      case 'string':
        return result.value;
    }

    debugError(`Deserialization of type ${result.type} not supported.`);
    return undefined;
  }

  static deserializeTuple([serializedKey, serializedValue]: [
    Bidi.Script.RemoteValue | string,
    Bidi.Script.RemoteValue,
  ]): {key: unknown; value: unknown} {
    const key =
      typeof serializedKey === 'string'
        ? serializedKey
        : BidiDeserializer.deserializeLocalValue(serializedKey);
    const value = BidiDeserializer.deserializeLocalValue(serializedValue);

    return {key, value};
  }

  static deserialize(result: Bidi.Script.RemoteValue): any {
    if (!result) {
      debugError('Service did not produce a result.');
      return undefined;
    }

    return BidiDeserializer.deserializeLocalValue(result);
  }
}
