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
              return value.type === 'category';
            });
            if (apiCategoryItem && apiCategoryItem.type === 'category') {
              apiCategoryItem.label = 'API';

              /** @type {typeof sidebarItems} */
              const newItems = [];
              for (const item of apiCategoryItem.items.sort((a, b) => {
                if ('label' in a && 'label' in b) {
                  return (a.label ?? '') < (b.label ?? '') ? -1 : 1;
                }
                return -1;
              })) {
                if ('id' in item) {
                  // @ts-ignore
                  const [namespace, object] = item.label.split('.');
                  const currentItem = newItems[newItems.length - 1];
                  if (
                    !currentItem ||
                    !('label' in currentItem) ||
                    currentItem.label !== namespace
                  ) {
                    if (object) {
                      newItems.push({
                        type: 'category',
                        // @ts-ignore
                        label: namespace,
                        items: [item],
                      });
                    } else {
                      newItems.push({
                        type: 'category',
                        // @ts-ignore
                        label: item.label,
                        items: [],
                        link: {type: 'doc', id: item.id},
                      });
                    }
                  } else {
                    if (object) {
                      // @ts-ignore
                      currentItem.items.push(item);
                    } else {
                      // @ts-ignore
                      currentItem.link = {type: 'doc', id: item.id};
                    }
                  }
                }
              }
              apiCategoryItem.items = newItems;
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
          },
          {
            type: 'search',
            position: 'right',
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
