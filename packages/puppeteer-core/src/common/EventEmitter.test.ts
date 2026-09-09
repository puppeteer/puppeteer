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
