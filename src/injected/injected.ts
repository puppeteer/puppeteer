import {createDeferredPromise} from '../util/DeferredPromise.js';
import * as Poller from './Poller.js';
import * as util from './util.js';

Object.assign(
  self,
  Object.freeze({
    InjectedUtil: {
      ...Poller,
      ...util,
      createDeferredPromise,
    },
  })
);
