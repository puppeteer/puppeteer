import {createDeferredPromise} from '../util/DeferredPromise.js';
import * as util from './util.js';

const PuppeteerUtil = Object.freeze({
  ...util,
  createDeferredPromise,
});

type PuppeteerUtil = typeof PuppeteerUtil;

export default PuppeteerUtil;
