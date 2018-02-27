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

const _ = require('lodash');

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

        function overrideCanvas(webGlProperties) {
          //WEBGL SUPPORT
          WebGLRenderingContext.prototype.__oldgetParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function (name) {
            if (name == webGlProperties.unmaskedRenderer) {
              return webGlProperties.renderer;
            }
            else if (name == webGlProperties.unmaskedVendor) {
              return webGlProperties.vendor;
            }
            else {
              return this.__oldgetParameter(name);
            }
          };

          //WEBGL2 SUPPORT
          WebGL2RenderingContext.prototype.__oldgetParameter = WebGL2RenderingContext.prototype.getParameter;
          WebGL2RenderingContext.prototype.getParameter = function (name) {
            if (name == webGlProperties.unmaskedRenderer) {
              return webGlProperties.renderer;
            }
            else if (name == webGlProperties.unmaskedVendor) {
              return webGlProperties.vendor;
            }
            else {
              return this.__oldgetParameter(name);
            }
          }

        }

        overrideCanvas(webGlProperties);

        try {
          function newObject(val, e, c, w) {
            return {
              value: val,
              enumerable: !!e,
              configurable: !!c,
              writable: !!w
            }
          }

          //copy navigator to properties
          let properties = {};
          for (let property in window.navigator) {
            let val = window.navigator[property];
            properties[property] = newObject(typeof(val) == 'function' ? val.bind(window.navigator) : val)
          }

          //Empty the properties we want to override
          for (let navProperty in navigatorProperties) {
            if (navigatorProperties.hasOwnProperty(navProperty)) {
              let currentProp = navigatorProperties[navProperty];
              properties[navProperty] = newObject({}, true);
              if (navProperty != "plugins" || navProperty !="mimeTypes") {
                Object.defineProperty(properties[navProperty].value, navProperty, newObject(currentProp, true));
              }
            }
          }
          Object.defineProperty(properties.plugins.value, "refresh", newObject(function () {
          }));

          let plugins = [],
            extractedPlugins = navigatorProperties.plugins;

          extractedPlugins.forEach(function (plugin) {
            let plugin1 = {};
            Object.defineProperties(plugin1, {
              "name": newObject(plugin.name, true),
              "filename": newObject(plugin.filename, true),
              "description": newObject(plugin.description, true),
              "length": newObject(plugin.length, true)
            });
            plugins.push(plugin1);
          });

          console.log(`EXTRACTED PLUGINS ${JSON.stringify(extractedPlugins)}`);
          let mimeTypes = [],
            extractedMimeTypes = navigatorProperties.mimeTypes;

          extractedMimeTypes.forEach(function (mimeType) {
            let mimeType1 = {};
            Object.defineProperties(mimeType, {
              "type": newObject(mimeType.type, true),
              "suffixes": newObject(mimeType.suffixes, true),
              "description": newObject(mimeType.description, true)
            });
            mimeTypes.push(mimeType1);
          });
          console.log(`EXTRACTED MIMETYPES ${JSON.stringify(extractedMimeTypes)}`);

          _.forEach(navigatorProperties.plugins, function (value) {
            for (let i = 0; i < value.mimeType.length; i++) {
              let mimetype = value.mimeType[i],
                mime = _.find(extractedMimeTypes, {"type": mimetype});

              if (mime) {
                let plugin = _.find(extractedPlugins, {"name": value.name});
                Object.defineProperty(plugin, i, newObject(mime, true));
              }
            }
          });
          console.log(`PROCESSED PLUGINS ${JSON.stringify(extractedPlugins)}`);


          _.forEach(navigatorProperties.mimeTypes, function (value) {
            for (let i = 0; i < value.plugins.length; i++) {
              let pluginName = value.plugins[i],
                plugin = _.find(extractedPlugins, {"name": pluginName});

              if (plugin) {
                let mime = _.find(extractedMimeTypes, {"type": value.type});
                Object.defineProperty(mime, i, newObject(plugin, true));
              }
            }
          });
          console.log(`PROCESSED MIMES ${JSON.stringify(extractedMimeTypes)}`);

          let masterMimeType = {
            "length": newObject(extractedMimeTypes.length)
          };

          for (let iter = 0; iter < extractedMimeTypes.length; iter++) {
            let mimeType = extractedMimeTypes[iter];
            masterMimeType[iter] = newObject(mimeType);
            masterMimeType[mimeType.type] = newObject(mimeType, true)
          }

          console.log(`MASTER MIME TYPE ${JSON.stringify(masterMimeType)}`);
          Object.defineProperties(properties.mimeTypes.value, masterMimeType);


          let masterPlugin = {
            "length": newObject(extractedPlugins.length)
          };

          for (let iter = 0; iter < extractedPlugins.length; iter++) {
            let plugin = extractedPlugins[iter];
            masterPlugin[iter] = newObject(plugin);
            masterPlugin[plugin.name] = newObject(plugin, true)
          }

          console.log(`MASTER PLUGIN ${JSON.stringify(masterPlugin)}`);
          Object.defineProperties(properties.plugins.value, masterPlugin);


          var navigator = Object.create(window.navigator);
          Object.defineProperties(navigator, properties);
          Object.defineProperty(window, 'navigator', newObject(navigator));
          console.log("HERE")
        }
        catch
          (e) {
          console.log("ERROR " + e)
          /*Cannot redefine property: navigator*/
        }
      }
    }

    return reloadNeeded;

  }

}

module
  .exports = EmulationManager;
