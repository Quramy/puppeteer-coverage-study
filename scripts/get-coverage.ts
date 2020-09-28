import { launch } from 'puppeteer-core';
import pti from 'puppeteer-to-istanbul';

const EXECUTABLE_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const browser = await launch({
    headless: true,
    executablePath: EXECUTABLE_PATH,
  });
  const page = await browser.newPage();
  await page.coverage.startJSCoverage();
  await page.goto('http://localhost:8080')
  const results = await page.coverage.stopJSCoverage();
  console.log(JSON.stringify(results, null, 2));
  results.forEach(result => {
    console.log(result.url);
    result.ranges.forEach((range, i) => {
      console.log("#### Range", i + 1);
      console.log(result.text.slice(range.start, range.end));
    });
  });
  await page.close();
  await new Promise(res => setTimeout(res, 300));
  await browser.close();
  pti.write(results, {
    includeHostname: true,
    storagePath: './.nyc_output',
  });
}

main();
