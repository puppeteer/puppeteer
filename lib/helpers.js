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

var helpers = module.exports = {
    /**
     * @param {!CDP} client
     * @param {string} url
     * @return {!Promise<?Object>}
     */
    waitForScriptWithURL: function(client, url) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        client.on('Debugger.scriptParsed', onScriptParsed);
        client.on('Debugger.scriptFailedToParse', onScriptFailedToParse);
        return promise;

        function onScriptParsed(event) {
            if (event.url !== url)
                return;
            client.removeListener('Debugger.scriptParsed', onScriptParsed);
            client.removeListener('Debugger.scriptFailedToParse', onScriptFailedToParse);
            fulfill(event);
        }

        function onScriptFailedToParse(event) {
            if (event.url !== url)
                return;
            client.removeListener('Debugger.scriptParsed', onScriptParsed);
            client.removeListener('Debugger.scriptFailedToParse', onScriptFailedToParse);
            fulfill(null);
        }
    },

    /**
     * @param {!CDP} client
     * @param {function()} fun
     * @param {!Array<*>} args
     * @param {boolean} awaitPromise
     * @param {string=} sourceURL
     * @return {!Promise<!Object>}
     */
    evaluate: function(client, fun, args, awaitPromise, sourceURL) {
        var code = helpers.evaluationString(fun, args, awaitPromise, sourceURL);
        return client.send('Runtime.evaluate', {
            expression: code,
            awaitPromise: awaitPromise,
            returnByValue: true
        });
    },

    /**
     * @param {function()} fun
     * @param {!Array<*>} args
     * @param {boolean} awaitPromise
     * @param {string=} sourceURL
     * @return {string}
     */
    evaluationString: function(fun, args, awaitPromise, sourceURL) {
        var argsString = args.map(x => JSON.stringify(x)).join(',');
        var code = `(${fun.toString()})(${argsString})`;
        if (awaitPromise)
            code = `Promise.resolve(${code})`;
        if (sourceURL)
            code += `\n//# sourceURL=${sourceURL}`;
        return code;
    }
}
