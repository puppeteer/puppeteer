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

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const archivedVersions = require('./versionsArchived.json');

const DOC_ROUTE_BASE_PATH = '/';
const DOC_PATH = '../docs';

const GitHubIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path fill="currentcolor" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7
     1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 
     3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 
     2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3"/>
  </svg>
`;

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
            const apiCategoryItem = sidebarItems.find(value => {
              return value.type === 'category' && value.label === 'API';
            });
            if (apiCategoryItem) {
              /** @type {typeof sidebarItems} */
              const newItems = [];
              const categories = new Map();
              for (const item of apiCategoryItem.items) {
                const [namespace] = item.label.split('.');
                if (!categories.has(namespace)) {
                  categories.set(namespace, [item]);
                } else {
                  categories.get(namespace).push(item);
                }
              }

              const order = [
                // PuppeteerNode and Puppeteer go first as the entrypoints into
                // the Puppeteer API.
                'PuppeteerNode',
                'Puppeteer',
                'BrowserFetcher',
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

              function addNamespace(namespace, target) {
                let items = categories.get(namespace);
                if (!items) {
                  throw new Error(`Namespace ${namespace} not found`);
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
              for (const namespace of order) {
                addNamespace(namespace, newItems);
              }
              const otherItems = [];
              newItems.push({
                type: 'category',
                label: 'Other',
                items: otherItems,
              });
              const remaining = Array.from(categories.keys());
              remaining.sort((a, b) => {
                return a.localeCompare(b);
              });
              for (const namespace of remaining) {
                addNamespace(namespace, otherItems);
              }
              apiCategoryItem.items = newItems;
              apiCategoryItem.collapsed = false;
            }
            const guidesCategory = sidebarItems.find(value => {
              return value.type === 'category' && value.label === 'Guides';
            });
            if (guidesCategory) {
              guidesCategory.collapsed = false;
            }
            return sidebarItems;
          },
          path: DOC_PATH,
          routeBasePath: DOC_ROUTE_BASE_PATH,
          sidebarPath: require.resolve('./sidebars.json'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Puppeteer',
        logo: {
          alt: 'Puppeteer Logo',
          src: 'https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png',
        },
        items: [
          {
            type: 'docsVersionDropdown',
            position: 'right',
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
                return {
                  label: version,
                  href: `https://github.com/puppeteer/puppeteer/blob/v${version}/docs/api/index.md`,
                };
              }),
            ],
          },
          {
            type: 'search',
            position: 'right',
          },
          {
            href: 'https://github.com/puppeteer/puppeteer',
            position: 'right',
            className: 'navbar__link--github',
            'aria-label': 'GitHub repository',
            html: GitHubIcon,
          },
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
          {
            title: 'Useful',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/puppeteer/puppeteer',
              },
              {
                label: 'Changelog',
                href: 'https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer/CHANGELOG.md',
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
    }),
  themes: [
    // ... Your other themes.
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        docsDir: DOC_PATH,
        docsRouteBasePath: DOC_ROUTE_BASE_PATH,
        hashed: true,
      },
    ],
  ],
};

module.exports = config;
