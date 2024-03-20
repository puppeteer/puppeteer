/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {EventEmitter} from '../../common/EventEmitter.js';

/**
 * @internal
 */
export interface Commands {
  'script.evaluate': {
    params: Bidi.Script.EvaluateParameters;
    returnType: Bidi.Script.EvaluateResult;
  };
  'script.callFunction': {
    params: Bidi.Script.CallFunctionParameters;
    returnType: Bidi.Script.EvaluateResult;
  };
  'script.disown': {
    params: Bidi.Script.DisownParameters;
    returnType: Bidi.EmptyResult;
  };
  'script.addPreloadScript': {
    params: Bidi.Script.AddPreloadScriptParameters;
    returnType: Bidi.Script.AddPreloadScriptResult;
  };
  'script.removePreloadScript': {
    params: Bidi.Script.RemovePreloadScriptParameters;
    returnType: Bidi.EmptyResult;
  };

  'browser.close': {
    params: Bidi.EmptyParams;
    returnType: Bidi.EmptyResult;
  };

  'browser.createUserContext': {
    params: Bidi.EmptyParams;
    returnType: Bidi.Browser.CreateUserContextResult;
  };
  'browser.getUserContexts': {
    params: Bidi.EmptyParams;
    returnType: Bidi.Browser.GetUserContextsResult;
  };
  'browser.removeUserContext': {
    params: {
      userContext: Bidi.Browser.UserContext;
    };
    returnType: Bidi.Browser.RemoveUserContext;
  };

  'browsingContext.activate': {
    params: Bidi.BrowsingContext.ActivateParameters;
    returnType: Bidi.EmptyResult;
  };
  'browsingContext.create': {
    params: Bidi.BrowsingContext.CreateParameters;
    returnType: Bidi.BrowsingContext.CreateResult;
  };
  'browsingContext.close': {
    params: Bidi.BrowsingContext.CloseParameters;
    returnType: Bidi.EmptyResult;
  };
  'browsingContext.getTree': {
    params: Bidi.BrowsingContext.GetTreeParameters;
    returnType: Bidi.BrowsingContext.GetTreeResult;
  };
  'browsingContext.navigate': {
    params: Bidi.BrowsingContext.NavigateParameters;
    returnType: Bidi.BrowsingContext.NavigateResult;
  };
  'browsingContext.reload': {
    params: Bidi.BrowsingContext.ReloadParameters;
    returnType: Bidi.BrowsingContext.NavigateResult;
  };
  'browsingContext.print': {
    params: Bidi.BrowsingContext.PrintParameters;
    returnType: Bidi.BrowsingContext.PrintResult;
  };
  'browsingContext.captureScreenshot': {
    params: Bidi.BrowsingContext.CaptureScreenshotParameters;
    returnType: Bidi.BrowsingContext.CaptureScreenshotResult;
  };
  'browsingContext.handleUserPrompt': {
    params: Bidi.BrowsingContext.HandleUserPromptParameters;
    returnType: Bidi.EmptyResult;
  };
  'browsingContext.setViewport': {
    params: Bidi.BrowsingContext.SetViewportParameters;
    returnType: Bidi.EmptyResult;
  };
  'browsingContext.traverseHistory': {
    params: Bidi.BrowsingContext.TraverseHistoryParameters;
    returnType: Bidi.EmptyResult;
  };

  'input.performActions': {
    params: Bidi.Input.PerformActionsParameters;
    returnType: Bidi.EmptyResult;
  };
  'input.releaseActions': {
    params: Bidi.Input.ReleaseActionsParameters;
    returnType: Bidi.EmptyResult;
  };
  'input.setFiles': {
    params: Bidi.Input.SetFilesParameters;
    returnType: Bidi.EmptyResult;
  };

  'permissions.setPermission': {
    params: Bidi.Permissions.SetPermissionParameters;
    returnType: Bidi.EmptyResult;
  };

  'session.end': {
    params: Bidi.EmptyParams;
    returnType: Bidi.EmptyResult;
  };
  'session.new': {
    params: Bidi.Session.NewParameters;
    returnType: Bidi.Session.NewResult;
  };
  'session.status': {
    params: object;
    returnType: Bidi.Session.StatusResult;
  };
  'session.subscribe': {
    params: Bidi.Session.SubscriptionRequest;
    returnType: Bidi.EmptyResult;
  };
  'session.unsubscribe': {
    params: Bidi.Session.SubscriptionRequest;
    returnType: Bidi.EmptyResult;
  };

  'storage.deleteCookies': {
    params: Bidi.Storage.DeleteCookiesParameters;
    returnType: Bidi.Storage.DeleteCookiesResult;
  };
  'storage.getCookies': {
    params: Bidi.Storage.GetCookiesParameters;
    returnType: Bidi.Storage.GetCookiesResult;
  };
  'storage.setCookie': {
    params: Bidi.Storage.SetCookieParameters;
    returnType: Bidi.Storage.SetCookieParameters;
  };

  'network.addIntercept': {
    params: Bidi.Network.AddInterceptParameters;
    returnType: Bidi.Network.AddInterceptResult;
  };
  'network.removeIntercept': {
    params: Bidi.Network.RemoveInterceptParameters;
    returnType: Bidi.EmptyResult;
  };
  'network.continueRequest': {
    params: Bidi.Network.ContinueRequestParameters;
    returnType: Bidi.EmptyResult;
  };
  'network.failRequest': {
    params: Bidi.Network.FailRequestParameters;
    returnType: Bidi.EmptyResult;
  };
}

/**
 * @internal
 */
export type BidiEvents = {
  [K in Bidi.ChromiumBidi.Event['method']]: Extract<
    Bidi.ChromiumBidi.Event,
    {method: K}
  >['params'];
};

/**
 * @internal
 */
export interface Connection<Events extends BidiEvents = BidiEvents>
  extends EventEmitter<Events> {
  send<T extends keyof Commands>(
    method: T,
    params: Commands[T]['params']
  ): Promise<{result: Commands[T]['returnType']}>;
}
