'use strict';
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var GLOVIAOM = require('~/cartridge/scripts/GloviaOm');
var LOGGER = require('dw/system/Logger');
var server = require('server');
server.extend(module.superModule);


server.prepend('Confirm',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
      if (req.currentCustomer.raw.isAuthenticated()) {
        LOGGER.debug('::Order Confirm::');
        GLOVIAOM.createOrderWithLines(req.querystring.ID);
      }
      next();
    });

server.prepend('Details',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
      if (req.currentCustomer.raw.isAuthenticated()) {
        LOGGER.debug('::Order Details::');
        GLOVIAOM.createOrderWithLines(req.querystring.orderID);
      }
      next();
    });
module.exports = server.exports();
