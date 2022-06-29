<<<<<<< HEAD
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

=======
>>>>>>> a6789de1 (feat: add documentation)
// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const DOC_ROUTE_BASE_PATH = '/';
const DOC_PATH = '../docs';

<<<<<<< HEAD
=======
// Reverse the sidebar items ordering (including nested category items)
function reverseSidebarItems(items) {
  // Reverse items in categories
  const result = items.map(item => {
    if (item.type === 'category') {
      return {...item, items: reverseSidebarItems(item.items)};
    }
    return item;
  });
  // Reverse items at current level
  result.reverse();
  return result;
}

>>>>>>> a6789de1 (feat: add documentation)
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Puppeteer',
  tagline: 'Headless Chrome Node.js API',
<<<<<<< HEAD
  url: 'https://pptr.dev',
  baseUrl: '/',
  onBrokenLinks: 'warn',
=======
  url: 'https://puppeteer.github.io',
  baseUrl: '/puppeteer/',
  onBrokenLinks: 'throw',
>>>>>>> a6789de1 (feat: add documentation)
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
<<<<<<< HEAD
                  // @ts-ignore
                  const [namespace, object] = item.label.split('.');
                  const currentItem = newItems[newItems.length - 1];
                  if (
                    !currentItem || 
=======
                  const [, namespace, object] = item.id.split('.', 3);
                  const currentItem = newItems[newItems.length - 1];
                  if (
                    !currentItem ||
>>>>>>> a6789de1 (feat: add documentation)
                    !('label' in currentItem) ||
                    currentItem.label !== namespace
                  ) {
                    if (object) {
<<<<<<< HEAD
                      newItems.push({
                        type: 'category',
                        // @ts-ignore
=======
                      item.label = object;
                      newItems.push({
                        type: 'category',
>>>>>>> a6789de1 (feat: add documentation)
                        label: namespace,
                        items: [item],
                      });
                    } else {
                      newItems.push({
                        type: 'category',
<<<<<<< HEAD
                        // @ts-ignore
                        label: item.label,
=======
                        label: namespace,
>>>>>>> a6789de1 (feat: add documentation)
                        items: [],
                        link: {type: 'doc', id: item.id},
                      });
                    }
                  } else {
                    if (object) {
<<<<<<< HEAD
=======
                      item.label = object;
>>>>>>> a6789de1 (feat: add documentation)
                      // @ts-ignore
                      currentItem.items.push(item);
                    } else {
                      // @ts-ignore
                      currentItem.link = {type: 'doc', id: item.id};
                    }
                  }
                }
              }
<<<<<<< HEAD
              apiCategoryItem.items = newItems;
=======
              apiCategoryItem.items = reverseSidebarItems(newItems);
>>>>>>> a6789de1 (feat: add documentation)
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
            position: 'right'
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
        require.resolve("@easyops-cn/docusaurus-search-local"),
        {
          docsDir: DOC_PATH,
          docsRouteBasePath: DOC_ROUTE_BASE_PATH,
          hashed: true,
        },
      ],
    ],
};

module.exports = config;
