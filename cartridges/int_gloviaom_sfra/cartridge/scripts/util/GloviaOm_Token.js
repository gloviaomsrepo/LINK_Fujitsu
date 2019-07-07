'use strict';
var params = request.httpParameterMap;

/* Script Modules */
var Site = require('dw/system/Site');
var OAuthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var LOGGER = require('dw/system/Logger');
var Status = require('dw/system/Status');
var ServiceFactory = require('~/cartridge/scripts/util/ServiceFactory');
var GloviaOmFactory = require('~/cartridge/scripts/util/GloviaOmFactory');

function getToken(){
	var sitePrefGLOVIA = Site.getCurrent().getPreferences();
	var serviceFrameworkName = sitePrefGLOVIA.getCustom()["GLOVIAOM_ServiceName"];
	
	// create service object using local registery
	var service = ServiceFactory.getServiceRegistry({
													serviceName : serviceFrameworkName,
													feature : GloviaOmFactory.FEATURES.TOKEN
												});
	var ServiceConfigVar = service.getConfiguration();
	var ServiceCredentialVar = ServiceConfigVar.getCredential();
	
	var ExtensibleObject = ServiceCredentialVar.getCustom();
	
	var requestDataContainer = "grant_type=password&client_id="+ExtensibleObject.ClientId+"&client_secret="+ExtensibleObject.ClientSecret+"&username="+ServiceCredentialVar.getUser()+"&password="+ServiceCredentialVar.getPassword();
    
	
	// make the call
	var result = service.call(requestDataContainer);
	var responseObj;
	//error case
	if (result.error != 0 || result.errorMessage != null || result.mockResult) {
		//setting response object in status
		responseObj = JSON.parse(result.object);
		returnStatus = new Status(Status.ERROR, GloviaOmFactory.STATUS_CODES.GENERAL.SUCCESS_ERROR);
		if(result && 'object' in result) {
			returnStatus.addDetail(GloviaOmFactory.STATUS_CODES.RESPONSE_OBJECT, result.object);
		}
	}else{
		//setting response object in status
		responseObj = JSON.parse(result.object);
	}
	return responseObj;   
};

module.exports = {
		getToken: getToken
	};
