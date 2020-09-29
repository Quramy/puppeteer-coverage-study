# Puppeteer coverage study

### Install

```sh
$ npm i
$ npm run patch:puppeteer
```

[FYI] We require to patch to Puppeteer's source to get full V8 coverage result. See also https://github.com/puppeteer/puppeteer/pull/6454 .

### Run sample HTTP server

```sh
$ cd projects/transpiled
$ http-server
```

### Collect coverage

```sh
$ npm start
$ npm run report
$ open coverage/index.html
```
