const { EventEmitter } = require('../lib/EventEmitter');
const sinon = require('sinon');
const expect = require('expect');

describe.only('EventEmitter', () => {
  let emitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    const onTests = (methodName) => {
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
    const offTests = (methodName) => {
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
});
