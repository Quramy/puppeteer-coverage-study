# Puppeteer coverage study

PoC for collecting JavaScript coverages with Puppeteer and report them using Istanbul's reporter.

### Install

```sh
$ yarn
$ yarn patch:puppeteer
```

[FYI] We require to patch to Puppeteer's source to get full V8 coverage result. See also https://github.com/puppeteer/puppeteer/pull/6454 .

### Usage

Execute the following command:

```sh
$ yarn start "http://localhost:8080"
```

```txt
Open "http://localhost:8080" and collect coverage...
Process coverage for "http://localhost:8080/dist/main.js"...


-----------|---------|----------|---------|---------|-------------------
File       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------|---------|----------|---------|---------|-------------------
All files  |   85.71 |       50 |     100 |   85.71 |                   
 index.tsx |   85.71 |       50 |     100 |   85.71 | 11-13             
-----------|---------|----------|---------|---------|-------------------
```

This repo also includes some sample assets. For example, exec `cd projects/webpack; http-server`, then sample HTTP server runs with `http://localhost:8080` .

And `npm run report` outputs HTML report under `coverage` directory.
