'use strict';
/* Script Modules */
var Site = require('dw/system/Site');
/*
var params = request.httpParameterMap;
var OAuthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
*/

var LOGGER = require('dw/system/Logger');
var Status = require('dw/system/Status');
var ServiceFactory = require('~/cartridge/scripts/util/ServiceFactory');
var GloviaOmFactory = require('~/cartridge/scripts/util/GloviaOmFactory');

function getToken() {
  var returnStatus;
  var sitePref = 'GLOVIAOM_ServiceName';
  var sitePrefGLOVIA = Site.getCurrent().getPreferences();
  var serviceFrameworkName = sitePrefGLOVIA.getCustom()[sitePref];
  var service = ServiceFactory.getServiceRegistry({
    serviceName: serviceFrameworkName,
    feature: GloviaOmFactory.FEATURES.TOKEN
  });
  var ServiceConfigVar = service.getConfiguration();
  var ServiceCredentialVar = ServiceConfigVar.getCredential();
  var ExtensibleObject = ServiceCredentialVar.getCustom();
  var requestDataContainer = 'grant_type=password'
    + '&client_id=' + ExtensibleObject.ClientId
	+ '&client_secret=' + ExtensibleObject.ClientSecret
	+ '&username=' + ServiceCredentialVar.getUser()
	+ '&password=' + ServiceCredentialVar.getPassword();
  var result = service.call(requestDataContainer);
  var responseObj;
  if (result.error !== 0 || result.errorMessage != null || result.mockResult) {
    responseObj = JSON.parse(result.object);
    returnStatus = new Status(Status.ERROR, GloviaOmFactory.STATUS_CODES.GENERAL.SUCCESS_ERROR);
    if (result && 'object' in result) {
      returnStatus.addDetail(GloviaOmFactory.STATUS_CODES.RESPONSE_OBJECT, result.object);
    }
  } else {
    responseObj = JSON.parse(result.object);
    LOGGER.debug('::responseObj=' + responseObj);
  }
  return responseObj;
}
module.exports = {
  getToken: getToken
};
