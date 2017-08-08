import * as RealConnection from './Connection.js';
import {Browser as RealBrowser, TaskQueue as RealTaskQueue} from './Browser.js';
import {Mouse as RealMouse, Keyboard as RealKeyboard}  from './Input.js';
import {Frame as RealFrame, FrameManager as RealFrameManager}  from './FrameManager.js';
import {InterceptedRequest as RealInterceptedRequest, NetworkManager as RealNetworkManager}  from './NetworkManager.js';
import * as child_process from 'child_process';
export as namespace Puppeteer;

export class Connection extends RealConnection {}
export class Mouse extends RealMouse {}
export class Keyboard extends RealKeyboard {}
export class TaskQueue extends RealTaskQueue {}
export class Browser extends RealBrowser {}
export class Frame extends RealFrame {}
export class FrameManager extends RealFrameManager {}
export class InterceptedRequest extends RealInterceptedRequest {}
export class NetworkManager extends RealNetworkManager {}


export interface ChildProcess extends child_process.ChildProcess {}
