import { BrowserLaunchArgumentOptions, PuppeteerNodeLaunchOptions } from './LaunchOptions.js';
import { Product } from '../common/Product.js';
/**
 * Describes a launcher - a class that is able to create and launch a browser instance.
 * @public
 */
export interface ProductLauncher {
    launch(object: PuppeteerNodeLaunchOptions): any;
    executablePath: () => string;
    defaultArgs(object: BrowserLaunchArgumentOptions): any;
    product: Product;
}
/**
 * @internal
 */
export default function Launcher(projectRoot: string, preferredRevision: string, isPuppeteerCore: boolean, product?: string): ProductLauncher;
//# sourceMappingURL=Launcher.d.ts.map