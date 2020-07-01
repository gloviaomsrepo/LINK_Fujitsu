'use strict';

var getConfig = require('@tridnguyen/config');

var opts = Object.assign({}, getConfig({
  baseUrl: 'https://fujitsu01-tech-prtnr-na01-dw.demandware.net/',
  suite: '*',
  reporter: 'spec',
  timeout: 60000,
  locale: 'x_default'
}, './config.json'));

module.exports = opts;
