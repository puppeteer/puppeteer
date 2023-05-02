/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const assert = require('assert');

const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const lightCodeTheme = require('prism-react-renderer/themes/github');

const archivedVersions = require('./versionsArchived.json');

const DOC_ROUTE_BASE_PATH = '/';
const DOC_PATH = '../docs';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Puppeteer',
  tagline: 'Headless Chrome Node.js API',
  url: 'https://pptr.dev',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'puppeteer',
  projectName: 'puppeteer',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  scripts: [
    {
      src: '/fix-location.js',
      async: false,
      defer: false,
    },
  ],
  webpack: {
    jsLoader: isServer => {
      return {
        loader: require.resolve('swc-loader'),
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
            },
            target: 'es2017',
          },
          module: {
            type: isServer ? 'commonjs' : 'es6',
          },
        },
      };
    },
  },
  plugins: [
    [
      'client-redirects',
      /** @type {import('@docusaurus/plugin-client-redirects').Options} */
      ({
        redirects: [
          {
            from: '/guides',
            to: '/category/guides',
          },
        ],
      }),
    ],
  ],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        pages: false,
        blog: false,
        docs: {
          async sidebarItemsGenerator({defaultSidebarItemsGenerator, ...args}) {
            const sidebarItems = await defaultSidebarItemsGenerator(args);

            /** @type {typeof sidebarItems} */
            const apiSidebarItems = [];
            const categories = new Map();
            for (const item of sidebarItems) {
              assert(item.type === 'doc' && item.label);
              const [namespace] = item.label.split('.');
              if (!categories.has(namespace)) {
                categories.set(namespace, [item]);
              } else {
                categories.get(namespace).push(item);
              }
            }

            function addNamespace(namespace, target) {
              let items = categories.get(namespace);
              if (!items) {
                throw new Error(
                  `Namespace ${namespace} not found. Did you update the list of sidebar namespaces below?`
                );
              }
              items.sort((a, b) => {
                return a.label.localeCompare(b.label);
              });
              const main = items.find(item => {
                return item.label === namespace;
              });
              items = items.filter(item => {
                return item !== main;
              });
              target.push({
                type: 'category',
                label: namespace,
                items,
                link: main
                  ? {
                      type: 'doc',
                      id: main.id,
                    }
                  : undefined,
              });
              categories.delete(namespace);
            }

            if (args.item.dirName === 'browsers-api') {
              const order = [
                'launch',
                'install',
                'canDownload',
                'createProfile',
                'computeExecutablePath',
                'computeSystemExecutablePath',
                'detectBrowserPlatform',
                'resolveBuildId',
                'BrowserPlatform',
                'Browser',
                'CLI',
              ];
              const apiItem = sidebarItems.find(value => {
                return value.type === 'doc' && value.label === 'API';
              });
              apiSidebarItems.push({
                type: 'category',
                label: 'API',
                items: [],
                link: apiItem
                  ? {
                      type: 'doc',
                      id: apiItem.id,
                    }
                  : undefined,
              });
              const container = apiSidebarItems[apiSidebarItems.length - 1];
              for (const namespace of order) {
                addNamespace(namespace, container.items);
              }
            } else {
              const order = [
                // PuppeteerNode and Puppeteer go first as the entrypoints into
                // the Puppeteer API.
                'PuppeteerNode',
                'Puppeteer',
                'Browser',
                'BrowserContext',
                'Page',
                'WebWorker',
                'Accessibility',
                'Keyboard',
                'Mouse',
                'Touchscreen',
                'Tracing',
                'FileChooser',
                'Dialog',
                'ConsoleMessage',
                'Frame',
                'JSHandle',
                'ElementHandle',
                'HTTPRequest',
                'HTTPResponse',
                'SecurityDetails',
                'Target',
                'CDPSession',
                'Coverage',
                'TimeoutError',
                'EventEmitter',
              ];

              for (const namespace of order) {
                addNamespace(namespace, apiSidebarItems);
              }
            }
            const otherItems = [];
            apiSidebarItems.push({
              type: 'category',
              label: 'Other',
              items: otherItems,
              collapsed: true,
            });
            const remaining = Array.from(categories.keys());
            remaining.sort((a, b) => {
              return a.localeCompare(b);
            });
            for (const namespace of remaining) {
              if (namespace === 'API') {
                continue;
              }
              addNamespace(namespace, otherItems);
            }
            return apiSidebarItems;
          },
          path: DOC_PATH,
          routeBasePath: DOC_ROUTE_BASE_PATH,
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
      algolia: {
        appId: 'DVKY664LG7',
        apiKey: '4dac1ae64b623f1d33ae0b4ce0ff16a4',
        indexName: 'pptr',
      },
      navbar: {
        title: 'Puppeteer',
        logo: {
          alt: 'Puppeteer Logo',
          src: 'https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png',
        },
        items: [
          ...[
            {
              type: 'doc',
              docId: 'index',
              label: 'Docs',
            },
            {
              type: 'docSidebar',
              sidebarId: 'api',
              label: 'Puppeteer API',
            },
            {
              type: 'docSidebar',
              sidebarId: 'browsersApi',
              label: '@puppeteer/browsers API',
            },
          ].map(item => {
            return Object.assign(item, {position: 'left'});
          }),
          ...[
            {
              type: 'docsVersionDropdown',
              dropdownActiveClassDisabled: true,
              dropdownItemsAfter: [
                {
                  type: 'html',
                  value: '<hr class="dropdown-separator">',
                },
                {
                  type: 'html',
                  className: 'dropdown-archived-versions',
                  value: '<b>Archived versions</b>',
                },
                ...archivedVersions.map(version => {
                  const parts = version.split('.').map(item => {
                    return Number(item);
                  });
                  if (parts[0] <= 19 && parts[1] <= 2 && parts[2] <= 2) {
                    return {
                      label: version,
                      href: `https://github.com/puppeteer/puppeteer/blob/v${version}/docs/api/index.md`,
                    };
                  }
                  return {
                    label: version,
                    href: `https://github.com/puppeteer/puppeteer/blob/puppeteer-v${version}/docs/api/index.md`,
                  };
                }),
              ],
            },
            {
              href: 'https://github.com/puppeteer/puppeteer',
              className: 'header-github-link',
              'aria-label': 'GitHub repository',
            },
          ].map(item => {
            return Object.assign(item, {position: 'right'});
          }),
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/puppeteer',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/chromedevtools',
              },
              {
                label: 'YouTube',
                href: 'https://goo.gle/devtools-youtube',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Google, Inc.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    },
};

module.exports = config;
