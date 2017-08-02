/**
 * Copyright 2017 Google Inc., PhantomJS Authors All rights reserved.
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

var Browser = require('../lib/Browser');

if (process.argv.length < 3) {
    console.log('Usage: detectsniff.js <some URL>');
    return;
}

var address = process.argv[2];
console.log('Checking ' + address + '...');

var browser = new Browser();
browser.newPage().then(async page => {
    await page.evaluateOnNewDocument(function() {
        (function () {
            var userAgent = window.navigator.userAgent,
                platform = window.navigator.platform;

            window.navigator = {
                appCodeName: 'Mozilla',
                appName: 'Netscape',
                cookieEnabled: false,
                sniffed: false
            };

            window.navigator.__defineGetter__('userAgent', function () {
                window.navigator.sniffed = true;
                return userAgent;
            });

            window.navigator.__defineGetter__('platform', function () {
                window.navigator.sniffed = true;
                return platform;
            });
        })();
    });
    var success = await page.navigate(address);
    if (!success) {
        console.log('FAIL to load the address');
        browser.close();
        return;
    }
    setTimeout(async function () {
        var sniffed = await page.evaluate(() => navigator.sniffed);
        if (sniffed) {
            console.log('The page tried to sniff the user agent.');
        } else {
            console.log('The page did not try to sniff the user agent.');
        }
        browser.close();
    }, 1500);
});
