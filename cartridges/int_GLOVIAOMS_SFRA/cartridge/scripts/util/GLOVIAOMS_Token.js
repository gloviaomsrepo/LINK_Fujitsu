'use strict';
var params = request.httpParameterMap;

/* Script Modules */
var Site = require('dw/system/Site');
var OAuthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var LOGGER = require('dw/system/Logger');

function getToken(){
	var org = {};
	var sitePrefGLOVIA = Site.getCurrent().getPreferences();
	org.PROD_OR_SB = sitePrefGLOVIA.getCustom()["GLOVIA_InstanceType"]; /* For Production - login & For Sandbox - test*/
	org.clientId = sitePrefGLOVIA.getCustom()["GLOVIA_ClientId"];
	org.clientSecret = sitePrefGLOVIA.getCustom()["GLOVIA_ClientSecret"]; 
	org.username = sitePrefGLOVIA.getCustom()["GLOVIA_UserName"];
	org.password = sitePrefGLOVIA.getCustom()["GLOVIA_Password"];
	
	LOGGER.debug('PROD_OR_SB' + org.PROD_OR_SB +
			 ' clientId ' + org.clientId + 'clientSecret' + org.clientSecret +
			 ' org.username ' + org.username + 'org.username ' + org.username + 'org.password ' + org.password);
	
	org.access_token = "";
    org.instance_url = "";
    org.token_type = "";    
	var url = "https://"+org.PROD_OR_SB+".salesforce.com/services/oauth2/token";
	
	var http = new dw.net.HTTPClient();
	http.setTimeout(30000);
    http.open('POST', url);
    http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    var bData = "grant_type=password&client_id="+org.clientId+"&client_secret="+org.clientSecret+"&username="+org.username+"&password="+org.password+"";
    
    http.send(bData);
    
    var responseBody = http.getText();
    if (http.statusCode === 200 && responseBody) {
    	var data = JSON.parse(http.getText());
    	org.access_token = data.access_token;
        org.instance_url = data.instance_url;
        org.token_type = data.token_type;
    } else {
    	LOGGER.debug('Got an error calling:' + url +
                '. The status code is:' + http.statusCode + ' ,the text is:' + responseBody +
                ' and the error text is:' + http.getErrorText());
    }
    return org;    
};
//exports.GetToken.public = true;
module.exports = {
		getToken: getToken
	};
