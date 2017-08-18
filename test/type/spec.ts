import * as Puppeteer from 'index'

(async function () {
  const browser = await Puppeteer.launch({ headless: true, slowMo: 100 })
  const page = await browser.newPage()

  await page.addScriptTag('http://foo.bar')
  await page.click('.haha', { button: 'left', clickCount: 2, delay: 4 })
  await page.close()
  await page.emulate({
    viewport: { width: 100, height: 100 },
    userAgent: 'Google Chrome'
  })
  await page.evaluate('window.haha', 1, 2, '3', false)
  const result1 = await page.evaluate((foo: string) => ({ foo }), '2')
  result1.foo.charAt(2)

  await page.evaluateOnNewDocument('window.foo', 3, false, '2')
  const result2 = await page.evaluateOnNewDocument((foo: string) => ({ bar: foo }), '2')
  result2.bar.charAt(2)

  await page.exposeFunction('g', () => { console.info(1) })
  await page.focus('.input')
  const frames = await page.frames()
  frames.concat([])
  await page.goBack()
  await page.goBack({ timeout: 100, waitUntil: 'load' })
  await page.goForward()
  await page.goForward({ timeout: 200, waitUntil: 'networkidle', networkIdleInflight: 200 })
  await page.goto('https://www.google.com')
  await page.goto('https://www.google.com', { timeout: 200, waitUntil: 'networkidle', networkIdleInflight: 300 })
  await page.hover('.header')
  await page.injectFile(process.cwd() + '/node_modules/mocha/mocha.js')

  const keyboard = page.keyboard
  await keyboard.down('a')
  await keyboard.sendCharacter('😀😎')
  await keyboard.up('b')

  const frame = page.mainFrame()
  await frame.$('.ccc')
  await frame.addScriptTag('https://foo.bar')
  const childFrames = frame.childFrames()
  childFrames.concat([])
  frame.evaluate('window.haha', 1, 2, '3', false)
  const result3 = await frame.evaluate((foo: string) => ({ foo }), '2')
  result1.foo.charAt(2)
  await frame.injectFile('file:///foo')
  frame.isDetached()
  frame.name().charAt(2)
  frame.parentFrame()
  const title = await frame.title()
  title.charCodeAt(2)
  frame.uploadFile('.xxx', 'file:///ga')
  frame.url().substr(1, 2)
  await frame.waitFor('.foo')
  await frame.waitFor(() => Promise.resolve(2), {
    polling: 'raf'
  })
  await frame.waitFor(2)
  await frame.waitForFunction('foo', { timeout: 200 })
  await frame.waitForSelector('.header')

  const mouse = page.mouse

  await mouse.click(200, 100, { button: 'left', clickCount: 2 })
  await mouse.down()
  await mouse.up()
  await mouse.move(20, 100)

  page.on('console', (...args: string[]) => {
    console.info(args)
  })
  page.on('dialog', async (dialog) => {
    await dialog.accept('prompt text')
    dialog.defaultValue().trim()
    await dialog.dismiss()
    dialog.message().trim()
  })
  page.on('error', err => {
    console.log(err.stack)
  })
  page.on('frameattached', async (frame) => {
    await frame.injectFile('../file.txt')
  })
  page.on('framedetached', async (frame) => {
    await frame.$('.head')
  })
  page.on('framenavigated', async (frame) => {
    frame.parentFrame()
  })
  page.on('load', () => {
    console.info('load!')
  })
  page.on('pageerror', msg => {
    msg.trim()
  })
  page.on('request', req => {
    req.abort()
  })
  page.on('requestfailed', req => {
    req.continue()
  })
  page.on('response', res => {
    res.buffer().then(buffer => buffer.writeInt32LE(1, 2))
  })

  page.pdf({
    scale: 1
  }).then(buf => buf.buffer)

  const fullText = await page.plainText()
  fullText.trim()

  await page.press('foo')
  await page.screenshot()
  await page.screenshot({ type: 'jpeg' })
  await page.setContent('<span>111</span>')
  await page.setExtraHTTPHeaders({
    'request-id': 111
  })
  await page.setRequestInterceptionEnabled(true)
  await page.setUserAgent('Android Webkit')
  await page.setViewport({ width: 100, height: 200 })
  const title2 = await page.title()
  title2.trim()

  const tracing = page.tracing
  await tracing.start({ path: './log.txt' })
  await page.goto('https://www.google.com')
  await tracing.stop()

  await page.type('Foo', { delay: 100 })
  await page.uploadFile('.upload', 'file:///foo.txt')
  page.url().trim()
  const viewPort = page.viewport()
  viewPort.deviceScaleFactor
  viewPort.hasTouch
  viewPort.height
  viewPort.isLandscape
  viewPort.isMobile
  viewPort.width

  await page.waitFor('.selector')
  await page.waitForFunction(() => 1, {
    polling: 'mutation'
  })
  await page.waitForNavigation({ timeout: 100 })
  await page.waitForSelector('#id')

  const element = await page.$('s')
  await element.click('.class', { button: 'middle' })

  const result4 = await element.evaluate((foo: number) => foo + 1, 2)
  typeof result2 === 'number'

  await element.hover()
  await element.dispose()
})()
