const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

puppeteer.use(StealthPlugin());

async function launchBrowser({ userDataDir, targetUrl, localServerPort, mainScriptFile }) {
  fs.mkdirSync(userDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
   });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  await page.evaluateOnNewDocument((localOrigin) => {
    window.__DEV_LOCAL_ORIGIN__ = localOrigin;
  }, `http://localhost:${localServerPort}/`);

  page.on('console', (msg) => {
    console.log(chalk.gray(`[page console] ${msg.text()}`));
  });
  page.on('pageerror', (err) => {
    console.log(chalk.red(`[page error] ${err.message}`));
  });

  console.log(chalk.cyan(`[browser] navigating to ${targetUrl}`));
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });

  console.log(chalk.yellow('[browser] if you are not logged in yet, log in manually in the Chrome window.'));

  await injectMainScript(page, localServerPort, mainScriptFile);

  return { browser, page };
}

async function injectMainScript(page, localServerPort, mainScriptFile) {
  const scriptUrl = `http://localhost:${localServerPort}/${mainScriptFile}?t=${Date.now()}`;
  console.log(chalk.cyan(`[browser] injecting ${mainScriptFile}...`));
  try {
    await page.evaluate(async (url) => {
      const res = await fetch(url, { cache: 'no-store' });
      const code = await res.text();
      (0, eval)(code);
    }, scriptUrl);
    console.log(chalk.green('[browser] script injected successfully.'));
  } catch (err) {
    console.log(chalk.red(`[browser] injection failed: ${err.message}`));
  }
}

async function reloadAndReinject(page, localServerPort, mainScriptFile) {
  console.log(chalk.magenta('[browser] reloading page...'));
  await page.reload({ waitUntil: 'networkidle2' });
  await injectMainScript(page, localServerPort, mainScriptFile);
}

module.exports = { launchBrowser, injectMainScript, reloadAndReinject };
