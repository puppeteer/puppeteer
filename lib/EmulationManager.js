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
        console.log("1 " + JSON.stringify(webGlProperties))
        function overrideCanvas(webGlProperties) {
          console.log("TEST");

          WebGLRenderingContext.prototype.__oldgetParameter = WebGLRenderingContext.prototype.getParameter;

          WebGLRenderingContext.prototype.getParameter = function (name, text) {
            if (name == webGlProperties.unmaskedRenderer)
            {
              console.log("1",name,webGlProperties.renderer)
              return webGlProperties.renderer;
            }
            else if (name == webGlProperties.unmaskedVendor)
            {
              console.log("2",name,webGlProperties.vendor)

              return webGlProperties.vendor;
            }
            else {
              console.log("OLD ")
              return this.__oldgetParameter(name);
            }
          }

          WebGL2RenderingContext.prototype.__oldgetParameter = WebGL2RenderingContext.prototype.getParameter;

          WebGL2RenderingContext.prototype.getParameter = function (name, text) {
            if (name == webGlProperties.unmaskedRenderer)
            {
              console.log("3",name,webGlProperties.renderer)
              return webGlProperties.renderer;
            }
            else if (name == webGlProperties.unmaskedVendor)
            {
              console.log("4",name,webGlProperties.vendor)

              return webGlProperties.vendor;
            }
            else {
              console.log("OLD 5")
              return this.__oldgetParameter(name);
            }
          }

        }
        overrideCanvas(webGlProperties);
        /*Object.defineProperty(navigator, 'plugins', {
         get: function() {
         // this just needs to have `length > 0`, but we could mock the plugins too
         return [1, 2, 3, 4, 5];
         },
         });*/
        //
        // for (let i in navigatorProperties) {
        //   console.log("GET " + JSON.stringify(navigatorProperties[i]), i);
        //   if (navigatorProperties.hasOwnProperty(i)) {
        //     Object.defineProperty(navigator, i.toString(), {
        //       get: function () {
        //         return navigatorProperties[i];
        //       }
        //     });
        //   }
        // }

        try{
          function vecw(val, e, c, w) {
            // Makes an object describing a property
            return {
              value: val,
              enumerable: !!e,
              configurable: !!c,
              writable: !!w
            }
          }

          var properties = {};
          for(var property in window.navigator) {
            var val = window.navigator[property];
            properties[property] = vecw(typeof(val) == 'function' ? val.bind(window.navigator) : val)
          }

          properties.mimeTypes = vecw({}, true);
          properties.plugins = vecw({}, true);


          Object.defineProperty(properties.plugins.value, "refresh", vecw(function() {}));


          let plugin1= {};
          Object.defineProperties(plugin1, {
            "name": vecw("Chrome PDF Viewer",true),
            "filename": vecw("mhjfbmdgcfjbbpaeojofohoefgiehjai", true) ,
            "description":  vecw("Portable Document Format", true),
            "length":  vecw(1, true)
          });
          let mimeType= {};
          Object.defineProperties(mimeType, {
            "type": vecw("application/pdf",true),
            "suffixes": vecw("pdf", true) ,
            "description":  vecw("", true),
            "enabledPlugin":  vecw(plugin1, true),
            "length":  vecw(1, true)
          });

          Object.defineProperty(plugin1, 0, vecw(mimeType, true));


          Object.defineProperties(properties.mimeTypes.value, {
            'length': vecw(1),
            "application/pdf": vecw(mimeType, true),
            0: vecw(mimeType)
          })


          Object.defineProperties(properties.plugins.value, {
            'length': vecw(1),
            "Chrome PDF Viewer": vecw(plugin1, true),
            0: vecw(plugin1)
          })
          var navigator = Object.create(window.navigator);
          Object.defineProperties(navigator, properties);
          Object.defineProperty(window, 'navigator', vecw(navigator));
          console.log("HERE")
        } catch(e) {
          console.log("ERROR " + e)/*Cannot redefine property: navigator*/}
      }
    }
    return reloadNeeded;

  }

}

module.exports = EmulationManager;
