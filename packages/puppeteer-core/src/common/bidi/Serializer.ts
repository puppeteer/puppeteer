import {Bidi} from '../../../third_party/chromium-bidi/index.js';
import {debugError, isPlainObject} from '../util.js';

class UnserializableError extends Error {}

/**
 * @internal
 */
export class BidiSerializer {
  static serializePrimitive(
    arg: unknown
  ): Bidi.CommonDataTypes.PrimitiveProtocolValue {
    const type = typeof arg as Exclude<
      Bidi.CommonDataTypes.PrimitiveProtocolValue['type'],
      'null'
    >;

    switch (type) {
      case 'undefined':
        return {
          type: 'undefined',
        };
      case 'number': {
        let value!: Bidi.CommonDataTypes.SpecialNumber | number;
        if (Object.is(arg, -0)) {
          value = '-0';
        } else if (Object.is(arg, Infinity)) {
          value = 'Infinity';
        } else if (Object.is(arg, -Infinity)) {
          value = '-Infinity';
        } else if (Object.is(arg, NaN)) {
          value = 'NaN';
        } else {
          value = arg as number;
        }
        return {
          type,
          value,
        };
      }
      case 'bigint':
        return {
          type,
          value: (arg as bigint).toString(),
        };
      case 'string': {
        return {
          type,
          value: arg as string,
        };
      }
      case 'boolean':
        return {
          type,
          value: arg as boolean,
        };

      default:
        throw new Error(
          `Primitive data of type ${typeof arg} and value ${arg} not supported for BiDi serialization`
        );
    }
  }

  static serializeRemoveValue(
    arg: unknown
  ): Bidi.CommonDataTypes.LocalOrRemoteValue {
    switch (typeof arg) {
      case 'symbol':
      case 'function':
        throw new UnserializableError('Unable to serializable input.');
      case 'object':
        if (arg === null) {
          return {
            type: 'null',
          };
        } else if (Array.isArray(arg)) {
          const parsedArray = arg.map(subArg => {
            return BidiSerializer.serializePrimitive(subArg);
          });

          return {
            type: 'array',
            value: parsedArray,
          };
        } else if (isPlainObject(arg)) {
          const parsedObject: Bidi.CommonDataTypes.MappingLocalValue = [];
          for (const key in arg) {
            parsedObject.push([
              BidiSerializer.serializePrimitive(key),
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

      case 'undefined':
      case 'number':
      case 'bigint':
      case 'string':
      case 'boolean':
        return BidiSerializer.serializePrimitive(arg);
    }
  }

  static serialize(arg: unknown): Bidi.CommonDataTypes.LocalOrRemoteValue {
    // TODO: See use case of LazyArgs
    return BidiSerializer.serializeRemoveValue(arg);
  }

  static deserializePrimitives(
    result: Bidi.CommonDataTypes.PrimitiveProtocolValue
  ): number | bigint | boolean | string | undefined | null {
    switch (result.type) {
      case 'undefined':
        return undefined;
      case 'null':
        return null;
      case 'number': {
        switch (result.value) {
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
            return result.value;
        }
      }
      case 'bigint':
        return BigInt(result.value);
      case 'boolean':
        return Boolean(result.value);
      case 'string':
        return result.value;
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
        return result.value?.reduce((acc: Set<unknown>, value: unknown) => {
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

      // Used for better TypeScript support
      case 'undefined':
      case 'null':
      case 'number':
      case 'bigint':
      case 'boolean':
      case 'string':
        return BidiSerializer.deserializePrimitives(result);
    }

    throw new Error(`Deserialization of type ${result.type} not supported.`);
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
