/**
 * Copyright 2017 Google Inc., PhantomJS Authors All rights reserved.
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

'use strict'

const puppeteer = require('puppeteer')
const { existsSync } = require('fs')
const filePath = __dirname.split('\\').slice(0, 4).join('/')
const fileExitst = existsSync(`${pathFile}/logo.png`)

(async () => {
	const browser = await puppeteer.launch({ headless: false, args: ['--no-sanbox'] })
	const page = await browser.newPage()
	await page.goto('https://anonfiles.com', { waitUntil: 'networkidle2' })

	await page.waitForSelector('input[type="file"]')
	const input = await page.$('input[type="file"]')
	if (fileExitst) {
		await input.uploadFile(`${filePath}/logo.png`)
	}
})()
