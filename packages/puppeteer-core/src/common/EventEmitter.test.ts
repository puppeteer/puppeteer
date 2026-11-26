/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, beforeEach} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

import {EventEmitter} from './EventEmitter.js';

describe('EventEmitter', () => {
  let emitter: EventEmitter<Record<string, unknown>>;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    const onTests = (methodName: 'on'): void => {
      it(`${methodName}: adds an event listener that is fired when the event is emitted`, () => {
        const listener = sinon.spy();
        emitter[methodName]('foo', listener);
        emitter.emit('foo', undefined);
        expect(listener.callCount).toEqual(1);
      });

      it(`${methodName} sends the event data to the handler`, () => {
        const listener = sinon.spy();
        const data = {};
        emitter[methodName]('foo', listener);
        emitter.emit('foo', data);
        expect(listener.callCount).toEqual(1);
        expect(listener.firstCall.args[0]).toBe(data);
      });

      it(`${methodName}: supports chaining`, () => {
        const listener = sinon.spy();
        const returnValue = emitter[methodName]('foo', listener);
        expect(returnValue).toBe(emitter);
      });

      it(`${methodName}: sends event type and data to wildcard handler`, () => {
        const listener = sinon.spy();
        const data = {bar: 1};
        emitter[methodName]('*', listener);
        emitter.emit('foo', data);
        expect(listener.callCount).toEqual(1);
        expect(listener.firstCall.args).toEqual(['foo', data]);
      });
    };
    onTests('on');
  });

  describe('off', () => {
    const offTests = (methodName: 'off'): void => {
      it(`${methodName}: removes the listener so it is no longer called`, () => {
        const listener = sinon.spy();
        emitter.on('foo', listener);
        emitter.emit('foo', undefined);
        expect(listener.callCount).toEqual(1);
        emitter.off('foo', listener);
        emitter.emit('foo', undefined);
        expect(listener.callCount).toEqual(1);
      });

      it(`${methodName}: supports chaining`, () => {
        const listener = sinon.spy();
        emitter.on('foo', listener);
        const returnValue = emitter.off('foo', listener);
        expect(returnValue).toBe(emitter);
      });

      it(`${methodName}: removes a listener added with once`, () => {
        const listener = sinon.spy();
        emitter.once('foo', listener);
        emitter.off('foo', listener);
        expect(emitter.listenerCount('foo')).toEqual(0);
        emitter.emit('foo', undefined);
        expect(listener.callCount).toEqual(0);
      });

      it(`${methodName}: removes only the last added registration of a listener`, () => {
        const listener = sinon.spy();
        emitter.on('foo', listener);
        emitter.once('foo', listener);
        emitter.off('foo', listener);
        emitter.emit('foo', undefined);
        emitter.emit('foo', undefined);
        expect(listener.callCount).toEqual(2);
      });
    };
    offTests('off');
  });

  describe('once', () => {
    it('only calls the listener once and then removes it', () => {
      const listener = sinon.spy();
      emitter.once('foo', listener);
      emitter.emit('foo', undefined);
      expect(listener.callCount).toEqual(1);
      emitter.emit('foo', undefined);
      expect(listener.callCount).toEqual(1);
    });

    it('supports chaining', () => {
      const listener = sinon.spy();
      const returnValue = emitter.once('foo', listener);
      expect(returnValue).toBe(emitter);
    });

    it('sends event type and data to wildcard handler once', () => {
      const listener = sinon.spy();
      const data = {bar: 1};
      emitter.once('*', listener);
      emitter.emit('foo', data);
      emitter.emit('foo', data);
      expect(listener.callCount).toEqual(1);
      expect(listener.firstCall.args).toEqual(['foo', data]);
    });

    it('does not throw if a subclass on() registers no handler', () => {
      class NoopEmitter extends EventEmitter<Record<string, unknown>> {
        override on(): this {
          return this;
        }
      }
      const emitter = new NoopEmitter();
      const listener = sinon.spy();
      expect(() => {
        emitter.once('foo', listener);
      }).not.toThrow();
      expect(emitter.listenerCount('foo')).toEqual(0);
    });

    it('maps the handler even if a subclass overrides listenerCount()', () => {
      class CountingEmitter extends EventEmitter<Record<string, unknown>> {
        override listenerCount(): number {
          return 42;
        }
      }
      const emitter = new CountingEmitter();
      const listener = sinon.spy();
      emitter.once('foo', listener);
      emitter.off('foo', listener);
      emitter.emit('foo', undefined);
      expect(listener.callCount).toEqual(0);
    });

    it('does not map a handler if a subclass on() registers more than one', () => {
      const extra = sinon.spy();
      class DoubleEmitter extends EventEmitter<Record<string, unknown>> {
        override on(
          ...args: Parameters<EventEmitter<Record<string, unknown>>['on']>
        ): this {
          super.on(...args);
          return super.on(args[0], extra);
        }
      }
      const emitter = new DoubleEmitter();
      const listener = sinon.spy();
      emitter.once('foo', listener);
      emitter.off('foo', listener);
      expect(emitter.listenerCount('foo')).toEqual(2);
      emitter.emit('foo', undefined);
      expect(extra.callCount).toEqual(1);
    });

    it('removes the listener before invoking it', () => {
      let countDuringCall = -1;
      emitter.once('foo', () => {
        countDuringCall = emitter.listenerCount('foo');
      });
      emitter.emit('foo', undefined);
      expect(countDuringCall).toEqual(0);
      expect(emitter.listenerCount('foo')).toEqual(0);
    });

    it('does not fire again on a re-entrant emit from inside the listener', () => {
      let calls = 0;
      emitter.once('foo', () => {
        calls++;
        if (calls < 3) {
          emitter.emit('foo', undefined);
        }
      });
      emitter.emit('foo', undefined);
      expect(calls).toEqual(1);
      expect(emitter.listenerCount('foo')).toEqual(0);
    });

    it('does not fire twice when an earlier listener re-entrantly emits the same event', () => {
      let calls = 0;
      let reentered = false;
      emitter.on('foo', () => {
        if (!reentered) {
          reentered = true;
          emitter.emit('foo', undefined);
        }
      });
      emitter.once('foo', () => {
        calls++;
      });
      emitter.emit('foo', undefined);
      expect(calls).toEqual(1);
    });

    it('removes the listener even if it throws', () => {
      let calls = 0;
      emitter.once('foo', () => {
        calls++;
        throw new Error('boom');
      });
      expect(() => {
        emitter.emit('foo', undefined);
      }).toThrow('boom');
      expect(emitter.listenerCount('foo')).toEqual(0);
      expect(() => {
        emitter.emit('foo', undefined);
      }).not.toThrow();
      expect(calls).toEqual(1);
    });

    it('forwards the return value of the listener to subclass wrappers', () => {
      const returnValues: unknown[] = [];
      class CapturingEmitter extends EventEmitter<Record<string, unknown>> {
        override on<Key extends keyof Record<string, unknown> | '*'>(
          type: Key,
          handler: (...args: any[]) => any,
        ): this {
          return super.on(type, ((...args: any[]) => {
            returnValues.push(handler(...args));
          }) as any);
        }
      }
      const capturing = new CapturingEmitter();
      const result = Promise.resolve('done');
      capturing.once('foo', (() => {
        return result;
      }) as () => void);
      capturing.emit('foo', undefined);
      expect(returnValues).toEqual([result]);
    });
  });

  describe('emit', () => {
    it('calls all the listeners for an event', () => {
      const listener1 = sinon.spy();
      const listener2 = sinon.spy();
      const listener3 = sinon.spy();
      emitter.on('foo', listener1).on('foo', listener2).on('bar', listener3);

      emitter.emit('foo', undefined);

      expect(listener1.callCount).toEqual(1);
      expect(listener2.callCount).toEqual(1);
      expect(listener3.callCount).toEqual(0);
    });

    it('passes data through to the listener', () => {
      const listener = sinon.spy();
      emitter.on('foo', listener);
      const data = {};

      emitter.emit('foo', data);
      expect(listener.callCount).toEqual(1);
      expect(listener.firstCall.args[0]).toBe(data);
    });

    it('returns true if the event has listeners', () => {
      const listener = sinon.spy();
      emitter.on('foo', listener);
      expect(emitter.emit('foo', undefined)).toBe(true);
    });

    it('returns true when the only listener was added with once', () => {
      const listener = sinon.spy();
      emitter.once('foo', listener);
      expect(emitter.emit('foo', undefined)).toBe(true);
      expect(emitter.emit('foo', undefined)).toBe(false);
    });

    it('returns true when a listener removes itself during emit', () => {
      const listener = () => {
        emitter.off('foo', listener);
      };
      emitter.on('foo', listener);
      expect(emitter.emit('foo', undefined)).toBe(true);
      expect(emitter.emit('foo', undefined)).toBe(false);
    });

    it('returns false if the event has listeners', () => {
      const listener = sinon.spy();
      emitter.on('foo', listener);
      expect(emitter.emit('notFoo', undefined)).toBe(false);
    });
  });

  describe('listenerCount', () => {
    it('returns the number of listeners for the given event', () => {
      emitter.on('foo', () => {});
      emitter.on('foo', () => {});
      emitter.on('bar', () => {});
      expect(emitter.listenerCount('foo')).toEqual(2);
      expect(emitter.listenerCount('bar')).toEqual(1);
      expect(emitter.listenerCount('noListeners')).toEqual(0);
    });
  });

  describe('removeAllListeners', () => {
    it('removes every listener from all events by default', () => {
      emitter.on('foo', () => {}).on('bar', () => {});

      emitter.removeAllListeners();
      expect(emitter.emit('foo', undefined)).toBe(false);
      expect(emitter.emit('bar', undefined)).toBe(false);
    });

    it('returns the emitter for chaining', () => {
      expect(emitter.removeAllListeners()).toBe(emitter);
    });

    it('can filter to remove only listeners for a given event name', () => {
      emitter
        .on('foo', () => {})
        .on('bar', () => {})
        .on('bar', () => {});

      emitter.removeAllListeners('bar');
      expect(emitter.emit('foo', undefined)).toBe(true);
      expect(emitter.emit('bar', undefined)).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should dispose higher order emitters properly', () => {
      let values = '';
      emitter.on('foo', () => {
        values += '1';
      });
      const higherOrderEmitter = new EventEmitter(emitter);

      higherOrderEmitter.on('foo', () => {
        values += '2';
      });
      higherOrderEmitter.emit('foo', undefined);

      expect(values).toMatch('12');

      higherOrderEmitter.off('foo');
      higherOrderEmitter.emit('foo', undefined);

      expect(values).toMatch('121');
    });
  });
});
