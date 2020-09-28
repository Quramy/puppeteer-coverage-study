declare module "puppeteer-to-istanbul" {
  import { CoverageEntry } from 'puppeteer-core';
  interface PTI {
    write(entries: CoverageEntry[], {
       includeHostname: boolean,
       storagePath: string,
    }): void;
  }
  const pti: PTI;
  export default pti;
}
