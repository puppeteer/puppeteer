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

import {describe, it, beforeEach} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

import {EventEmitter} from './EventEmitter.js';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    const onTests = (methodName: 'on' | 'addListener'): void => {
      it(`${methodName}: adds an event listener that is fired when the event is emitted`, () => {
        const listener = sinon.spy();
        emitter[methodName]('foo', listener);
        emitter.emit('foo');
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
    // we support addListener for legacy reasons
    onTests('addListener');
  });

  describe('off', () => {
    const offTests = (methodName: 'off' | 'removeListener'): void => {
      it(`${methodName}: removes the listener so it is no longer called`, () => {
        const listener = sinon.spy();
        emitter.on('foo', listener);
        emitter.emit('foo');
        expect(listener.callCount).toEqual(1);
        emitter.off('foo', listener);
        emitter.emit('foo');
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
    // we support removeListener for legacy reasons
    offTests('removeListener');
  });

  describe('once', () => {
    it('only calls the listener once and then removes it', () => {
      const listener = sinon.spy();
      emitter.once('foo', listener);
      emitter.emit('foo');
      expect(listener.callCount).toEqual(1);
      emitter.emit('foo');
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

      emitter.emit('foo');

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
      expect(emitter.emit('foo')).toBe(true);
    });

    it('returns false if the event has listeners', () => {
      const listener = sinon.spy();
      emitter.on('foo', listener);
      expect(emitter.emit('notFoo')).toBe(false);
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
      expect(emitter.emit('foo')).toBe(false);
      expect(emitter.emit('bar')).toBe(false);
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
      expect(emitter.emit('foo')).toBe(true);
      expect(emitter.emit('bar')).toBe(false);
    });
  });
});
