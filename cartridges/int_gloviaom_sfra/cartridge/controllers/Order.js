'use strict';
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var server = require('server');
server.extend(module.superModule);
var GLOVIAOM = require('~/cartridge/scripts/GloviaOm');
var LOGGER = require('dw/system/Logger');


server.prepend('Confirm',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        if (req.currentCustomer.raw.isAuthenticated()) {
			var resData = GLOVIAOM.createOrderWithLines(req.querystring.ID);
        }
        next();
    });
module.exports = server.exports();
