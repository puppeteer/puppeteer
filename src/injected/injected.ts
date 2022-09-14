import {createDeferredPromise} from '../util/DeferredPromise.js';
import * as util from './util.js';
import * as Poller from './Poller.js';

const PuppeteerUtil = Object.freeze({
  ...util,
  ...Poller,
  createDeferredPromise,
});

type PuppeteerUtil = typeof PuppeteerUtil;

export default PuppeteerUtil;
