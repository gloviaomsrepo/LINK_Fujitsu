'use strict';
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var server = require('server');
var GLOVIAOM = require('~/cartridge/scripts/GloviaOm');
var LOGGER = require('dw/system/Logger');
server.extend(module.superModule);


server.prepend('Details',
  server.middleware.https,
  consentTracking.consent,
  csrfProtection.generateToken,
  function (req, res, next) {
    if (req.currentCustomer.raw.isAuthenticated()) {
      LOGGER.debug('::Order Details::');
      LOGGER.debug('::req.querystring.orderID=' + req.querystring.orderID);
      LOGGER.debug('::req.currentCustomer.raw=' + req.currentCustomer.raw);
      GLOVIAOM.createOrderWithLines(req.querystring.orderID);
    }
    next();
  });

server.prepend('Confirm',
  server.middleware.https,
  consentTracking.consent,
  csrfProtection.generateToken,
  function (req, res, next) {
    if (req.currentCustomer.raw.isAuthenticated()) {
      GLOVIAOM.createOrderWithLines(req.querystring.ID);
    }
    next();
  });
module.exports = server.exports();
