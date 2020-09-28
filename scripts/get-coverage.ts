import { promises as fs } from 'fs';
import path from 'path';
import { launch, CoverageEntry } from 'puppeteer-core';
import pti from 'puppeteer-to-istanbul';
import libCov from 'istanbul-lib-coverage';
import v8toIstanbul from 'v8-to-istanbul';
import { fromMapFileSource } from 'convert-source-map';
import { SourceMapConsumer } from 'source-map';

const EXECUTABLE_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function showCoverage(results: CoverageEntry[]) {
  console.log(JSON.stringify(results, null, 2));
  results.forEach(result => {
    console.log(result.url);
    result.ranges.forEach((range, i) => {
      console.log("#### Range", i + 1);
      console.log(result.text.slice(range.start, range.end));
    });
  });
}

function convertIstanbul(results: CoverageEntry[]) {
  pti.write(results, {
    includeHostname: true,
    storagePath: './.nyc_output',
  });
}

async function convertIstanbulWithMap(results: CoverageEntry[]) {
  const v8results = results.map(result => ({
    ...result,
    functionName: '',
    ranges: result.ranges.map(range => ({
      startOffset: range.start,
      endOffset: range.end, 
      count: 1,
    })),
    isBlockCoverage: true,
  }))
  const outs = await v8results.reduce(async (queue, result, i) => {
    const acc = await queue;
    const smConverter = fromMapFileSource(result.text, 'projects/transpiled/dist')!;
    // const consumer = await new SourceMapConsumer(smConverter.sourcemap);
    const converter = v8toIstanbul('projects/transpiled/dist/script' + i + '.js', 0, {
      source: result.text,
      sourceMap: smConverter!,
    });
    await converter.load();
    converter.applyCoverage([result]);
    const rawData = converter.toIstanbul();
    return [...acc, rawData];
  }, Promise.resolve([] as libCov.CoverageMapData[]))
  const cmap = outs.reduce((acc, rawData) => {
    acc.merge(libCov.createCoverageMap(rawData));
    return acc;
  }, libCov.createCoverageMap());
  await fs.writeFile('./.nyc_output/out.json', JSON.stringify(cmap.toJSON(), null, 2), 'utf-8');
}

async function main() {

  const browser = await launch({
    headless: true,
    executablePath: EXECUTABLE_PATH,
  });
  const page = await browser.newPage();
  await page.coverage.startJSCoverage();
  await page.goto('http://localhost:8080')
  await new Promise(res => setTimeout(res, 1000));
  const results = await page.coverage.stopJSCoverage();
  await page.close();
  await browser.close();

  showCoverage(results);
  // convertIstanbul(results);
  await convertIstanbulWithMap(results);
}

main();
