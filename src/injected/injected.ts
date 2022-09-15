import {createDeferredPromise} from '../util/DeferredPromise.js';
import * as util from './util.js';
import * as Poller from './Poller.js';
import * as TextContent from './TextContent.js';

const PuppeteerUtil = Object.freeze({
  ...util,
  ...Poller,
  ...TextContent,
  createDeferredPromise,
});

type PuppeteerUtil = typeof PuppeteerUtil;

export default PuppeteerUtil;
