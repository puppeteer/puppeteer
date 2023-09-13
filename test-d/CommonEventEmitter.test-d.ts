// eslint-disable-next-line no-restricted-imports
import {EventEmitter as NodeEventEmitter} from 'node:events';

import {CommonEventEmitter, EventEmitter, EventType} from 'puppeteer';
import {expectAssignable} from 'tsd';

declare const emitter: EventEmitter<Record<EventType, any>>;

{
  {
    expectAssignable<CommonEventEmitter<Record<EventType, any>>>(
      new NodeEventEmitter()
    );
  }
  {
    expectAssignable<CommonEventEmitter<Record<EventType, any>>>(emitter);
  }
}
