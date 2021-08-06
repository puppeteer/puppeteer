/**
 * Copyright 2021 Google Inc. All rights reserved.
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
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Puppeteer documentation',
  tagline: 'Note: this documentation is WIP. Please use https://pptr.dev.',
  url: 'https://puppeteer.github.io/',
  baseUrl: '/puppeteer/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'ignore',
  favicon: 'img/favicon.ico',
  organizationName: 'puppeteer', // Usually your GitHub org/user name.
  projectName: 'puppeteer', // Usually your repo name.
  themeConfig: {
    hideableSidebar: true,
    navbar: {
      style: "primary",
      title: 'Puppeteer',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      hideOnScroll: true,
      items: [
        {
          to: 'docs/puppeteer.puppeteer',
          label: 'APIs',
          position: 'left',
        },
        {
          to: 'blog/contributing',
          label: 'Contribute',
          position: 'left',
        },
        {
          type: 'docsVersionDropdown',
        },
        {
          label: 'Github',
          href: 'https://github.com/puppeteer/puppeteer',
          position: 'right',
        },
        {
        label: 'Stack',
        href: 'https://stackoverflow.com/questions/tagged/puppeteer',
        position: 'right'
        },
        {
        label: 'Version 1.0',
        href: 'https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md',
        position: 'right'
        }
      ],
    },
    footer: {
      style: 'dark',
      links: [],
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/facebook/puppeteer/edit/main/website/',
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
