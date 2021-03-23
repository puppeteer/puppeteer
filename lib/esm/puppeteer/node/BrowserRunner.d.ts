/**
 * Copyright 2020 Google Inc. All rights reserved.
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
import { LaunchOptions } from './LaunchOptions.js';
import { Connection } from '../common/Connection.js';
import { Product } from '../common/Product.js';
export declare class BrowserRunner {
    private _product;
    private _executablePath;
    private _processArguments;
    private _tempDirectory?;
    proc: any;
    connection: any;
    private _closed;
    private _listeners;
    private _processClosing;
    constructor(product: Product, executablePath: string, processArguments: string[], tempDirectory?: string);
    start(options: LaunchOptions): void;
    close(): Promise<void>;
    kill(): void;
    setupConnection(options: {
        usePipe?: boolean;
        timeout: number;
        slowMo: number;
        preferredRevision: string;
    }): Promise<Connection>;
}
//# sourceMappingURL=BrowserRunner.d.ts.map