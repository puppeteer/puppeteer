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
    const screenHeight = viewport.availHeight;
    const screenWidth = viewport.availWidth;
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
        screenOrientation,
        screenHeight,
        screenWidth
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

  async emulateNavigator(options) {
    let reloadNeeded = false;
    if (!this._injectedNavigatorScript) {
      const source = `(${setNav})(${JSON.stringify(options)})`;
      this._injectedNavigatorScript = (await this._client.send('Page.addScriptToEvaluateOnNewDocument', {source})).identifier;
      reloadNeeded = true;
    }

    function setNav(options) {
      function createProperty(value) {
        var _value = value;

        /**
         * Overwrite getter.
         *
         * @returns {Any} The Value.
         * @private
         */
        function _get() {
          return _value;
        }

        /**
         * Overwrite setter.
         *
         * @param {Any} v   Sets the value.
         * @private
         */
        function _set(v) {
          _value = v;
        }

        return {
          "configurable": true,
          "get": _get,
          "set": _set
        };
      };

      function makePropertyWritable(objBase, objScopeName, propName, initValue) {
        var newProp,
          initObj;

        if (objBase && objScopeName in objBase && propName in objBase[objScopeName]) {
          if (typeof initValue === "undefined") {
            initValue = objBase[objScopeName][propName];
          }

          newProp = createProperty(initValue);
          try {
            Object.defineProperty(objBase[objScopeName], propName, newProp);
          } catch (e) {
            console.log(`error ${e}`);
            initObj = {};
            initObj[propName] = newProp;
            try {
              objBase[objScopeName] = Object.create(objBase[objScopeName], initObj);
            } catch (e) {
              // Workaround, but necessary to overwrite native host objects
            }
          }
        }
      };

      function newObject(val, e, c, w) {
        return {
          value: val,
          enumerable: !!e,
          configurable: !!c,
          writable: !!w
        }
      }

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

      function overrideNavigator(navigatorProperties) {
        try {
          for (var i in navigatorProperties) {
            makePropertyWritable(window, "navigator", i);
            if (i != "plugins" && i != "mimeTypes" && i !="permissions") {
              window.navigator[i] = navigatorProperties[i];
            }
          }


          if (navigatorProperties.plugins && navigatorProperties.mimeTypes) {
            function PluginArray(plugins) {
              for (var i = 0; i < plugins.length; i++) {
                this[i] = plugins[i];
                this[plugins[i].name] = plugins[i];
              }
              this.length = plugins.length
            }

            function Plugin(plugin) {
              this.name = plugin.name;
              this.filename = plugin.filename;
              this.description = plugin.description;
              this.length = plugin.length;
            };

            function MimeTypeArray(mimeTypes) {
              for (var i = 0; i < mimeTypes.length; i++) {
                this[i] = mimeTypes[i];
                this[mimeTypes[i].type] = mimeTypes[i];
              }
              this.length = mimeTypes.length
            }

            function MimeType(mimeType) {
              this.type = mimeType.type;
              this.suffixes = mimeType.suffixes;
              this.description = mimeType.description;
            };

            let plugins = [], mimeTypes = [],
              extractedPlugins = navigatorProperties.plugins,
              extractedMimeTypes = navigatorProperties.mimeTypes

            extractedPlugins.forEach(function (plugin) {
              var plugin = new Plugin({
                "name": plugin.name,
                "filename": plugin.filename,
                "description": plugin.description,
                "length": plugin.length
              })
              plugins.push(plugin);
            });

            extractedMimeTypes.forEach(function (mimeType) {
              var mimeType = new MimeType({
                "type": mimeType.type,
                "suffixes": mimeType.suffixes,
                "description": mimeType.description
              })
              mimeTypes.push(mimeType);
            });

            extractedMimeTypes.forEach(function (value) {
              let pluginMime = {};
              for (let i = 0; i < value.enabledPlugin.length; i++) {
                let enabledPluginName = value.enabledPlugin[i],
                  plugin = plugins.find(function (element) {
                    return element.name == enabledPluginName;
                  });

                if (plugin) {
                  pluginMime = plugin;
                }
              }
              let foundMime = mimeTypes.find(function (element) {
                return element.type == value.type
              })
              foundMime.enabledPlugin = pluginMime;
            });

            extractedPlugins.forEach(function (value) {
              let foundPlugin = plugins.find(function (element) {
                return element.name == value.name;
              })
              for (let i = 0; i < value.mimeType.length; i++) {
                let mimetype = value.mimeType[i],
                  mime = mimeTypes.find(function (element) {
                    return element.type == mimetype;
                  });

                if (mime) {
                  foundPlugin[i] = mime;
                  foundPlugin[mime.type] = mime;
                }
              }
            });

            let pluginArr = new PluginArray(plugins),
              mimeArr = new MimeTypeArray(mimeTypes);

            Object.defineProperty(window.navigator, "plugins", newObject(pluginArr, true, false, false))
            Object.defineProperty(window.navigator, "mimeTypes", newObject(mimeArr, true, false, false))
          }
        }
        catch (ex) {
          console.log(`Error overriding navigator  ${ex}`)
        }
      }

      function overrideWindowChrome(chrome) {
        if (chrome) {
          try {
            if (!window.chrome) {
              Object.defineProperty(window, "chrome", newObject(chrome, false))
            }

            if (!window.chrome) {
              console.log(`window.chrome is empty!`)
            }
          }
          catch(ex)
          {
            console.log("Error setting window.chrome")
          }
        }
      }

      function overridePermissions(permissions) {
        if (permissions) {
          window.navigator.permissions.__oldquery = window.navigator.permissions.query;
          return window.navigator.permissions.query = (parameters) => {

            function findPerm(perm) {
              return perm.name == parameters.name && (typeof parameters.sysex != "undefined" ? perm.sysex == parameters.sysex : true) && (typeof parameters.userVisible != "undefined" ? perm.userVisible == parameters.userVisible : true) && (typeof parameters.userVisibleOnly != "undefined" ? perm.userVisibleOnly == parameters.userVisibleOnly : true)
            }

            let foundPerm = permissions.find(findPerm)
            return typeof foundPerm != "undefined" && foundPerm.state ? Promise.resolve({state: foundPerm.state}) : window.navigator.permissions.__oldquery(parameters)
          };
        }
      }

      function overrideBrokenImage() {
        try {
          ['height', 'width'].forEach(property => {
            // store the existing descriptor
            const imageDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, property);

            // redefine the property with a patched descriptor
            Object.defineProperty(HTMLImageElement.prototype, property, {
              ...imageDescriptor,
              get: function () {
                // return an arbitrary non-zero dimension if the image failed to load
                if (this.complete && this.naturalHeight == 0) {
                  return 20;
                }
                // otherwise, return the actual dimension
                return imageDescriptor.get.apply(this);
              },
            });
          });
        }
        catch(ex)
        {
          console.log(`Error overrding broken image ${ex}`);
        }
      }

      function overrideModernizr() {
        try {
          if (HTMLDivElement.prototype.offsetHeight) {
            const elementDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

            // redefine the property with a patched descriptor
            Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
              ...elementDescriptor,
              get: function () {
                if (this.id === 'modernizr') {
                  return 1;
                }
                return elementDescriptor.get.apply(this);
              },
            });
          }
        }catch(ex){
          console.log(`Error overriding Modernzr ${ex}`);
        }
      }
      overrideModernizr();
      overrideCanvas(options.webGLInfo);
      overrideNavigator(options.navigator);
      overrideBrokenImage();
      overrideWindowChrome(options.chrome);
      return overridePermissions(options.permissions);
    }

    return reloadNeeded;

  }

}

module.exports = EmulationManager;
