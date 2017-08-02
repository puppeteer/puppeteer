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

let Browser = require('../lib/Browser');
let browser = new Browser();

browser.newPage().then(async page => {
  await page.setViewport({width: 400, height: 400});
  await page.setContent('<html><body><canvas id="surface"></canvas></body></html>');
  await page.evaluate(drawColorWheel);
  await page.screenshot({path: 'colorwheel.png'});
  browser.close();
});

function drawColorWheel() {
  let el = document.getElementById('surface'),
    context = el.getContext('2d'),
    width = window.innerWidth,
    height = window.innerHeight,
    cx = width / 2,
    cy = height / 2,
    radius = width  / 2.3,
    imageData,
    pixels,
    hue, sat, value,
    i = 0, x, y, rx, ry, d,
    f, g, p, u, v, w, rgb;

  el.width = width;
  el.height = height;
  imageData = context.createImageData(width, height);
  pixels = imageData.data;

  for (y = 0; y < height; y = y + 1) {
    for (x = 0; x < width; x = x + 1, i = i + 4) {
      rx = x - cx;
      ry = y - cy;
      d = rx * rx + ry * ry;
      if (d < radius * radius) {
        hue = 6 * (Math.atan2(ry, rx) + Math.PI) / (2 * Math.PI);
        sat = Math.sqrt(d) / radius;
        g = Math.floor(hue);
        f = hue - g;
        u = 255 * (1 - sat);
        v = 255 * (1 - sat * f);
        w = 255 * (1 - sat * (1 - f));
        pixels[i] = [255, v, u, u, w, 255, 255][g];
        pixels[i + 1] = [w, 255, 255, v, u, u, w][g];
        pixels[i + 2] = [u, u, w, 255, 255, v, u][g];
        pixels[i + 3] = 255;
      }
    }
  }

  context.putImageData(imageData, 0, 0);
  document.body.style.backgroundColor = 'white';
  document.body.style.margin = '0px';
}
