#!/usr/bin/env node

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

import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as puppeteer from '../index';

const DEVICES_URL =
  'https://raw.githubusercontent.com/ChromeDevTools/devtools-frontend/master/front_end/emulated_devices/module.json';

const template = `/**
 * Copyright 2019 Google Inc. All rights reserved.
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

import { Viewport } from './types';

export interface Device {
  name: string;
  userAgent: string;
  viewport: Viewport;
}

const deviceDescriptors: Device[] = %s;

export const devices = deviceDescriptors.reduce((acc, device) => {
  acc[device.name] = device;
  return acc;
}, {} as Record<string, Device>);
`;

const help = `Usage:  node ${path.basename(__filename)} [-u <from>] <outputPath>
  -u, --url    The URL to load devices descriptor from. If not set,
               devices will be fetched from the tip-of-tree of DevTools
               frontend.

  -h, --help   Show this help message

Fetch Chrome DevTools front-end emulation devices from given URL, convert them to puppeteer
devices and save to the <outputPath>.
`;

const argv = require('minimist')(process.argv.slice(2), {
  alias: { u: 'url', h: 'help' }
});

if (argv.help) {
  console.log(help);
  process.exit(0);
}

const url = argv.url || DEVICES_URL;
const outputPath = argv._[0];
if (!outputPath) {
  console.error('ERROR: output file name is missing. Use --help for help.');
  process.exit(1);
}

main(url);

async function main(url: string) {
  const browser = await puppeteer.launch();
  const chromeVersion = (await browser.version()).split('/').pop()!;
  await browser.close();
  console.log('GET ' + url);

  const text = await httpGET(url);
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error(`FAILED: error parsing response - ${e.message}`);
    return;
  }
  const devicePayloads = (json.extensions as Array<{ type: string; device: any }>)
    .filter(extension => extension.type === 'emulated-device')
    .map(extension => extension.device);

  let devices = [];
  for (const payload of devicePayloads) {
    const names: string[] = [];

    if (payload.title === 'iPhone 6/7/8') names.push('iPhone 6', 'iPhone 7', 'iPhone 8');
    else if (payload.title === 'iPhone 6/7/8 Plus') names.push('iPhone 6 Plus', 'iPhone 7 Plus', 'iPhone 8 Plus');
    else if (payload.title === 'iPhone 5/SE') names.push('iPhone 5', 'iPhone SE');
    else names.push(payload.title);

    for (const name of names) {
      const device = createDevice(chromeVersion, name, payload, false);
      const landscape = createDevice(chromeVersion, name, payload, true);
      devices.push(device);
      if (landscape.viewport.width !== device.viewport.width || landscape.viewport.height !== device.viewport.height)
        devices.push(landscape);
    }
  }

  devices = devices.filter(device => device.viewport.isMobile);
  devices.sort((a, b) => a.name.localeCompare(b.name));

  // Use single-quotes instead of double-quotes to conform with codestyle.
  const serialized = JSON.stringify(devices, null, 2)
    .replace(/'/g, `\\'`)
    .replace(/"/g, `'`);
  const result = util.format(template, serialized);
  fs.writeFileSync(outputPath, result, 'utf8');
}

function createDevice(chromeVersion: string, deviceName: string, descriptor: any, landscape: boolean) {
  const devicePayload = loadFromJSONV1(descriptor);
  const viewportPayload = landscape ? devicePayload.horizontal : devicePayload.vertical;
  return {
    name: deviceName + (landscape ? ' landscape' : ''),
    userAgent: devicePayload.userAgent.includes('%s')
      ? util.format(devicePayload.userAgent, chromeVersion)
      : devicePayload.userAgent,
    viewport: {
      width: viewportPayload.width,
      height: viewportPayload.height,
      deviceScaleFactor: devicePayload.deviceScaleFactor,
      isMobile: devicePayload.capabilities.includes('mobile'),
      hasTouch: devicePayload.capabilities.includes('touch'),
      isLandscape: landscape || false
    }
  };
}

function loadFromJSONV1(json: any) {
  function parseValue(object: any, key: string, type: string, defaultValue?: any) {
    if (typeof object !== 'object' || object === null || !object.hasOwnProperty(key)) {
      if (typeof defaultValue !== 'undefined') return defaultValue;
      throw new Error("Emulated device is missing required property '" + key + "'");
    }
    const value = object[key];
    if (typeof value !== type || value === null)
      throw new Error("Emulated device property '" + key + "' has wrong type '" + typeof value + "'");
    return value;
  }

  function parseIntValue(object: any, key: string): number {
    const value = parseValue(object, key, 'number');
    if (value !== Math.abs(value)) throw new Error("Emulated device value '" + key + "' must be integer");
    return value;
  }

  function parseOrientation(json: any) {
    const result = { width: parseIntValue(json, 'width'), height: parseIntValue(json, 'height') };
    const minDeviceSize = 50;
    const maxDeviceSize = 9999;
    if (result.width < 0 || result.width > maxDeviceSize || result.width < minDeviceSize)
      throw new Error('Emulated device has wrong width: ' + result.width);
    if (result.height < 0 || result.height > maxDeviceSize || result.height < minDeviceSize)
      throw new Error('Emulated device has wrong height: ' + result.height);

    return result;
  }

  const capabilities = parseValue(json, 'capabilities', 'object', []) as string[];
  if (!Array.isArray(capabilities)) throw new Error('Emulated device capabilities must be an array');

  for (const capability of capabilities) {
    if (typeof capability !== 'string') throw new Error('Emulated device capability must be a string');
  }

  const deviceScaleFactor = parseValue(json['screen'], 'device-pixel-ratio', 'number') as number;
  if (deviceScaleFactor < 0 || deviceScaleFactor > 100)
    throw new Error('Emulated device has wrong deviceScaleFactor: ' + deviceScaleFactor);

  const result = {
    type: parseValue(json, 'type', 'string') as string,
    userAgent: parseValue(json, 'user-agent', 'string') as string,
    capabilities,
    deviceScaleFactor,
    vertical: parseOrientation(parseValue(json['screen'], 'vertical', 'object')),
    horizontal: parseOrientation(parseValue(json['screen'], 'horizontal', 'object'))
  };

  return result;
}

function httpGET(url: string) {
  let fulfill!: (value: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((res, rej) => {
    fulfill = res;
    reject = rej;
  });
  const driver = url.startsWith('https://') ? https : http;
  const request = driver.get(url, response => {
    let data = '';
    response.setEncoding('utf8');
    response.on('data', chunk => (data += chunk));
    response.once('end', () => fulfill(data));
    response.once('error', reject);
  });
  request.once('error', reject);
  return promise;
}
