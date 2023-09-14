// eslint-disable-next-line no-restricted-imports
import {EventEmitter as NodeEventEmitter} from 'node:events';

import {
  type CommonEventEmitter,
  type EventEmitter,
  type EventType,
} from 'puppeteer';
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
