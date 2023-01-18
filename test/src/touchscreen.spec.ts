   it('should report press', async () => {
     const {page, server} = getTestState();
     const iPhone = KnownDevices['iPhone 6']!;
+    await page.setViewport({
+      width: KnownDevices['iPhone 6'].viewport.width,
+      height: KnownDevices['iPhone 6'].viewport.height,
+      isMobile: true,
+      hasTouch: true,
+    });
     await page.emulate(iPhone);
-    await page.goto(server.PREFIX + '/input/touches.html');
-    await page.touchscreen.press(0, 0, 5);
+    await page.goto(server.PREFIX + '/input/touches-press.html');
+    await page.touchscreen.press(100, 100, 1000);
     expect(
       await page.evaluate(() => {
-        return (globalThis as any).getResult();
+        return (globalThis as any).timer;
       })
-    ).toEqual(['Touchstart: 0', 'Touchend: 0']);
+    ).toBe(1);
   });
 
   it('should report drag', async () => {
