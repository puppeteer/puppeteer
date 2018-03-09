process.send = process.send || function (text) {console.log(JSON.stringify(text))};

const puppeteer = require('puppeteer'),
  utils = require('utils');

let browser;


let runBot = async () => {

  let selectors = {
    "loginURL": "https://www.betfair.com/sport",
    "racesURL": "https://www.betfair.com/exchange/plus/horse-racing",
    "loginUsername": "#ssc-liu",
    "loginPassword": "#ssc-lipw",
    "loginButton": "#ssc-lis",
    "isLoggedin": "a.ssc-myau",
    "rememberMe": "#ssc-rmb",
    "account": "",
    "loop": ".meeting-item > ul > li > a",
    "parentSelector": ".meeting-item",
    "childSelector": ".meeting-label",
    "inPlaySelector": "span.inplay-icon",
    "racingURL": "https://www.betfair.com/exchange/plus/",
    "quickDeposit": ".quickdeposit-header-container",
    "depositClose": "#ssc-modal-container > div.ssc-modal-header > span"
  };

  if (process.argv.length < 3) {
    return Promise.reject("Invalid argument length = " + process.argv.length)

  } else {
    console.log(JSON.stringify(process.argv));
    selectors.account = JSON.parse(process.argv[2]).account;
  }


  browser = await puppeteer.launch({
    userDataDir: "localconfigs/" + selectors.account.username,
    slowMo: 150,
    ignoreHTTPSErrors: true,
    args: ['--disable-setuid-sandbox', '--no-sandbox', '--remote-debugging-address=0.0.0.0', '--remote-debugging-port=3030']
  });


  let endpoint = await require('../snippets/extractEndpoint.js')(browser);


  const page = await browser.newPage();
  await page.goto(selectors.loginURL);

  await page.waitFor(selectors.loginUsername);

  if (page.url().includes("maintenance")) {
    return Promise.reject("Maintenance error")
  }

  await page.addScriptTag({url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js'});
  await page.evaluate(function () {
    jq = $.noConflict(true)
  });

  let usernameDetails = await page.evaluate((selectors) => {
    return jq(selectors.loginUsername).val();
}, selectors);

  let isLoggedin = await page.evaluate((selectors) => {
    return jq(selectors.isLoggedin).length
  }, selectors);

  let needDeposit = await page.evaluate((selectors) => {
    return jq(selectors.quickDeposit).length;
}, selectors);

  if (isLoggedin < 1) {

    await page.waitFor(selectors.loginUsername);

    if (usernameDetails === selectors.account.username) {
    } else {
      await page.evaluate((selectors) => {
        jq(selectors.loginUsername).val("")
    }, selectors);
      await page.type(selectors.loginUsername, selectors.account.username);
    }

    await page.waitFor(selectors.loginPassword);
    await page.type(selectors.loginPassword, selectors.account.password);
    if (usernameDetails === selectors.account.username) {
    }
    else {
      await page.click(selectors.rememberMe)
    }

    await page.click(selectors.loginButton);

    await page.waitFor(selectors.isLoggedin).catch(err => {
      if (page.url().includes("INVALID_USERNAME_OR_PASSWORD")) {
      return Promise.reject("Incorrect Credentials")
    }
  });
  }

  if (needDeposit > 0) {
    page.click(selectors.depositClose)
  }

  await page.goto(selectors.racesURL);
  await page.waitForSelector(selectors.loop);

  await page.addScriptTag({url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js'});
  await page.addScriptTag({url: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.20.1/moment.js'});

  let races = await page.evaluate((selectors, utils) => {

    let result = [];

  $(selectors.loop).each(function () {
    let e = $(this);
    let venue = e.parents(selectors.parentSelector).find(selectors.childSelector).text().trim(),
      time = e.text().trim(),
      url = selectors.racingURL + e.attr('href').toString(),
      date = moment().format('YYYY-MM-DD').toString(),
      status = "ACTIVE";


    if (e.children(selectors.inPlaySelector).length > 0) {
      status = utils.status.IN_PROGRESS;
    }
    else {
      status = utils.status.ACTIVE;
    }

    result.push({
      "url": url,
      "event": {"time": time, "date": date, "venue": venue, "status": status},
      bookie: {"name": "betfair"}
    })

  });

  return result;

}, selectors, utils);


  let result = {
    "endpoint": endpoint,
    "urls": races
  };

  process.send(result);

};

runBot().catch(async (err) => {
  process.send(utils.handleError(err));
if (browser) await browser.close();
else process.exit(2);
});
