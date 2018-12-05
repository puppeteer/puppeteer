const t = {
  String: x => typeof x === 'string' || typeof x === 'String',
  Number: x => typeof x === 'number',
  Boolean: x => typeof x === 'boolean',
  Null: x => Object.is(x, null),
  Enum: values => x => values.indexOf(x) !== -1,
  Undefined: x => Object.is(x, undefined),
  Or: (...schemes) => x => schemes.some(scheme => checkScheme(scheme, x)),
  Either: (...schemes) => x => schemes.map(scheme => checkScheme(scheme, x)).reduce((acc, x) => acc + (x ? 1 : 0)) === 1,
  Array: scheme => x => Array.isArray(x) && x.every(element => checkScheme(scheme, element)),
  Nullable: scheme => x => Object.is(x, null) || checkScheme(scheme, x),
  Optional: scheme => x => Object.is(x, undefined) || checkScheme(scheme, x),
  Any: x => true,
}

const RemoteObject = t.Either(
  {
    type: t.Enum(['object', 'function', 'undefined', 'string', 'number', 'boolean', 'symbol', 'bigint']),
    subtype: t.Optional(t.Enum(['array', 'null', 'node', 'regexp', 'date', 'map', 'set', 'weakmap', 'weakset', 'error', 'proxy', 'promise', 'typedarray'])),
    objectId: t.String,
  },
  {
    unserializableValue: t.Enum(['Infinity', '-Infinity', '-0', 'NaN']),
  },
  {
    value: t.Any
  },
);

const DOMPoint = {
  x: t.Number,
  y: t.Number,
};

const DOMQuad = {
  p1: DOMPoint,
  p2: DOMPoint,
  p3: DOMPoint,
  p4: DOMPoint
};

const protocol = {
  methods: {
    'Browser.getInfo': {
      returns: {
        userAgent: t.String,
        version: t.String,
      },
    },
    'Browser.setIgnoreHTTPSErrors': {
      params: {
        enabled: t.Boolean,
      },
    },
    'Browser.newPage': {
      returns: {
        pageId: t.String,
      }
    },
    'Browser.closePage': {
      params: {
        pageId: t.String,
      },
    },
    'Page.enable': {
      params: {
        pageId: t.String,
      },
    },
    'Page.setViewport': {
      params: {
        pageId: t.String,
        viewport: t.Nullable({
          width: t.Number,
          height: t.Number,
          deviceScaleFactor: t.Number,
          isMobile: t.Boolean,
          hasTouch: t.Boolean,
          isLandscape: t.Boolean,
        }),
      },
    },
    'Page.evaluate': {
      params: t.Either({
        pageId: t.String,
        frameId: t.String,
        functionText: t.String,
        returnByValue: t.Optional(t.Boolean),
        args: t.Array(t.Either(
          { objectId: t.String },
          { unserializableValue: t.Enum(['Infinity', '-Infinity', '-0', 'NaN']) },
          { value: t.Any },
        )),
      }, {
        pageId: t.String,
        frameId: t.String,
        script: t.String,
        returnByValue: t.Optional(t.Boolean),
      }),

      returns: {
        result: t.Optional(RemoteObject),
        exceptionDetails: t.Optional({
          text: t.Optional(t.String),
          stack: t.Optional(t.String),
          value: t.Optional(t.Any),
        }),
      }
    },
    'Page.addScriptToEvaluateOnNewDocument': {
      params: {
        pageId: t.String,
        script: t.String,
      },
      returns: {
        scriptId: t.String,
      }
    },
    'Page.removeScriptToEvaluateOnNewDocument': {
      params: {
        pageId: t.String,
        scriptId: t.String,
      },
    },
    'Page.disposeObject': {
      params: {
        pageId: t.String,
        frameId: t.String,
        objectId: t.String,
      },
    },

    'Page.getObjectProperties': {
      params: {
        pageId: t.String,
        frameId: t.String,
        objectId: t.String,
      },

      returns: {
        properties: t.Array({
          name: t.String,
          value: RemoteObject,
        }),
      }
    },
    'Page.navigate': {
      params: {
        pageId: t.String,
        frameId: t.String,
        url: t.String,
      },
      returns: {
        navigationId: t.Nullable(t.String),
        navigationURL: t.Nullable(t.String),
      }
    },
    'Page.goBack': {
      params: {
        pageId: t.String,
        frameId: t.String,
      },
      returns: {
        navigationId: t.Nullable(t.String),
        navigationURL: t.Nullable(t.String),
      }
    },
    'Page.goForward': {
      params: {
        pageId: t.String,
        frameId: t.String,
      },
      returns: {
        navigationId: t.Nullable(t.String),
        navigationURL: t.Nullable(t.String),
      }
    },
    'Page.reload': {
      params: {
        pageId: t.String,
        frameId: t.String,
      },
      returns: {
        navigationId: t.String,
        navigationURL: t.String,
      }
    },
    'Page.getBoundingBox': {
      params: {
        pageId: t.String,
        frameId: t.String,
        objectId: t.String,
      },
      returns: t.Nullable({
        x: t.Number,
        y: t.Number,
        width: t.Number,
        height: t.Number,
      }),
    },
    'Page.screenshot': {
      params: {
        pageId: t.String,
        mimeType: t.Enum(['image/png', 'image/jpeg']),
        fullPage: t.Optional(t.Boolean),
        clip: t.Optional({
          x: t.Number,
          y: t.Number,
          width: t.Number,
          height: t.Number,
        })
      },
      returns: {
        data: t.String,
      }
    },
    'Page.getContentQuads': {
      params: {
        pageId: t.String,
        frameId: t.String,
        objectId: t.String,
      },
      returns: {
        quads: t.Array(DOMQuad),
      },
    },
    'Page.dispatchKeyEvent': {
      params: {
        pageId: t.String,
        type: t.String,
        key: t.String,
        keyCode: t.Number,
        location: t.Number,
        code: t.String,
        repeat: t.Boolean,
      }
    },
    'Page.dispatchMouseEvent': {
      params: {
        pageId: t.String,
        type: t.String,
        button: t.Number,
        x: t.Number,
        y: t.Number,
        modifiers: t.Number,
        clickCount: t.Optional(t.Number),
        buttons: t.Number,
      }
    },
    'Page.insertText': {
      params: {
        pageId: t.String,
        text: t.String,
      }
    },
    'Page.handleDialog': {
      params: {
        pageId: t.String,
        dialogId: t.String,
        accept: t.Boolean,
        promptText: t.Optional(t.String),
      },
    },
  },
  events: {
    'Browser.tabOpened': {
      pageId: t.String,
      url: t.String,
    },
    'Browser.tabClosed': { pageId: t.String, },
    'Browser.tabNavigated': {
      pageId: t.String,
      url: t.String
    },
    'Page.eventFired': {
      pageId: t.String,
      frameId: t.String,
      name: t.Enum(['load', 'DOMContentLoaded']),
    },
    'Page.uncaughtError': {
      pageId: t.String,
      frameId: t.String,
      message: t.String,
      stack: t.String,
    },
    'Page.frameAttached': {
      pageId: t.String,
      frameId: t.String,
      parentFrameId: t.Optional(t.String),
    },
    'Page.frameDetached': {
      pageId: t.String,
      frameId: t.String,
    },
    'Page.navigationStarted': {
      pageId: t.String,
      frameId: t.String,
      navigationId: t.String,
      url: t.String,
    },
    'Page.navigationCommitted': {
      pageId: t.String,
      frameId: t.String,
      navigationId: t.String,
      url: t.String,
      // frame.id or frame.name
      name: t.String,
    },
    'Page.navigationAborted': {
      pageId: t.String,
      frameId: t.String,
      navigationId: t.String,
      errorText: t.String,
    },
    'Page.sameDocumentNavigation': {
      pageId: t.String,
      frameId: t.String,
      url: t.String,
    },
    'Page.consoleAPICalled': {
      pageId: t.String,
      frameId: t.String,
      args: t.Array(RemoteObject),
      type: t.String,
    },
    'Page.dialogOpened': {
      pageId: t.String,
      dialogId: t.String,
      type: t.Enum(['prompt', 'alert', 'confirm', 'beforeunload']),
      message: t.String,
      defaultValue: t.Optional(t.String),
    },
    'Page.dialogClosed': {
      pageId: t.String,
      dialogId: t.String,
    },
  },
}

function checkScheme(scheme, x, details = {}, path = []) {
  if (typeof scheme === 'object') {
    for (const [propertyName, check] of Object.entries(scheme)) {
      path.push(propertyName);
      const result = checkScheme(check, x[propertyName], details, path);
      path.pop();
      if (!result)
        return false;
    }
    for (const propertyName of Object.keys(x)) {
      if (!scheme[propertyName]) {
        path.push(propertyName);
        details.propertyName = path.join('.');
        details.propertyValue = x[propertyName];
        details.errorType = 'extra';
        return false;
      }
    }
    return true;
  }
  const result = scheme(x);
  if (!result) {
    details.propertyName = path.join('.');
    details.propertyValue = x;
    details.errorType = 'unsupported';
  }
  return result;
}

this.protocol = protocol;
this.checkScheme = checkScheme;
this.EXPORTED_SYMBOLS = ['protocol', 'checkScheme'];
