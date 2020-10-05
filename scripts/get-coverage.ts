import { promises as fs } from "fs";
import path from "path";
import mkdirp from "mkdirp";
import { launch, CoverageEntry } from "puppeteer-core";
import v8toIstanbul from "v8-to-istanbul";
import { fromSource, mapFileCommentRegex } from "convert-source-map";
import fetch from "node-fetch";
import libCov from "istanbul-lib-coverage";
import libReport from "istanbul-lib-report";

const EXECUTABLE_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const SCHEMA_REGEXP = /^([a-zA-Z][a-zA-Z\-\+\.\d]*):\/\//;

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

async function report(coverageMap: libCov.CoverageMap) {
  const configWatermarks: Record<string, [number, number]> = {
    statements: [50, 80],
    functions: [50, 80],
    branches: [50, 80],
    lines: [50, 80]
  };
  const context = libReport.createContext({
    dir: "coverage",
    defaultSummarizer: "nested",
    watermarks: configWatermarks,
    coverageMap
  });

  const report = require("istanbul-reports").create("text");

  report.execute(context);
}

async function convertIstanbulWithMap(
  results: (CoverageEntry & { rawScriptCoverage?: any })[]
) {
  mkdirp.sync(".nyc_output");
  const v8results = results.map(result => ({
    ...result
  }));
  const tmpDir = "./.nyc_output/src";
  const outs = await v8results.reduce(async (queue, result, i) => {
    console.log(`Process coverage for "${result.url}"...`);
    const acc = await queue;
    const transpiledScriptUrl = new URL(result.url);
    mkdirp.sync(path.dirname(path.join(tmpDir, transpiledScriptUrl.pathname)));
    const transpiledFilename = path.join(tmpDir, transpiledScriptUrl.pathname);
    await fs.writeFile(transpiledFilename, result.text, "utf-8");
    let sourceMap: any;
    const smConvertReulst = fromSource(result.text);
    if (!smConvertReulst) {
      const mappingUrl = mapFileCommentRegex.exec(
        result.text.slice(result.text.lastIndexOf("\n") + 1)
      )?.[1];
      if (mappingUrl && !mappingUrl.startsWith("http")) {
        const sourcemapFilePathname = path.resolve(
          path.dirname(transpiledScriptUrl.pathname),
          mappingUrl
        );
        const sourcemapFileUrl = new URL(transpiledScriptUrl.toJSON());
        sourcemapFileUrl.pathname = sourcemapFilePathname;
        try {
          const res = await fetch(sourcemapFileUrl.toJSON());
          const sourcemap = await res.json();
          sourceMap = { sourcemap };
        } catch {}
      }
    } else {
      sourceMap = smConvertReulst;
    }
    if (sourceMap) {
      const sourcemap = sourceMap.sourcemap;
      if (!sourcemap.sourcesContent) {
        await Promise.all(
          sourcemap.sources.map(async (srcPath: string) => {
            const srcUrl = new URL(transpiledScriptUrl.toJSON());
            srcUrl.pathname = path.resolve(
              path.dirname(transpiledScriptUrl.pathname),
              srcPath
            );
            const res = await fetch(srcUrl);
            const srcContent = await res.text();
            mkdirp.sync(path.dirname(path.join(tmpDir, srcUrl.pathname)));
            await fs.writeFile(
              path.join(tmpDir, srcUrl.pathname),
              srcContent,
              "utf-8"
            );
          })
        );
      } else {
        await Promise.all(
          sourcemap.sourcesContent.map(
            async (srcContent: string, i: number) => {
              const hit = sourcemap.sources[i].match(SCHEMA_REGEXP);
              const srcPathname = hit
                ? sourcemap.sources[i].slice(hit[0].length + 1)
                : path.resolve(
                    path.dirname(transpiledScriptUrl.pathname),
                    sourcemap.sources[i]
                  );
              if (
                srcPathname.startsWith("./node_modules") ||
                srcPathname.startsWith("webpack/")
              )
                return;
              const srcContentFilename = path.join(tmpDir, srcPathname);
              mkdirp.sync(path.dirname(srcContentFilename));
              await fs.writeFile(srcContentFilename, srcContent, "utf-8");
            }
          )
        );
      }
    }
    const converter = v8toIstanbul(transpiledFilename, 0, {
      source: result.text,
      sourceMap
    });
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
                  path.isAbsolute(d.path) && !d.path.startsWith(tmpDir)
                    ? path.join(tmpDir, d.path)
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
  return cmap;
}

async function main() {
  const targetUrl = process.argv.slice(2)[0] || "http://localhost:8080";
  console.log(`Open "${targetUrl}" and collect coverage...`);
  const browser = await launch({
    headless: true,
    executablePath: EXECUTABLE_PATH
  });
  const page = await browser.newPage();
  await page.coverage.startJSCoverage({
    includeRawScriptCoverage: true
  } as any);
  await page.goto(targetUrl);
  await new Promise(res => setTimeout(res, 1000));
  const results = await page.coverage.stopJSCoverage();
  mkdirp.sync(".tmp");
  await fs.writeFile(
    ".tmp/puppeteer_coverage_data.json",
    JSON.stringify(results, null, 2)
  );
  await page.close();
  await browser.close();

  // showCoverage(results);
  const cmap = await convertIstanbulWithMap(results);

  console.log();
  console.log();
  report(cmap);
}

main();
