import {Bidi} from '../../../third_party/chromium-bidi/index.js';
import {debugError, isPlainObject} from '../util.js';

class UnserializableError extends Error {}

/**
 * @internal
 */
export class BidiSerializer {
  static serializeNumber(arg: number): Bidi.CommonDataTypes.LocalOrRemoteValue {
    let value: Bidi.CommonDataTypes.SpecialNumber | number;
    if (Object.is(arg, -0)) {
      value = '-0';
    } else if (Object.is(arg, Infinity)) {
      value = 'Infinity';
    } else if (Object.is(arg, -Infinity)) {
      value = '-Infinity';
    } else if (Object.is(arg, NaN)) {
      value = 'NaN';
    } else {
      value = arg;
    }
    return {
      type: 'number',
      value,
    };
  }

  static serializeObject(
    arg: object | null
  ): Bidi.CommonDataTypes.LocalOrRemoteValue {
    if (arg === null) {
      return {
        type: 'null',
      };
    } else if (Array.isArray(arg)) {
      const parsedArray = arg.map(subArg => {
        return BidiSerializer.serializeRemoveValue(subArg);
      });

      return {
        type: 'array',
        value: parsedArray,
      };
    } else if (isPlainObject(arg)) {
      const parsedObject: Bidi.CommonDataTypes.MappingLocalValue = [];
      for (const key in arg) {
        parsedObject.push([
          BidiSerializer.serializeRemoveValue(key),
          BidiSerializer.serializeRemoveValue(arg[key]),
        ]);
      }

      return {
        type: 'object',
        value: parsedObject,
      };
    }

    throw new UnserializableError(
      'Custom object sterilization not possible. Use plain objects instead.'
    );
  }

  static serializeRemoveValue(
    arg: unknown
  ): Bidi.CommonDataTypes.LocalOrRemoteValue {
    switch (typeof arg) {
      case 'symbol':
      case 'function':
        throw new UnserializableError(`Unable to serializable ${typeof arg}`);
      case 'object':
        return BidiSerializer.serializeObject(arg);

      case 'undefined':
        return {
          type: 'undefined',
        };
      case 'number':
        return BidiSerializer.serializeNumber(arg);
      case 'bigint':
        return {
          type: 'bigint',
          value: arg.toString(),
        };
      case 'string':
        return {
          type: 'string',
          value: arg,
        };
      case 'boolean':
        return {
          type: 'boolean',
          value: arg,
        };
    }
  }

  static serialize(arg: unknown): Bidi.CommonDataTypes.LocalOrRemoteValue {
    // TODO: See use case of LazyArgs
    return BidiSerializer.serializeRemoveValue(arg);
  }

  static deserializeNumber(
    value: Bidi.CommonDataTypes.SpecialNumber | number
  ): number {
    switch (value) {
      case '-0':
        return -0;
      case 'NaN':
        return NaN;
      case 'Infinity':
      case '+Infinity':
        return Infinity;
      case '-Infinity':
        return -Infinity;
      default:
        return value;
    }
  }

  static deserializeLocalValue(
    result: Bidi.CommonDataTypes.RemoteValue
  ): unknown {
    switch (result.type) {
      case 'array':
        // TODO: Check expected output when value is undefined
        return result.value?.map(value => {
          return BidiSerializer.deserializeLocalValue(value);
        });
      case 'set':
        // TODO: Check expected output when value is undefined
        return result.value.reduce((acc: Set<unknown>, value: unknown) => {
          return acc.add(value);
        }, new Set());
      case 'object':
        if (result.value) {
          return result.value.reduce((acc: Record<any, unknown>, tuple) => {
            const {key, value} = BidiSerializer.deserializeTuple(tuple);
            acc[key as any] = value;
            return acc;
          }, {});
        }
        break;
      case 'map':
        return result.value.reduce((acc: Map<unknown, unknown>, tuple) => {
          const {key, value} = BidiSerializer.deserializeTuple(tuple);
          return acc.set(key, value);
        }, new Map());
      case 'promise':
        return {};
      case 'undefined':
        return undefined;
      case 'null':
        return null;
      case 'number':
        return BidiSerializer.deserializeNumber(result.value);
      case 'bigint':
        return BigInt(result.value);
      case 'boolean':
        return Boolean(result.value);
      case 'string':
        return result.value;
    }

    throw new UnserializableError(
      `Deserialization of type ${result.type} not supported.`
    );
  }

  static deserializeTuple([serializedKey, serializedValue]: [
    Bidi.CommonDataTypes.RemoteValue | string,
    Bidi.CommonDataTypes.RemoteValue
  ]): {key: unknown; value: unknown} {
    const key =
      typeof serializedKey === 'string'
        ? serializedKey
        : BidiSerializer.deserializeLocalValue(serializedKey);
    const value = BidiSerializer.deserializeLocalValue(serializedValue);

    return {key, value};
  }

  static deserialize(result: Bidi.CommonDataTypes.RemoteValue): unknown {
    if (!result) {
      debugError('Service did not produce a result.');
      return undefined;
    }

    try {
      return BidiSerializer.deserializeLocalValue(result);
    } catch (error) {
      if (error instanceof UnserializableError) {
        debugError(error.message);
        return undefined;
      }
      throw error;
    }
  }
}
