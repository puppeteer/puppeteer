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

class EmulationManager {
  /**
   * @param {!Puppeteer.CDPSession} client
   */
  constructor(client) {
    this._client = client;
    this._emulatingMobile = false;
    this._injectedTouchScriptId = null;
  }

  /**
   * @param {!EmulationManager.Viewport} viewport
   * @return {Promise<boolean>}
   */
  async emulateViewport(viewport) {
    const mobile = viewport.isMobile || false;
    const width = viewport.width;
    const height = viewport.height;
    const deviceScaleFactor = viewport.deviceScaleFactor || 1;
    const screenOrientation = viewport.isLandscape ? {angle: 90, type: 'landscapePrimary'} : {
        angle: 0,
        type: 'portraitPrimary'
      };

    await Promise.all([
      this._client.send('Emulation.setDeviceMetricsOverride', {
        mobile,
        width,
        height,
        deviceScaleFactor,
        screenOrientation
      }),
      this._client.send('Emulation.setTouchEmulationEnabled', {
        enabled: viewport.hasTouch || false,
        configuration: viewport.isMobile ? 'mobile' : 'desktop'
      })
    ]);

    let reloadNeeded = false;
    if (viewport.hasTouch && !this._injectedTouchScriptId) {
      const source = `(${injectedTouchEventsFunction})()`;
      this._injectedTouchScriptId = (await this._client.send('Page.addScriptToEvaluateOnNewDocument', {source})).identifier;
      reloadNeeded = true;
    } else if (!viewport.hasTouch && this._injectedTouchScriptId) {
      await this._client.send('Page.removeScriptToEvaluateOnNewDocument', {identifier: this._injectedTouchScriptId});
      this._injectedTouchScriptId = null;
      reloadNeeded = true;
    }

    if (this._emulatingMobile !== mobile)
      reloadNeeded = true;
    this._emulatingMobile = mobile;
    return reloadNeeded;

    function injectedTouchEventsFunction() {
      const touchEvents = ['ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel'];
      // @ts-ignore
      const recipients = [window.__proto__, document.__proto__];
      for (let i = 0; i < touchEvents.length; ++i) {
        for (let j = 0; j < recipients.length; ++j) {
          if (!(touchEvents[i] in recipients[j])) {
            Object.defineProperty(recipients[j], touchEvents[i], {
              value: null, writable: true, configurable: true, enumerable: true
            });
          }
        }
      }
    }
  }

  async emulateNavigator(navigator, webGlInfo) {
    let reloadNeeded = false;
    if (navigator && webGlInfo) {

      if (!this._injectedNavigatorScript) {
        const source = `(${setNav})(${JSON.stringify(navigator)},${JSON.stringify(webGlInfo)})`;
        this._injectedNavigatorScript = (await this._client.send('Page.addScriptToEvaluateOnNewDocument', {source})).identifier;
        reloadNeeded = true;
      }

      function setNav(navigatorProperties, webGlProperties) {

        function _isNumber(a) {
          return typeof a === 'string' && a.replace(/[^0-9.+]/g, "") === a;
        }

        function _setNavProperties(obj, replacementObj) {
          if (!replacementObj) {
            replacementObj = {};
          }
          for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
              if (replacementObj && !replacementObj[i]) {
                replacementObj[i] = obj[i];
              }
              var val,
                replacementVal;
              if (typeof obj[i] === 'object') {
                val = _setNavProperties(obj[i], replacementObj[i]);
              } else {
                val = obj[i];
                replacementVal = replacementObj[i];
                if (_isNumber(val)) {
                  val = parseInt(val);
                }

                if (obj[i].toString().indexOf('Function') > -1) {
                  if (replacementVal === val) {
                    val = function () {
                    };
                  } else {
                    val = eval(replacementVal);
                  }
                }
                if (i == "description" && obj[i] == "") {
                  val = " ";
                }
                switch (obj[i]) {
                  case 'functionValue':
                    if (replacementVal === val) {
                      val = function () {
                      };
                    } else {
                      val = replacementVal;
                    }
                    break;
                  case 'undefinedError':
                  case 'unknownTypeError':
                    if (replacementVal === val) {
                      val = undefined;
                    } else {
                      val = replacementVal;
                    }
                    break;
                }
              }
              obj[i] = val;
            }
          }
          return obj;
        }

        function overrideCanvas(webGlProperties){

          WebGLRenderingContext.prototype.__oldgetParameter = WebGLRenderingContext.prototype.getParameter;


          WebGLRenderingContext.prototype.getParameter = function(name) {
            if (name == webGlProperties.unmaskedRenderer)
              return webGlProperties.renderer;
            else if (name==webGlProperties.unmaskedVendor)
              return webGlProperties.vendor;
            else return this.__oldgetParameter(name);
          }

        }
        var navProp = _setNavProperties(navigatorProperties);
        overrideCanvas(webGlProperties);
        var oldNavigator = window.navigator;
        window.navigator = navigator = navProp;

        for (let i in navProp) {
          if (navProp.hasOwnProperty(i)) {
            Object.defineProperty(window.navigator, i, {
              value: navProp[i], writable: true, configurable: true, enumerable: true
            });
          }
        }
      }
    }
    return reloadNeeded;

  }

}

module.exports = EmulationManager;
