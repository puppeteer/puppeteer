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
    page.on('console', console.log);


    await page.setInPageCallback('callPhantom', msg => {
        console.log("Page is saying: '" + msg + "'");
        return "Hello, page";
    });




    await page.evaluate(async function() {



        // Return-value of the "onCallback" handler arrive here
        var callbackResponse = await window.callPhantom("Hello, driver");
        console.log("Driver is saying: '" + callbackResponse + "'");



    });
    browser.close();
});
