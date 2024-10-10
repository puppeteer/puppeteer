/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'fs';

let file = fs.readFileSync('./out/main.js', 'utf-8');

file = file.replaceAll('__proto__: [],', '');
file = file.replaceAll('__proto__: null,', '');
file = file.replaceAll('__proto__: [],', '');

file = file.replaceAll('__proto__: []', '');
file = file.replaceAll('__proto__: null', '');
file = file.replaceAll('d2.__proto__ = b2;', '');
file = file.replaceAll('__proto__: []', '');

file = file.replaceAll('fn = new Function(`return ${functionValue}`)();', '')
file = file.replaceAll("new Function(`(${value})`);", '// stripped')
file = file.replaceAll(`return await this.evaluate(html => {
          document.open();
          document.write(html);
          document.close();
        }, content);`, 'throw new Error("unsupported")')
file = file.replaceAll('link.href = url;', 'throw new Error("unsupported")')
file = file.replaceAll('script.src = url;', 'throw new Error("unsupported")')

fs.writeFileSync('./out/main.js', file);

fs.copyFileSync('../../packages/puppeteer-core/lib/types.d.ts', './out/types.d.ts');

file = fs.readFileSync('./out/types.d.ts', 'utf-8');

file = file.replaceAll('#private;', '');

file = file.replaceAll(`import { Session } from 'chromium-bidi/lib/cjs/protocol/protocol.js';`, 'type Session = any;')
file = file.replaceAll(`import type { ParseSelector } from 'typed-query-selector/parser.js';`, 'type ParseSelector<T extends string> = any;')

file = file.replaceAll(`export declare type SupportedWebDriverCapability = Exclude<Session.CapabilityRequest, 'unhandledPromptBehavior' | 'acceptInsecureCerts'>;`, 'export declare type SupportedWebDriverCapability = any;')

fs.writeFileSync('./out/types.d.ts', file);
