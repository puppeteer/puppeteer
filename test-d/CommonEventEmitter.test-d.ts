// eslint-disable-next-line no-restricted-imports
import {EventEmitter as NodeEventEmitter} from 'node:events';

import {CommonEventEmitter, EventEmitter} from 'puppeteer';
import {expectAssignable} from 'tsd';

declare const emitter: EventEmitter;

{
  {
    expectAssignable<CommonEventEmitter>(new NodeEventEmitter());
  }
  {
    expectAssignable<CommonEventEmitter>(emitter);
  }
}
