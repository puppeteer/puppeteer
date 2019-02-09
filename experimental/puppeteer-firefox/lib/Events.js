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
  },
  Browser: {
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

  FrameManager: {
    Load: Symbol('Events.FrameManager.Load'),
    DOMContentLoaded: Symbol('Events.FrameManager.DOMContentLoaded'),
    FrameAttached: Symbol('Events.FrameManager.FrameAttached'),
    FrameDetached: Symbol('Events.FrameManager.FrameDetached'),
  }
};

module.exports = {Events};
