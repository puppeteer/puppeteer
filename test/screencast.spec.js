/**
 * Copyright 2018 Google Inc. All rights reserved.
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

module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Screencast', function() {
    it('should return jpeg frame data when the format is jpeg', async({page, browser, server}) =>
      new Promise(async resolve => {
        await page.setViewport({width: 64, height: 64});
        await page.goto(server.PREFIX + '/grid.html');
        page.on('screencastframe', async frame => {
          await page.screencastFrameAck(frame.sessionId);
          /*
            According to https://en.wikipedia.org/wiki/JPEG_File_Interchange_Format#frb-inline,
            the first 2 bytes of every JPEG are FF (255) and D8 (216); see 'Start of Image'.
            */
          const first8Bytes = [...Buffer.from(frame.data, 'base64')].slice(0, 2).join('-');
          expect(first8Bytes).toBe('255-216');
          await page.stopScreencast();
          resolve();
        });
        await page.startScreencast({format: 'jpeg', everyNthFrame: 1});
      })
    );

    it('should return png frame data when the format is png', async({page, browser, server}) =>
      new Promise(async resolve => {
        await page.setViewport({width: 64, height: 64});
        await page.goto(server.PREFIX + '/grid.html');
        page.on('screencastframe', async frame => {
          await page.screencastFrameAck(frame.sessionId);
          /*
           According to the PNG Specification ( http://www.libpng.org/pub/png/spec/1.2/PNG-Structure.html ),
           the first 8 bytes of every PNG are 137 80 78 71 13 10 26 10.
           */
          const first8Bytes = [...Buffer.from(frame.data, 'base64')].slice(0, 8).join('-');
          expect(first8Bytes).toBe('137-80-78-71-13-10-26-10');
          await page.stopScreencast();
          resolve();
        });
        await page.startScreencast({format: 'png', everyNthFrame: 1});
      })
    );
  });
};
