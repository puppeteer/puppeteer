const Events = {
  Page: {
    Close: 'close',
    Console: 'console',
    Dialog: 'dialog',
    DOMContentLoaded: 'domcontentloaded',
    FrameAttached: 'frameattached',
    FrameDetached: 'framedetached',
    FrameNavigated: 'framenavigated',
    Load: 'load',
    PageError: 'pageerror',
    Popup: 'popup',
    Request: 'request',
    Response: 'response',
    RequestFinished: 'requestfinished',
    RequestFailed: 'requestfailed',
  },
  Browser: {
    Disconnected: 'disconnected',
    TargetCreated: 'targetcreated',
    TargetChanged: 'targetchanged',
    TargetDestroyed: 'targetdestroyed',
  },
  BrowserContext: {
    TargetCreated: 'targetcreated',
    TargetChanged: 'targetchanged',
    TargetDestroyed: 'targetdestroyed',
  },

  Connection: {
    Disconnected: Symbol('Events.Connection.Disconnected'),
  },

  JugglerSession: {
    Disconnected: Symbol('Events.JugglerSession.Disconnected'),
  },

  FrameManager: {
    Load: Symbol('Events.FrameManager.Load'),
    DOMContentLoaded: Symbol('Events.FrameManager.DOMContentLoaded'),
    FrameAttached: Symbol('Events.FrameManager.FrameAttached'),
    FrameNavigated: Symbol('Events.FrameManager.FrameNavigated'),
    FrameDetached: Symbol('Events.FrameManager.FrameDetached'),
  },

  NetworkManager: {
    Request: Symbol('Events.NetworkManager.Request'),
    Response: Symbol('Events.NetworkManager.Response'),
    RequestFinished: Symbol('Events.NetworkManager.RequestFinished'),
  },
};

module.exports = {Events};
