/**
 * Copyright 2017 Google Inc. All rights reserved.
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

const fs = require('fs');
const path = require('path');

const utils = module.exports = {
  /**
   * @param {!Page} page
   * @param {string} frameId
   * @param {string} url
   * @return {!Puppeteer.Frame}
   */
  attachFrame: async function(page, frameId, url) {
    await page.evaluate(attachFrame, frameId, url);

    async function attachFrame(frameId, url) {
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.id = frameId;
      document.body.appendChild(frame);
      await new Promise(x => frame.onload = x);
    }
  },

  /**
   * @param {!Page} page
   * @param {string} frameId
   */
  detachFrame: async function(page, frameId) {
    await page.evaluate(detachFrame, frameId);

    function detachFrame(frameId) {
      const frame = document.getElementById(frameId);
      frame.remove();
    }
  },

  /**
   * @param {!Page} page
   * @param {string} frameId
   * @param {string} url
   */
  navigateFrame: async function(page, frameId, url) {
    await page.evaluate(navigateFrame, frameId, url);

    function navigateFrame(frameId, url) {
      const frame = document.getElementById(frameId);
      frame.src = url;
      return new Promise(x => frame.onload = x);
    }
  },

  /**
   * @param {!Frame} frame
   * @param {string=} indentation
   * @return {!Array<string>}
   */
  dumpFrames: function(frame, indentation) {
    indentation = indentation || '';
    let description = frame.url().replace(/:\d{4}\//, ':<PORT>/');
    if (frame.name())
      description += ' (' + frame.name() + ')';
    let result = [indentation + description];
    for (const child of frame.childFrames())
      result.push(...utils.dumpFrames(child, '    ' + indentation));
    return result;
  },

  /**
   * @param {!EventEmitter} emitter
   * @param {string} eventName
   * @return {!Promise<!Object>}
   */
  waitEvent: function(emitter, eventName, predicate = () => true) {
    return new Promise(fulfill => {
      emitter.on(eventName, function listener(event) {
        if (!predicate(event))
          return;
        emitter.removeListener(eventName, listener);
        fulfill(event);
      });
    });
  },
};
