import {cosmiconfigSync} from 'cosmiconfig';
import {homedir} from 'os';
import {join} from 'path';
import {Configuration, Product} from 'puppeteer-core';

/**
 * @internal
 */
function isSupportedProduct(product: unknown): product is Product {
  switch (product) {
    case 'chrome':
    case 'firefox':
      return true;
    default:
      return false;
  }
}

/**
 * @internal
 */
export const getConfiguration = (): Configuration => {
  const result = cosmiconfigSync('puppeteer').search();
  const configuration: Configuration = result ? result.config : {};

  // Merging environment variables.
  configuration.browserRevision =
    process.env['PUPPETEER_CHROMIUM_REVISION'] ??
    process.env['PUPPETEER_BROWSER_REVISION'] ??
    process.env['npm_config_puppeteer_browser_revision'] ??
    process.env['npm_package_config_puppeteer_browser_revision'] ??
    configuration.browserRevision;
  configuration.cacheDirectory =
    process.env['PUPPETEER_CACHE_DIR'] ??
    process.env['npm_config_puppeteer_cache_dir'] ??
    process.env['npm_package_config_puppeteer_cache_dir'] ??
    configuration.cacheDirectory ??
    join(homedir(), '.cache', 'puppeteer');
  configuration.downloadHost =
    process.env['PUPPETEER_DOWNLOAD_HOST'] ??
    process.env['npm_config_puppeteer_download_host'] ??
    process.env['npm_package_config_puppeteer_download_host'] ??
    configuration.downloadHost;
  configuration.downloadPath =
    process.env['PUPPETEER_DOWNLOAD_PATH'] ??
    process.env['npm_config_puppeteer_download_path'] ??
    process.env['npm_package_config_puppeteer_download_path'] ??
    configuration.downloadPath;
  configuration.executablePath =
    process.env['PUPPETEER_EXECUTABLE_PATH'] ??
    process.env['npm_config_puppeteer_executable_path'] ??
    process.env['npm_package_config_puppeteer_executable_path'] ??
    configuration.executablePath;
  configuration.defaultProduct = (process.env['PUPPETEER_PRODUCT'] ??
    process.env['npm_config_puppeteer_product'] ??
    process.env['npm_package_config_puppeteer_product'] ??
    configuration.defaultProduct ??
    'chrome') as Product;
  configuration.temporaryDirectory =
    process.env['PUPPETEER_TMP_DIR'] ??
    process.env['npm_config_puppeteer_tmp_dir'] ??
    process.env['npm_package_config_puppeteer_tmp_dir'] ??
    configuration.temporaryDirectory;

  configuration.experiments ??= {};
  configuration.experiments.macArmChromiumEnabled = Boolean(
    process.env['PUPPETEER_EXPERIMENTAL_CHROMIUM_MAC_ARM'] ??
      process.env['npm_config_puppeteer_experimental_chromium_mac_arm'] ??
      process.env[
        'npm_package_config_puppeteer_experimental_chromium_mac_arm'
      ] ??
      configuration.experiments.macArmChromiumEnabled
  );

  configuration.skipDownload = Boolean(
    process.env['PUPPETEER_SKIP_DOWNLOAD'] ??
      process.env['npm_config_puppeteer_skip_download'] ??
      process.env['npm_package_config_puppeteer_skip_download'] ??
      process.env['PUPPETEER_SKIP_CHROMIUM_DOWNLOAD'] ??
      process.env['npm_config_puppeteer_skip_chromium_download'] ??
      process.env['npm_package_config_puppeteer_skip_chromium_download'] ??
      configuration.skipDownload
  );
  configuration.logLevel = (process.env['PUPPETEER_LOGLEVEL'] ??
    process.env['npm_config_LOGLEVEL'] ??
    process.env['npm_package_config_LOGLEVEL'] ??
    configuration.logLevel) as 'silent' | 'error' | 'warn';

  // Validate configuration.
  if (!isSupportedProduct(configuration.defaultProduct)) {
    throw new Error(`Unsupported product ${configuration.defaultProduct}`);
  }

  return configuration;
};
