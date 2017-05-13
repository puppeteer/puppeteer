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
var browser = new Browser();

browser.newPage().then(async page => {
    page.on('ConsoleMessage', console.log);
    await page.setInPageCallback('callPhantom', msg => {
        console.log("Received by the 'phantom' main context: "+msg);
        return "Hello there, I'm coming to you from the 'phantom' context instead";
    });
    await page.evaluate(function() {
        // Return-value of the "onCallback" handler arrive here
        var callbackResponse = window.callPhantom("Hello, I'm coming to you from the 'page' context");
        console.log("Received by the 'page' context: "+callbackResponse);
    });
    browser.close();
});
