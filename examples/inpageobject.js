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

let Browser = require('../lib/Browser');
let browser = new Browser();

browser.newPage().then(async page => {
    // Forward console logs from the page into node
    page.on('console', console.log);

    // Set up a textarea on the page
    page.setContent('<textarea autofocus></textarea>');

    // Recieve messages from the page
    await page.setInPageCallback('__sendToPuppeteer', async (msg, ...args) => {
        let obj = {page, browser};
        let parent = null;
        for (let property of msg.split('.')) {
            parent = obj;
            obj = obj[property];
        }
        return obj.apply(parent, args);
    });

    await page.evaluate(async function() {
        function makeProxy(prefix) {
            return new Proxy((...args) => __sendToPuppeteer(prefix, ...args), {
                get(obj, method) {
                    return makeProxy(prefix + '.' + method);
                }
            })
        }
        // now `puppeteer` is a proxy for the `page` object in node
        let puppeteer = makeProxy('page');

        // We can type into the page, directly from the page!
        await puppeteer.type('asdf 123 !@#');

        console.log(document.querySelector('textarea').value);
    });
    browser.close();
});
