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

// The scripts tries to create an appointment for CA DMV behind-the-wheels
// test within the specified date interval in the chosen office locations.
// Edit fields with appropriate information below.

const formData = {
  startDate: new Date('09/01/2017 00:00'),
  endDate: new Date('09/15/2017 23:00'),
  firstName: 'JOE',
  lastName: 'DOW',
  licenseId: 'Y1234567',
  birthDate: '01-31-1995',
  phone: '650-123-4567',
};

const locations = [
  'santa clara',
  'fremont',
  'san mateo',
  'san jose',
  'redwood city',
  'los gatos',
];
const timeout = 30; // seconds between retries.

// ===== Edit fields above this line

const Browser = require('../lib/Browser');
const browser = new Browser();

browser.newPage().then(async page => {
  await page.setViewport({width: 600, height: 1200});
  await iterate(page);
  browser.close();
});

async function iterate(page) {
  while (true) {
    for (const loc of locations) {
      try {
        const res = await fillForm(page, loc);
        if (res)
          return;
      } catch (e) {}
      console.log(`\nSleeping for ${timeout} sec...`);
      await sleep(timeout * 1e3);
    }
  }
}

async function fillForm(page, location) {
  await page.navigate('https://www.dmv.ca.gov/wasapp/foa/clear.do?goTo=driveTest&localeName=en');
  await sleep(500);
  await page.waitFor('.form-horizontal');
  formData.location = location;
  await page.evaluate(formData => {
    const offices = $('select#officeId option');
    let loc;
    for (let i = 0; i < offices.length; ++i) {
      const office = offices[i];
      if (office.text.toLowerCase() === formData.location.toLowerCase()) {
        loc = office.value;
        break;
      }
    }
    if (!loc)
      return;
    document.getElementById('officeId').value = loc;
    document.getElementById('DT').click();
    document.getElementById('first_name').value = formData.firstName;
    document.getElementById('last_name').value = formData.lastName;
    document.getElementById('dl_number').value = formData.licenseId;
    document.getElementsByName('birthMonth')[0].value = formData.birthDate.split('-')[0];
    document.getElementsByName('birthDay')[0].value = formData.birthDate.split('-')[1];
    document.getElementsByName('birthYear')[0].value = formData.birthDate.split('-')[2];
    document.getElementsByName('telArea')[0].value = formData.phone.split('-')[0];
    document.getElementsByName('telPrefix')[0].value = formData.phone.split('-')[1];
    document.getElementsByName('telSuffix')[0].value = formData.phone.split('-')[2];
  }, formData);

  await page.screenshot({path: 'dmv-filed-form.png'});

  // Sumbitting the form
  await page.evaluate(() => $('.form-horizontal input[type="submit"]').click());

  try {
    await page.waitFor('#ApptForm');
  } catch (e) {
    await page.screenshot({path: 'dmv-form-response.png'});
    console.log('Form data seems to be wrong. Please check the form response screenshot.');
    return true;
  }

  // Response is here. Check if the date works for us.
  const officeString = await page.evaluate(() => $('td[data-title="Office"] p').text());
  const dateString = await page.evaluate(() => $('td[data-title="Appointment"] strong').text());
  console.log(officeString);
  console.log(dateString);
  const date = new Date(dateString.replace(' at ', ' '));

  const withinRange = startDate <= date && date <= endDate;
  console.log(`Within range: ${withinRange}`);
  if (!withinRange) {
    await page.screenshot({path: 'dmv.png'});
    return false;
  }

  // Almost there. Confirm the appointment.
  await page.evaluate(() => $('form.form-horizontal[id="ApptForm"] input[type="submit"]').click());
  await sleep(500);
  await page.waitFor('#ApptForm');
  await page.screenshot({path: 'dmv-confirmation.png'});
  await page.evaluate(() => $('form.form-horizontal[id="ApptForm"] input[value="Confirm"]').click());
  await sleep(2000);
  await page.screenshot({path: 'dmv-confirmed.png'});
  return true;
}

async function sleep(timeout) {
  return new Promise(r => setTimeout(r, timeout));
}