import { promises as fs } from "fs";
import path from "path";
import mkdirp from "mkdirp";
import { launch, CoverageEntry } from "puppeteer-core";
import libCov from "istanbul-lib-coverage";
import v8toIstanbul from "v8-to-istanbul";

const EXECUTABLE_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

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

async function convertIstanbulWithMap(
  results: (CoverageEntry & { rawScriptCoverage?: any })[],
  scriptBaseDir: string,
  srcBaseDir: string
) {
  const v8results = results.map(result => ({
    ...result
  }));
  const outs = await v8results.reduce(async (queue, result, i) => {
    const acc = await queue;
    const converter = v8toIstanbul(
      path.join(scriptBaseDir, "script" + i + ".js"),
      0,
      {
        source: result.text
      }
    );
    await converter.load();
    converter.applyCoverage(result.rawScriptCoverage.functions);
    const rawData = converter.toIstanbul();
    return [...acc, rawData];
  }, Promise.resolve([] as libCov.CoverageMapData[]));
  const cmap = outs.reduce((acc, rawData) => {
    rawData = Object.values(rawData).reduce(
      (acc, d) =>
        d.path.startsWith("/node_modules") || d.path.startsWith("/webpack")
          ? acc
          : {
              ...acc,
              [d.path]: {
                ...d,
                path:
                  path.isAbsolute(d.path) && !d.path.startsWith(srcBaseDir)
                    ? path.join(srcBaseDir, d.path)
                    : d.path
              }
            },
      {}
    );
    acc.merge(libCov.createCoverageMap(rawData));
    return acc;
  }, libCov.createCoverageMap());
  await fs.writeFile(
    "./.nyc_output/out.json",
    JSON.stringify(cmap.toJSON(), null, 2),
    "utf-8"
  );
}

async function main() {
  const browser = await launch({
    headless: true,
    executablePath: EXECUTABLE_PATH
  });
  const page = await browser.newPage();
  await page.coverage.startJSCoverage({
    includeRawScriptCoverage: true
  } as any);
  await page.goto("http://localhost:8080");
  await new Promise(res => setTimeout(res, 1000));
  const results = await page.coverage.stopJSCoverage();
  mkdirp.sync(".tmp");
  mkdirp.sync(".nyc_output");
  await fs.writeFile(
    ".tmp/puppeteer_coverage_data.json",
    JSON.stringify(results, null, 2)
  );
  await page.close();
  await browser.close();

  // showCoverage(results);
  await convertIstanbulWithMap(
    results,
    "projects/transpiled/dist",
    process.cwd()
  );
}

main();
