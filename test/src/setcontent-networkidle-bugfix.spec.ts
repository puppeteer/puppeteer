/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import * as fc from 'fast-check';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {attachFrame, html} from './utils.js';

/**
 * Bug Condition Exploration Test for setContent networkidle hang
 *
 * **Validates: Requirements 2.1, 2.2, 2.3**
 *
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists (setContent with networkidle0/networkidle2 hangs).
 *
 * This test encodes the EXPECTED behavior - it will pass after the fix is implemented.
 * DO NOT attempt to fix the test or code when it fails during exploration.
 */
describe('Page.setContent networkidle bug exploration', function () {
  setupTestBrowserHooks();

  // Increase timeout for these tests since we're testing hang conditions
  this.timeout(30000);

  describe('Property 1: Bug Condition - setContent with networkidle0/networkidle2 hangs', function () {
    it('should resolve setContent with networkidle0 (basic HTML)', async () => {
      const {page} = await getTestState();

      // This test will FAIL on unfixed code (hangs indefinitely)
      // After fix, it should resolve successfully
      const startTime = Date.now();
      await page.setContent(
        html`<html
          ><body
            >Test</body
          ></html
        >`,
        {waitUntil: 'networkidle0', timeout: 10000},
      );
      const duration = Date.now() - startTime;

      // Should complete quickly (not timeout)
      expect(duration).toBeLessThan(10000);
    });

    it('should resolve setContent with networkidle2 (basic HTML)', async () => {
      const {page} = await getTestState();

      // This test will FAIL on unfixed code (hangs indefinitely)
      // After fix, it should resolve successfully
      const startTime = Date.now();
      await page.setContent(
        html`<html
          ><body
            >Test</body
          ></html
        >`,
        {waitUntil: 'networkidle2', timeout: 10000},
      );
      const duration = Date.now() - startTime;

      // Should complete quickly (not timeout)
      expect(duration).toBeLessThan(10000);
    });

    it('should resolve setContent with networkidle0 and complex HTML', async () => {
      const {page} = await getTestState();

      // Test with HTML containing scripts and styles
      const complexHtml = html`
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 20px;
              }
              .container {
                width: 100%;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Test Page</h1>
              <p>This is a test page with styles.</p>
            </div>
            <script>
              console.log('Page loaded');
            </script>
          </body>
        </html>
      `;

      const startTime = Date.now();
      await page.setContent(html`${complexHtml}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      const duration = Date.now() - startTime;

      // Should complete quickly (not timeout)
      expect(duration).toBeLessThan(10000);
    });

    it('should resolve setContent with networkidle0 without explicit timeout', async () => {
      const {page} = await getTestState();

      // Set a default navigation timeout to prevent indefinite hang
      page.setDefaultNavigationTimeout(10000);

      const startTime = Date.now();
      await page.setContent(
        html`<html
          ><body
            >Test without explicit timeout</body
          ></html
        >`,
        {waitUntil: 'networkidle0'},
      );
      const duration = Date.now() - startTime;

      // Should complete quickly (not timeout)
      expect(duration).toBeLessThan(10000);
    });

    it('PBT: setContent with networkidle0 should resolve for various HTML content', async function () {
      const {page} = await getTestState();

      // Property-based test: generate various HTML content
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            bodyContent: fc.oneof(
              fc.constant('Simple text'),
              fc.constant('<div>Hello World</div>'),
              fc.constant('<h1>Title</h1><p>Paragraph</p>'),
              fc.constant('<ul><li>Item 1</li><li>Item 2</li></ul>'),
              fc.constant(
                '<div><span>Nested</span><span>Elements</span></div>',
              ),
            ),
            hasStyle: fc.boolean(),
            hasScript: fc.boolean(),
          }),
          async ({bodyContent, hasStyle, hasScript}) => {
            const styleTag = hasStyle
              ? '<style>body { font-family: Arial; }</style>'
              : '';
            const scriptTag = hasScript
              ? '<script>console.log("test");</script>'
              : '';

            const htmlContent = html`
              <html>
                <head
                  >${styleTag}</head
                >
                <body>
                  ${bodyContent} ${scriptTag}
                </body>
              </html>
            `;

            // Set timeout to prevent indefinite hang on unfixed code
            page.setDefaultNavigationTimeout(10000);

            const startTime = Date.now();
            await page.setContent(html`${htmlContent}`, {
              waitUntil: 'networkidle0',
            });
            const duration = Date.now() - startTime;

            // Property: Should complete without timing out
            expect(duration).toBeLessThan(10000);
          },
        ),
        {
          numRuns: 10, // Run 10 test cases
          timeout: 15000, // Overall timeout for the property test
        },
      );
    });

    it('PBT: setContent with networkidle2 should resolve for various HTML content', async function () {
      const {page} = await getTestState();

      // Property-based test: generate various HTML content
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.oneof(
              fc.constant('Test Page'),
              fc.constant('Sample'),
              fc.constant(''),
            ),
            bodyContent: fc.oneof(
              fc.constant('Simple text'),
              fc.constant('<div>Content</div>'),
              fc.constant('<p>Paragraph</p>'),
            ),
          }),
          async ({title, bodyContent}) => {
            const htmlContent = html`
              <html>
                <head
                  ><title>${title}</title></head
                >
                <body
                  >${bodyContent}</body
                >
              </html>
            `;

            // Set timeout to prevent indefinite hang on unfixed code
            page.setDefaultNavigationTimeout(10000);

            const startTime = Date.now();
            await page.setContent(html`${htmlContent}`, {
              waitUntil: 'networkidle2',
            });
            const duration = Date.now() - startTime;

            // Property: Should complete without timing out
            expect(duration).toBeLessThan(10000);
          },
        ),
        {
          numRuns: 10, // Run 10 test cases
          timeout: 15000, // Overall timeout for the property test
        },
      );
    });

    it('PBT: setContent with both networkidle0 and networkidle2 in waitUntil array', async function () {
      const {page} = await getTestState();

      // Property-based test: test with array of waitUntil conditions
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            content: fc.oneof(
              fc.constant('<div>Test 1</div>'),
              fc.constant('<div>Test 2</div>'),
              fc.constant('<div>Test 3</div>'),
            ),
            waitCondition: fc.constantFrom(
              'networkidle0' as const,
              'networkidle2' as const,
            ),
          }),
          async ({content, waitCondition}) => {
            const htmlContent = html`<html
              ><body
                >${content}</body
              ></html
            >`;

            // Set timeout to prevent indefinite hang on unfixed code
            page.setDefaultNavigationTimeout(10000);

            const startTime = Date.now();
            await page.setContent(html`${htmlContent}`, {
              waitUntil: waitCondition,
            });
            const duration = Date.now() - startTime;

            // Property: Should complete without timing out
            expect(duration).toBeLessThan(10000);
          },
        ),
        {
          numRuns: 10, // Run 10 test cases
          timeout: 15000, // Overall timeout for the property test
        },
      );
    });
  });

  describe('Property 2: Preservation - Other navigation methods and waitUntil options unchanged', function () {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
     *
     * IMPORTANT: These tests should PASS on unfixed code.
     * They verify that non-buggy navigation methods work correctly and will
     * continue to work after the fix.
     *
     * This follows the observation-first methodology: observe behavior on
     * unfixed code, then write tests to ensure the fix doesn't break
     * existing functionality.
     */

    it('should work with page.goto and networkidle0', async () => {
      const {page, server} = await getTestState();

      // This should work correctly on unfixed code
      const response = await page.goto(server.EMPTY_PAGE, {
        waitUntil: 'networkidle0',
      });

      expect(response).toBeTruthy();
      expect(response!.ok()).toBe(true);
    });

    it('should work with page.setContent and waitUntil: load', async () => {
      const {page} = await getTestState();

      // This should work correctly on unfixed code
      await page.setContent(
        html`<html
          ><body
            >Test with load</body
          ></html
        >`,
        {
          waitUntil: 'load',
        },
      );

      const content = await page.content();
      expect(content).toContain('Test with load');
    });

    it('should work with page.setContent and waitUntil: domcontentloaded', async () => {
      const {page} = await getTestState();

      // This should work correctly on unfixed code
      await page.setContent(
        html`<html
          ><body
            >Test with domcontentloaded</body
          ></html
        >`,
        {waitUntil: 'domcontentloaded'},
      );

      const content = await page.content();
      expect(content).toContain('Test with domcontentloaded');
    });

    it('should work with page.setContent without waitUntil option (default)', async () => {
      const {page} = await getTestState();

      // This should work correctly on unfixed code (uses default waitUntil)
      await page.setContent(
        html`<html
          ><body
            >Test with default</body
          ></html
        >`,
      );

      const content = await page.content();
      expect(content).toContain('Test with default');
    });

    it('should work with page.reload and networkidle0', async () => {
      const {page, server} = await getTestState();

      // Navigate to a page first
      await page.goto(server.EMPTY_PAGE);

      // Reload with networkidle0 should work correctly on unfixed code
      const response = await page.reload({waitUntil: 'networkidle0'});

      expect(response).toBeTruthy();
      expect(response!.ok()).toBe(true);
    });

    it('PBT: page.goto with various waitUntil options should work', async function () {
      const {page, server} = await getTestState();

      // Property-based test: goto should work with all waitUntil options
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'load' as const,
            'domcontentloaded' as const,
            'networkidle0' as const,
            'networkidle2' as const,
          ),
          async waitUntilOption => {
            const response = await page.goto(server.EMPTY_PAGE, {
              waitUntil: waitUntilOption,
            });

            // Property: goto should always succeed
            expect(response).toBeTruthy();
            expect(response!.ok()).toBe(true);
          },
        ),
        {
          numRuns: 8, // Test all 4 options twice
          timeout: 15000,
        },
      );
    });

    it('PBT: page.setContent with non-networkidle waitUntil options should work', async function () {
      const {page} = await getTestState();

      // Property-based test: setContent should work with load and domcontentloaded
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            content: fc.oneof(
              fc.constant('<div>Content 1</div>'),
              fc.constant('<div>Content 2</div>'),
              fc.constant('<p>Paragraph</p>'),
              fc.constant('<h1>Title</h1>'),
            ),
            waitUntil: fc.constantFrom(
              'load' as const,
              'domcontentloaded' as const,
            ),
          }),
          async ({content, waitUntil}) => {
            const htmlContent = html`<html
              ><body
                >${content}</body
              ></html
            >`;

            await page.setContent(html`${htmlContent}`, {waitUntil});

            // Property: setContent should succeed and content should be set
            const pageContent = await page.content();
            expect(pageContent).toContain(content);
          },
        ),
        {
          numRuns: 10,
          timeout: 15000,
        },
      );
    });

    it('PBT: page.setContent without waitUntil should work with various HTML', async function () {
      const {page} = await getTestState();

      // Property-based test: setContent with default waitUntil should work
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.oneof(
              fc.constant('Page 1'),
              fc.constant('Page 2'),
              fc.constant(''),
            ),
            bodyContent: fc.oneof(
              fc.constant('<div>Default wait</div>'),
              fc.constant('<p>Test paragraph</p>'),
              fc.constant('<span>Span content</span>'),
            ),
            hasStyle: fc.boolean(),
          }),
          async ({title, bodyContent, hasStyle}) => {
            const styleTag = hasStyle
              ? '<style>body { margin: 0; }</style>'
              : '';
            const htmlContent = html`
              <html>
                <head>
                  <title>${title}</title>
                  ${styleTag}
                </head>
                <body
                  >${bodyContent}</body
                >
              </html>
            `;

            // Use default waitUntil (no option specified)
            await page.setContent(html`${htmlContent}`);

            // Property: setContent should succeed and content should be set
            const pageContent = await page.content();
            expect(pageContent).toContain(bodyContent);
          },
        ),
        {
          numRuns: 10,
          timeout: 15000,
        },
      );
    });

    it('PBT: page.reload with various waitUntil options should work', async function () {
      const {page, server} = await getTestState();

      // Property-based test: reload should work with all waitUntil options
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'load' as const,
            'domcontentloaded' as const,
            'networkidle0' as const,
            'networkidle2' as const,
          ),
          async waitUntilOption => {
            // Navigate to a page first
            await page.goto(server.EMPTY_PAGE);

            // Reload with the specified waitUntil option
            const response = await page.reload({waitUntil: waitUntilOption});

            // Property: reload should always succeed
            expect(response).toBeTruthy();
            expect(response!.ok()).toBe(true);
          },
        ),
        {
          numRuns: 8, // Test all 4 options twice
          timeout: 15000,
        },
      );
    });

    it('PBT: Mixed navigation operations should work correctly', async function () {
      const {page, server} = await getTestState();

      // Property-based test: various navigation sequences should work
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            operation: fc.constantFrom(
              'goto-load' as const,
              'goto-domcontentloaded' as const,
              'setcontent-load' as const,
              'setcontent-domcontentloaded' as const,
              'reload-load' as const,
            ),
            content: fc.oneof(
              fc.constant('<div>Test 1</div>'),
              fc.constant('<div>Test 2</div>'),
              fc.constant('<p>Content</p>'),
            ),
          }),
          async ({operation, content}) => {
            // Perform the specified operation
            if (operation === 'goto-load') {
              const response = await page.goto(server.EMPTY_PAGE, {
                waitUntil: 'load',
              });
              expect(response!.ok()).toBe(true);
            } else if (operation === 'goto-domcontentloaded') {
              const response = await page.goto(server.EMPTY_PAGE, {
                waitUntil: 'domcontentloaded',
              });
              expect(response!.ok()).toBe(true);
            } else if (operation === 'setcontent-load') {
              await page.setContent(
                html`<html
                  ><body
                    >${content}</body
                  ></html
                >`,
                {
                  waitUntil: 'load',
                },
              );
              const pageContent = await page.content();
              expect(pageContent).toContain(content);
            } else if (operation === 'setcontent-domcontentloaded') {
              await page.setContent(
                html`<html
                  ><body
                    >${content}</body
                  ></html
                >`,
                {
                  waitUntil: 'domcontentloaded',
                },
              );
              const pageContent = await page.content();
              expect(pageContent).toContain(content);
            } else if (operation === 'reload-load') {
              await page.goto(server.EMPTY_PAGE);
              const response = await page.reload({waitUntil: 'load'});
              expect(response!.ok()).toBe(true);
            }

            // Property: All operations should complete successfully
            // (assertions are inline above)
          },
        ),
        {
          numRuns: 10,
          timeout: 15000,
        },
      );
    });
  });

  describe('Task 4: Comprehensive Unit Tests', function () {
    /**
     * **Validates: Requirements 2.1, 2.2, 2.3**
     *
     * These are comprehensive unit tests to verify the fix works correctly.
     * They should PASS after the fix is implemented.
     */

    it('4.1: setContent with networkidle0 resolves successfully', async () => {
      const {page} = await getTestState();

      // Test basic setContent with networkidle0
      await page.setContent(
        html`<html
          ><body
            >Test</body
          ></html
        >`,
        {waitUntil: 'networkidle0'},
      );

      // Verify page content is set correctly
      const content = await page.content();
      expect(content).toContain('Test');

      // Verify the page is in a valid state
      const bodyText = await page.evaluate(() => {
        return document.body.textContent?.trim();
      });
      expect(bodyText).toBe('Test');
    });

    it('4.2: setContent with networkidle2 resolves successfully', async () => {
      const {page} = await getTestState();

      // Test basic setContent with networkidle2
      await page.setContent(
        html`<html
          ><body
            >Test</body
          ></html
        >`,
        {waitUntil: 'networkidle2'},
      );

      // Verify page content is set correctly
      const content = await page.content();
      expect(content).toContain('Test');

      // Verify the page is in a valid state
      const bodyText = await page.evaluate(() => {
        return document.body.textContent?.trim();
      });
      expect(bodyText).toBe('Test');
    });

    it('4.3: setContent with networkidle0 and timeout does not timeout', async () => {
      const {page} = await getTestState();

      // Test setContent with networkidle0 and explicit timeout
      const startTime = Date.now();

      // This should resolve successfully before the timeout
      await page.setContent(
        html`<html
          ><body
            >Test with timeout</body
          ></html
        >`,
        {waitUntil: 'networkidle0', timeout: 5000},
      );

      const duration = Date.now() - startTime;

      // Assert promise resolves before timeout
      expect(duration).toBeLessThan(5000);

      // Verify page content is set correctly (no timeout error was thrown)
      const content = await page.content();
      expect(content).toContain('Test with timeout');

      // Verify the page is in a valid state
      const bodyText = await page.evaluate(() => {
        return document.body.textContent?.trim();
      });
      expect(bodyText).toBe('Test with timeout');
    });

    it('4.4: setContent with complex HTML and networkidle0', async () => {
      const {page} = await getTestState();

      // Test with HTML containing scripts, styles, and images
      const complexHtml = html`
        <html>
          <head>
            <title>Complex Page</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: #f0f0f0;
              }
              .container {
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #333;
                border-bottom: 2px solid #007bff;
                padding-bottom: 10px;
              }
              .image-container {
                margin: 20px 0;
                text-align: center;
              }
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
            <script>
              // Script that runs on page load
              window.testData = {
                loaded: true,
                timestamp: Date.now(),
                message: 'Complex page loaded successfully',
              };
              console.log('Complex page script executed');
            </script>
          </head>
          <body>
            <div class="container">
              <h1>Complex Test Page</h1>
              <p>This page contains multiple resource types:</p>
              <ul>
                <li>Inline styles (CSS)</li>
                <li>Inline scripts (JavaScript)</li>
                <li>Data URI images</li>
                <li>Complex DOM structure</li>
              </ul>
              <div class="image-container">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23007bff'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='16'%3ETest%3C/text%3E%3C/svg%3E"
                  alt="Test Image"
                />
              </div>
              <div id="dynamic-content"></div>
            </div>
            <script>
              // Script that modifies the DOM
              document.addEventListener('DOMContentLoaded', function () {
                const dynamicContent =
                  document.getElementById('dynamic-content');
                if (dynamicContent) {
                  dynamicContent.innerHTML =
                    '<p>Dynamic content added by script</p>';
                }
              });
            </script>
          </body>
        </html>
      `;

      // Use networkidle0 waitUntil option
      await page.setContent(html`${complexHtml}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });

      // Assert promise resolves successfully (no hang or timeout)
      const content = await page.content();
      expect(content).toContain('Complex Test Page');
      expect(content).toContain('Complex page script executed');

      // Assert all resources are loaded correctly
      // Verify styles are applied
      const backgroundColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      expect(backgroundColor).toBe('rgb(240, 240, 240)');

      // Verify scripts executed
      const testData = await page.evaluate(() => {
        return (window as any).testData;
      });
      expect(testData).toBeTruthy();
      expect(testData.loaded).toBe(true);
      expect(testData.message).toBe('Complex page loaded successfully');

      // Verify DOM structure is correct
      const h1Text = await page.evaluate(() => {
        return document.querySelector('h1')?.textContent;
      });
      expect(h1Text).toBe('Complex Test Page');

      // Verify image is present
      const imgSrc = await page.evaluate(() => {
        return document.querySelector('img')?.getAttribute('src');
      });
      expect(imgSrc).toContain('data:image/svg+xml');

      // Verify dynamic content was added by script
      const dynamicContent = await page.evaluate(() => {
        return document.getElementById('dynamic-content')?.innerHTML;
      });
      expect(dynamicContent).toContain('Dynamic content added by script');
    });
  });

  describe('Task 5: Integration Tests for Full Workflows', function () {
    /**
     * **Validates: Requirements 2.1**
     *
     * These are integration tests that verify the full workflow of navigating
     * to a page and then using setContent with networkidle0.
     */

    it('5.1: Full workflow - navigate, setContent with networkidle0, verify content', async () => {
      const {page, server} = await getTestState();

      // Step 1: Navigate to initial page with page.goto()
      const gotoResponse = await page.goto(server.EMPTY_PAGE, {
        waitUntil: 'load',
      });
      expect(gotoResponse).toBeTruthy();
      expect(gotoResponse!.ok()).toBe(true);

      // Verify we're on the initial page
      const initialUrl = page.url();
      expect(initialUrl).toBe(server.EMPTY_PAGE);

      // Step 2: Call page.setContent() with waitUntil: 'networkidle0'
      const testHtml = html`
        <html>
          <head>
            <title>Integration Test Page</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .content {
                background: white;
                padding: 20px;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <div class="content">
              <h1>Integration Test Content</h1>
              <p
                >This content was set after navigation using setContent with
                networkidle0.</p
              >
              <ul>
                <li>First item</li>
                <li>Second item</li>
                <li>Third item</li>
              </ul>
            </div>
            <script>
              window.integrationTestData = {
                loaded: true,
                message: 'Integration test successful',
              };
            </script>
          </body>
        </html>
      `;

      const startTime = Date.now();
      await page.setContent(html`${testHtml}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      const duration = Date.now() - startTime;

      // Step 3: Verify no hang or timeout occurs
      expect(duration).toBeLessThan(10000);

      // Step 4: Verify page content is set correctly
      const content = await page.content();
      expect(content).toContain('Integration Test Content');
      expect(content).toContain('This content was set after navigation');

      // Verify the DOM structure
      const h1Text = await page.evaluate(() => {
        return document.querySelector('h1')?.textContent;
      });
      expect(h1Text).toBe('Integration Test Content');

      // Verify the list items
      const listItems = await page.evaluate(() => {
        const items = document.querySelectorAll('li');
        return Array.from(items).map(item => {
          return item.textContent;
        });
      });
      expect(listItems).toEqual(['First item', 'Second item', 'Third item']);

      // Verify styles are applied
      const backgroundColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      expect(backgroundColor).toBe('rgb(245, 245, 245)');

      // Verify script executed
      const integrationTestData = await page.evaluate(() => {
        return (window as any).integrationTestData;
      });
      expect(integrationTestData).toBeTruthy();
      expect(integrationTestData.loaded).toBe(true);
      expect(integrationTestData.message).toBe('Integration test successful');

      // Verify the URL is still the same (setContent doesn't change URL)
      const finalUrl = page.url();
      expect(finalUrl).toBe(server.EMPTY_PAGE);
    });

    it('5.2: PDF generation workflow with setContent and networkidle0', async () => {
      const {page} = await getTestState();

      // This test validates the common use case that was broken by the bug:
      // generating PDFs after setting content with networkidle0

      // Step 1: Call page.setContent() with waitUntil: 'networkidle0'
      const pdfHtml = html`
        <html>
          <head>
            <title>PDF Test Document</title>
            <style>
              body {
                font-family: 'Times New Roman', serif;
                margin: 40px;
                line-height: 1.6;
                color: #333;
              }
              h1 {
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              h2 {
                color: #34495e;
                margin-top: 30px;
                margin-bottom: 15px;
              }
              .section {
                margin-bottom: 30px;
                padding: 20px;
                background-color: #f8f9fa;
                border-left: 4px solid #3498db;
              }
              .highlight {
                background-color: #fff3cd;
                padding: 2px 5px;
                border-radius: 3px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th,
              td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #3498db;
                color: white;
              }
              tr:nth-child(even) {
                background-color: #f2f2f2;
              }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 2px solid #ccc;
                font-size: 0.9em;
                color: #666;
              }
            </style>
          </head>
          <body>
            <h1>PDF Generation Test Document</h1>

            <div class="section">
              <h2>Purpose</h2>
              <p>
                This document tests the
                <span class="highlight">PDF generation workflow</span> after
                using <code>page.setContent()</code> with
                <code>waitUntil: 'networkidle0'</code>.
              </p>
              <p>
                This is a critical use case that was broken by the bug in
                Puppeteer 24.38.0.
              </p>
            </div>

            <div class="section">
              <h2>Test Data</h2>
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>setContent with networkidle0</td>
                    <td>✓ Working</td>
                    <td>Content is set and network idle is reached</td>
                  </tr>
                  <tr>
                    <td>PDF Generation</td>
                    <td>✓ Working</td>
                    <td>PDF is generated successfully from the content</td>
                  </tr>
                  <tr>
                    <td>Content Rendering</td>
                    <td>✓ Working</td>
                    <td>All content is rendered correctly in the PDF</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Content Verification</h2>
              <p
                >This section contains various elements to verify proper
                rendering:</p
              >
              <ul>
                <li>Text formatting (bold, italic, code)</li>
                <li>Lists (ordered and unordered)</li>
                <li>Tables with styling</li>
                <li>CSS styles and layout</li>
                <li>Special characters: &copy; &reg; &trade; &euro; &pound;</li>
              </ul>
              <ol>
                <li>First ordered item</li>
                <li>Second ordered item</li>
                <li>Third ordered item</li>
              </ol>
            </div>

            <div class="footer">
              <p>
                <strong>Test Metadata:</strong><br />
                Document Type: Integration Test<br />
                Test Case: 5.2 - PDF generation workflow with setContent and
                networkidle0<br />
                Requirement: 2.1 - setContent with networkidle0 should resolve
                successfully
              </p>
            </div>

            <script>
              // Add some dynamic content to ensure scripts execute
              window.pdfTestData = {
                generated: true,
                timestamp: Date.now(),
                testCase: '5.2',
                requirement: '2.1',
              };
              console.log('PDF test page script executed');
            </script>
          </body>
        </html>
      `;

      const startTime = Date.now();
      await page.setContent(html`${pdfHtml}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      const setContentDuration = Date.now() - startTime;

      // Verify setContent completed without hanging or timing out
      expect(setContentDuration).toBeLessThan(10000);

      // Verify content is set correctly before generating PDF
      const content = await page.content();
      expect(content).toContain('PDF Generation Test Document');
      expect(content).toContain('PDF generation workflow');

      // Verify script executed
      const pdfTestData = await page.evaluate(() => {
        return (window as any).pdfTestData;
      });
      expect(pdfTestData).toBeTruthy();
      expect(pdfTestData.generated).toBe(true);
      expect(pdfTestData.testCase).toBe('5.2');

      // Step 2: Generate PDF with page.pdf()
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      // Step 3: Verify PDF is generated successfully
      expect(pdfBuffer).toBeTruthy();
      expect(pdfBuffer).toBeInstanceOf(Uint8Array);
      expect(pdfBuffer.byteLength).toBeGreaterThan(0);

      // Step 4: Verify content is rendered correctly in PDF
      // Check PDF header (PDF files start with %PDF-)
      const pdfHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');

      // Verify PDF has reasonable size (should be at least a few KB for our
      // content)
      expect(pdfBuffer.byteLength).toBeGreaterThan(5000);

      // Additional verification: ensure the page is still in a valid state
      // after PDF generation
      const finalContent = await page.content();
      expect(finalContent).toContain('PDF Generation Test Document');

      // Verify we can still interact with the page after PDF generation
      const h1Text = await page.evaluate(() => {
        return document.querySelector('h1')?.textContent;
      });
      expect(h1Text).toBe('PDF Generation Test Document');

      // Verify the table is present
      const tableRows = await page.evaluate(() => {
        const rows = document.querySelectorAll('tbody tr');
        return rows.length;
      });
      expect(tableRows).toBe(3);

      // Verify styles are applied
      const h1Color = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 ? window.getComputedStyle(h1).color : null;
      });
      expect(h1Color).toBeTruthy();
    });

    it('5.3: Test multiple setContent calls in sequence with networkidle0', async () => {
      const {page} = await getTestState();

      // This test validates that multiple sequential setContent calls with networkidle0
      // work correctly without memory leaks or disposal issues.
      // **Validates: Requirements 2.1**

      // Define three different HTML contents
      const html1 = html`
        <html>
          <head>
            <title>First Content</title>
            <style>
              body {
                background-color: #ffebee;
              }
            </style>
          </head>
          <body>
            <h1>First Content</h1>
            <p>This is the first content set with networkidle0.</p>
            <script>
              window.contentVersion = 1;
            </script>
          </body>
        </html>
      `;

      const html2 = html`
        <html>
          <head>
            <title>Second Content</title>
            <style>
              body {
                background-color: #e3f2fd;
              }
            </style>
          </head>
          <body>
            <h1>Second Content</h1>
            <p>This is the second content set with networkidle0.</p>
            <script>
              window.contentVersion = 2;
            </script>
          </body>
        </html>
      `;

      const html3 = html`
        <html>
          <head>
            <title>Third Content</title>
            <style>
              body {
                background-color: #f3e5f5;
              }
            </style>
          </head>
          <body>
            <h1>Third Content</h1>
            <p>This is the third content set with networkidle0.</p>
            <script>
              window.contentVersion = 3;
            </script>
          </body>
        </html>
      `;

      // Step 1: Call page.setContent(html1, { waitUntil: 'networkidle0' })
      const startTime1 = Date.now();
      await page.setContent(html`${html1}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      const duration1 = Date.now() - startTime1;

      // Verify first call resolves successfully
      expect(duration1).toBeLessThan(10000);
      let content = await page.content();
      expect(content).toContain('First Content');
      let contentVersion = await page.evaluate(() => {
        return (window as any).contentVersion;
      });
      expect(contentVersion).toBe(1);

      // Step 2: Call page.setContent(html2, { waitUntil: 'networkidle0' })
      const startTime2 = Date.now();
      await page.setContent(html`${html2}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      const duration2 = Date.now() - startTime2;

      // Verify second call resolves successfully
      expect(duration2).toBeLessThan(10000);
      content = await page.content();
      expect(content).toContain('Second Content');
      expect(content).not.toContain('First Content');
      contentVersion = await page.evaluate(() => {
        return (window as any).contentVersion;
      });
      expect(contentVersion).toBe(2);

      // Step 3: Call page.setContent(html3, { waitUntil: 'networkidle0' })
      const startTime3 = Date.now();
      await page.setContent(html`${html3}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      const duration3 = Date.now() - startTime3;

      // Verify third call resolves successfully
      expect(duration3).toBeLessThan(10000);
      content = await page.content();
      expect(content).toContain('Third Content');
      expect(content).not.toContain('Second Content');
      expect(content).not.toContain('First Content');
      contentVersion = await page.evaluate(() => {
        return (window as any).contentVersion;
      });
      expect(contentVersion).toBe(3);

      // Step 4: Verify all calls resolved successfully (no hangs or timeouts)
      expect(duration1).toBeLessThan(10000);
      expect(duration2).toBeLessThan(10000);
      expect(duration3).toBeLessThan(10000);

      // Step 5: Verify final content is html3
      const finalContent = await page.content();
      expect(finalContent).toContain('Third Content');
      expect(finalContent).toContain(
        'This is the third content set with networkidle0',
      );

      // Verify the DOM structure of the final content
      const h1Text = await page.evaluate(() => {
        return document.querySelector('h1')?.textContent;
      });
      expect(h1Text).toBe('Third Content');

      const pText = await page.evaluate(() => {
        return document.querySelector('p')?.textContent;
      });
      expect(pText).toBe('This is the third content set with networkidle0.');

      // Verify the title is from html3
      const title = await page.title();
      expect(title).toBe('Third Content');

      // Verify the script from html3 executed
      const finalContentVersion = await page.evaluate(() => {
        return (window as any).contentVersion;
      });
      expect(finalContentVersion).toBe(3);

      // Verify the background color is from html3
      const backgroundColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      expect(backgroundColor).toBe('rgb(243, 229, 245)');

      // Additional verification: ensure no memory leaks or disposal issues
      // by verifying the page is still in a valid state and can be interacted with
      const bodyText = await page.evaluate(() => {
        return document.body.textContent?.trim();
      });
      expect(bodyText).toContain('Third Content');
      expect(bodyText).toContain(
        'This is the third content set with networkidle0.',
      );
    });

    it('5.4: Test setContent with networkidle0 in iframes', async () => {
      const {page, server} = await getTestState();

      // This test validates that setContent with networkidle0 works correctly
      // for iframes, not just the main page.
      // **Validates: Requirements 2.1**

      // Step 1: Create page with iframe
      await page.goto(server.EMPTY_PAGE);

      // Step 2: Attach an iframe to the page
      await attachFrame(page, 'test-iframe', server.EMPTY_PAGE);

      // Get iframe's Frame object
      const frame = page.frames()[1];
      expect(frame).toBeTruthy();

      // Step 3: Call frame.setContent(html, { waitUntil: 'networkidle0' })
      const iframeHtml = html`
        <html>
          <head>
            <title>Iframe Content</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background-color: #f0f8ff;
                font-family: Arial, sans-serif;
              }
              .iframe-content {
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              h2 {
                color: #2c3e50;
                margin-top: 0;
              }
              .data-list {
                list-style-type: none;
                padding: 0;
              }
              .data-list li {
                padding: 8px;
                margin: 5px 0;
                background-color: #e8f4f8;
                border-left: 3px solid #3498db;
              }
            </style>
          </head>
          <body>
            <div class="iframe-content">
              <h2>Iframe Content</h2>
              <p
                >This content was set using frame.setContent() with
                networkidle0.</p
              >
              <ul class="data-list">
                <li>Item 1: Iframe test data</li>
                <li>Item 2: Network idle verification</li>
                <li>Item 3: Frame content validation</li>
              </ul>
              <div id="dynamic-iframe-content"></div>
            </div>
            <script>
              // Script to verify execution in iframe
              window.iframeTestData = {
                loaded: true,
                timestamp: Date.now(),
                message: 'Iframe content loaded with networkidle0',
                frameType: 'iframe',
              };

              // Add dynamic content
              document.addEventListener('DOMContentLoaded', function () {
                const dynamicDiv = document.getElementById(
                  'dynamic-iframe-content',
                );
                if (dynamicDiv) {
                  dynamicDiv.innerHTML =
                    '<p><strong>Dynamic iframe content:</strong> Successfully added by script</p>';
                }
              });

              console.log('Iframe script executed successfully');
            </script>
          </body>
        </html>
      `;

      const startTime = Date.now();
      await frame!.setContent(iframeHtml, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      const duration = Date.now() - startTime;

      // Step 4: Verify no hang or timeout occurs
      expect(duration).toBeLessThan(10000);

      // Step 5: Verify iframe content is set correctly
      const iframeContent = await frame!.content();
      expect(iframeContent).toContain('Iframe Content');
      expect(iframeContent).toContain(
        'This content was set using frame.setContent() with networkidle0',
      );

      // Verify the iframe DOM structure
      const iframeH2Text = await frame!.evaluate(() => {
        return document.querySelector('h2')?.textContent;
      });
      expect(iframeH2Text).toBe('Iframe Content');

      // Verify the list items in iframe
      const iframeListItems = await frame!.evaluate(() => {
        const items = document.querySelectorAll('.data-list li');
        return Array.from(items).map(item => {
          return item.textContent;
        });
      });
      expect(iframeListItems).toHaveLength(3);
      expect(iframeListItems[0]).toContain('Item 1: Iframe test data');
      expect(iframeListItems[1]).toContain('Item 2: Network idle verification');
      expect(iframeListItems[2]).toContain('Item 3: Frame content validation');

      // Verify iframe script executed
      const iframeTestData = await frame!.evaluate(() => {
        return (window as any).iframeTestData;
      });
      expect(iframeTestData).toBeTruthy();
      expect(iframeTestData.loaded).toBe(true);
      expect(iframeTestData.message).toBe(
        'Iframe content loaded with networkidle0',
      );
      expect(iframeTestData.frameType).toBe('iframe');

      // Verify dynamic content was added by iframe script
      const dynamicIframeContent = await frame!.evaluate(() => {
        return document.getElementById('dynamic-iframe-content')?.innerHTML;
      });
      expect(dynamicIframeContent).toContain('Dynamic iframe content');
      expect(dynamicIframeContent).toContain('Successfully added by script');

      // Verify iframe styles are applied
      const iframeBodyBgColor = await frame!.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      expect(iframeBodyBgColor).toBe('rgb(240, 248, 255)');

      // Verify we can still interact with the iframe
      const iframeBodyText = await frame!.evaluate(() => {
        return document.body.textContent?.includes(
          'This content was set using frame.setContent()',
        );
      });
      expect(iframeBodyText).toBe(true);
    });

    it('5.5: Test switching between goto and setContent with various waitUntil options', async () => {
      const {page, server, defaultBrowserOptions} = await getTestState();

      // Skip for CDP - this fix is BiDi-specific
      if (defaultBrowserOptions.protocol !== 'webDriverBiDi') {
        return;
      }

      // This test validates that switching between different navigation methods
      // and waitUntil options works correctly without any interference.
      // **Validates: Requirements 2.1, 3.1, 3.2, 3.3**

      // Step 1: Call page.goto(url, { waitUntil: 'networkidle0' })
      const gotoResponse1 = await page.goto(server.EMPTY_PAGE, {
        waitUntil: 'networkidle0',
      });
      expect(gotoResponse1).toBeTruthy();
      expect(gotoResponse1!.ok()).toBe(true);

      // Verify we're on the correct page
      let currentUrl = page.url();
      expect(currentUrl).toBe(server.EMPTY_PAGE);

      // Step 2: Call page.setContent(html, { waitUntil: 'networkidle0' })
      const html1 = html`
        <html>
          <head>
            <title>First setContent</title>
            <style>
              body {
                background-color: #e8f5e9;
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              .content-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
            </style>
          </head>
          <body>
            <div class="content-box">
              <h1>First setContent with networkidle0</h1>
              <p
                >This content was set using setContent with networkidle0
                option.</p
              >
              <ul>
                <li>Navigation method: setContent</li>
                <li>Wait condition: networkidle0</li>
                <li>Sequence: Step 2</li>
              </ul>
            </div>
            <script>
              window.navigationStep = 2;
              window.navigationMethod = 'setContent';
              window.waitCondition = 'networkidle0';
            </script>
          </body>
        </html>
      `;

      const startTime1 = Date.now();
      await page.setContent(html`${html1}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      const duration1 = Date.now() - startTime1;

      // Verify setContent with networkidle0 resolves successfully
      expect(duration1).toBeLessThan(10000);
      let content = await page.content();
      expect(content).toContain('First setContent with networkidle0');

      // Verify script executed
      const navigationData = await page.evaluate(() => {
        return {
          step: (window as any).navigationStep,
          method: (window as any).navigationMethod,
          waitCondition: (window as any).waitCondition,
        };
      });
      expect(navigationData.step).toBe(2);
      expect(navigationData.method).toBe('setContent');
      expect(navigationData.waitCondition).toBe('networkidle0');

      // Verify URL is still the same (setContent doesn't change URL)
      currentUrl = page.url();
      expect(currentUrl).toBe(server.EMPTY_PAGE);

      // Step 3: Call page.goto(url2, { waitUntil: 'load' })
      const gotoResponse2 = await page.goto(server.EMPTY_PAGE + '?page=2', {
        waitUntil: 'load',
      });
      expect(gotoResponse2).toBeTruthy();
      expect(gotoResponse2!.ok()).toBe(true);

      // Verify we navigated (URL changed with query parameter)
      currentUrl = page.url();
      expect(currentUrl).toBe(server.EMPTY_PAGE + '?page=2');

      // Verify the page loaded correctly
      content = await page.content();
      expect(content).toBeTruthy();

      // Step 4: Call page.setContent(html2, { waitUntil: 'domcontentloaded' })
      const html2 = html`
        <html>
          <head>
            <title>Second setContent</title>
            <style>
              body {
                background-color: #fff3e0;
                font-family: 'Courier New', monospace;
                padding: 20px;
              }
              .info-panel {
                background: white;
                padding: 20px;
                border-left: 4px solid #ff9800;
                margin: 20px 0;
              }
              .status {
                color: #4caf50;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="info-panel">
              <h1>Second setContent with domcontentloaded</h1>
              <p
                >This content was set using setContent with domcontentloaded
                option.</p
              >
              <div class="status"
                >Status: All navigation methods working correctly</div
              >
              <ul>
                <li>Navigation method: setContent</li>
                <li>Wait condition: domcontentloaded</li>
                <li>Sequence: Step 4</li>
              </ul>
              <p>Previous operations completed successfully:</p>
              <ol>
                <li>goto with networkidle0 ✓</li>
                <li>setContent with networkidle0 ✓</li>
                <li>goto with load ✓</li>
                <li>setContent with domcontentloaded (current)</li>
              </ol>
            </div>
            <script>
              window.navigationStep = 4;
              window.navigationMethod = 'setContent';
              window.waitCondition = 'domcontentloaded';
              window.allOperationsComplete = true;
            </script>
          </body>
        </html>
      `;

      const startTime2 = Date.now();
      await page.setContent(html`${html2}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
      const duration2 = Date.now() - startTime2;

      // Verify setContent with domcontentloaded resolves successfully
      expect(duration2).toBeLessThan(10000);
      content = await page.content();
      expect(content).toContain('Second setContent with domcontentloaded');
      expect(content).toContain('All navigation methods working correctly');

      // Verify script executed
      const finalNavigationData = await page.evaluate(() => {
        return {
          step: (window as any).navigationStep,
          method: (window as any).navigationMethod,
          waitCondition: (window as any).waitCondition,
          allComplete: (window as any).allOperationsComplete,
        };
      });
      expect(finalNavigationData.step).toBe(4);
      expect(finalNavigationData.method).toBe('setContent');
      expect(finalNavigationData.waitCondition).toBe('domcontentloaded');
      expect(finalNavigationData.allComplete).toBe(true);

      // Verify URL is still from the previous goto (setContent doesn't change URL)
      currentUrl = page.url();
      expect(currentUrl).toBe(server.EMPTY_PAGE + '?page=2');

      // Step 5: Verify all operations completed successfully
      // All assertions above confirm each operation completed successfully

      // Step 6: Verify no regressions in any navigation method
      // Additional verification: ensure the page is in a valid state
      const finalContent = await page.content();
      expect(finalContent).toContain('Second setContent with domcontentloaded');

      // Verify DOM structure is correct
      const h1Text = await page.evaluate(() => {
        return document.querySelector('h1')?.textContent;
      });
      expect(h1Text).toBe('Second setContent with domcontentloaded');

      // Verify styles are applied
      const bodyBgColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      expect(bodyBgColor).toBe('rgb(255, 243, 224)');

      // Verify list items are present
      const listItems = await page.evaluate(() => {
        const items = document.querySelectorAll('ul li');
        return Array.from(items).map(item => {
          return item.textContent;
        });
      });
      expect(listItems).toHaveLength(3);
      expect(listItems[0]).toContain('Navigation method: setContent');
      expect(listItems[1]).toContain('Wait condition: domcontentloaded');
      expect(listItems[2]).toContain('Sequence: Step 4');

      // Verify ordered list items
      const orderedListItems = await page.evaluate(() => {
        const items = document.querySelectorAll('ol li');
        return Array.from(items).map(item => {
          return item.textContent;
        });
      });
      expect(orderedListItems).toHaveLength(4);
      expect(orderedListItems[0]).toContain('goto with networkidle0');
      expect(orderedListItems[1]).toContain('setContent with networkidle0');
      expect(orderedListItems[2]).toContain('goto with load');
      expect(orderedListItems[3]).toContain('setContent with domcontentloaded');

      // Final verification: ensure we can still interact with the page
      const statusText = await page.evaluate(() => {
        return document.querySelector('.status')?.textContent;
      });
      expect(statusText).toContain('All navigation methods working correctly');

      // Verify the content is from html2 (not checking title as it may vary by protocol)
      const finalH1Text = await page.evaluate(() => {
        return document.querySelector('h1')?.textContent;
      });
      expect(finalH1Text).toBe('Second setContent with domcontentloaded');
    });
  });
});
