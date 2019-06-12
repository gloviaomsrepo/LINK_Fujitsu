'use strict';
/* Script Modules */
var server = require('server');
var OAuthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var TOKEN = require('~/cartridge/scripts/util/GLOVIAOMS_Token');
var LOGGER = require('dw/system/Logger');

function createOrderWithLines(orderNo){	
    
	var orderInfo = OrderMgr.getOrder(orderNo);
	
	/***********Customer Detail -START***********/
	var customerNo = orderInfo.customer.profile.customerNo;
	var customerDetailJSON ='';
	customerDetailJSON += '"giic_Account__c" : "'+customerNo+'",';
	customerDetailJSON += '"giic_Source__c" : "Online Sale",';
	/***********Customer Detail -END***********/
	
	/***********Billing Addres -Start***********/
	var billingAddress = orderInfo.getBillingAddress();
	var billingAddressJSON ='';
	billingAddressJSON += '"giic_BillingStreet__c" : "'+billingAddress.address1+'",';
	billingAddressJSON += '"giic_BillingCity__c" : "'+billingAddress.city+'",';
	billingAddressJSON += '"giic_BillingStateProvince__c" : "'+billingAddress.stateCode+'",';
	billingAddressJSON += '"giic_BillingCountry__c" : "'+billingAddress.countryCode+'",';
	billingAddressJSON += '"giic_BillingZipPostalCode__c" : "'+billingAddress.postalCode+'",';
	/***********Billing Addres -END***********/
	
	/***********Shipping Addres -Start***********/
	var ShipAddressFromShipments = orderInfo.getShipments();
	var shippingAddressJSON ='';
	for each(  i in ShipAddressFromShipments)
	{
		var shippingAddress = i.getShippingAddress();
		shippingAddressJSON += '"giic_ShipToStreet__c" : "'+shippingAddress.address1+'",';
		shippingAddressJSON += '"giic_ShipToCity__c" : "'+shippingAddress.city+'",';
		shippingAddressJSON += '"giic_ShipToStateProvince__c" : "'+shippingAddress.stateCode+'",';
		shippingAddressJSON += '"giic_ShipToCountry__c" : "'+shippingAddress.countryCode+'",';
		shippingAddressJSON += '"giic_ShipToZipPostalCode__c" : "'+shippingAddress.postalCode+'",';
		break;		
	}	
	/***********Billing Addres -END***********/
	
	/************Shipping Charge -START***************/
	var Shipments = orderInfo.getShipments();
	var shipmentsJSON = '';
	if (Shipments.size() > 0) {
		shipmentsJSON ='"records": [';
		for each(shipment in Shipments) {			
			var shippingMethod = shipment.getShippingMethod();
			shipmentsJSON += '{' +
				'       "attributes": {' +
				'       "type": "gii__SalesOrderLineStaging__c",' +
				'        "referenceId": "' + shippingMethod.getID()+ '"' +
				'     },';
			shipmentsJSON += ' "giic_ShippingId__c": "' + shippingMethod.getID() + '"';
			shipmentsJSON += ',"giic_ShippingDescription__c":"' + shippingMethod.getDescription() + '"';
			shipmentsJSON += ',"giic_ShippingUnitPrice__c":"' + shipment.getShippingTotalPrice() + '"';
			shipmentsJSON += ',"giic_Shipping_Tax__c":"' + shipment.getShippingTotalTax() + '"';
			shipmentsJSON += '},';
		}
	}
	/************Shipping Charge -END***************/
	
	/***********Order Lines -START***********/
	var orderLines = orderInfo.getProductLineItems();
	var productLinesJSON='';
    if (orderLines.size() > 0){
    	for(var i=0;i<orderLines.size();i++){
    		if(i > 0){
    			productLinesJSON += ',';
    		}
    		var total_price = orderLines[i].price+orderLines[i].tax;
			productLinesJSON +='{'
								 +'       "attributes": {'
								   +'       "type": "gii__SalesOrderLineStaging__c",'
								  +'        "referenceId": "'+ orderLines[i].orderItem.itemID + '"'
								   +'     },';
			productLinesJSON += '"giic_ProductSKU__c": "'+orderLines[i].product.UPC+'","giic_OrderQuantity__c":"'+ orderLines[i].quantity+ '","giic_UnitPrice__c":"'+orderLines[i].price+'"';
			productLinesJSON += ',"giic_LineNo__c":"'+orderLines[i].orderItem.itemID  +'"';
																																						productLinesJSON += ',"giic_TaxAmount__c":"'+orderLines[i].tax  +'"';
																																						productLinesJSON += ',"giic_LineDescription__c":"'+orderLines[i].productName  +'"';
																																						productLinesJSON += ',"giic_ProductAmount__c":"'+total_price+'"';                                                                                                     
			LOGGER.debug("::order::"+orderLines[i].product.UPC);
			productLinesJSON += '}';
    	}    	
    }
	var shipmentAndLines = shipmentsJSON + productLinesJSON + ']';
	/***********Order Lines -END***********/
		
	var body = '{'
		+ '"records": ['
		+ '{'
		+ '"attributes": {'
			+ '"type": "gii__SalesOrderStaging__c",'
		    + '"referenceId": "'+orderNo+'" '
		+ '},'
		+ customerDetailJSON
		+ billingAddressJSON
		+ shippingAddressJSON
		+'	"giic_OrderNumber__c":"'+orderNo+'",'
		+' "SalesOrderLineStagings__r": {'
			  +	shipmentAndLines
		+' }} ]}';
			  
	
	var resData = "";
	
	var org = TOKEN.getToken();
	var url = org.instance_url + '/services/data/v43.0/composite/tree/gii__SalesOrderStaging__c';
    var http = new dw.net.HTTPClient();
    http.setTimeout(30000);
	http.open('POST', url);
	http.setRequestHeader('Content-Type', 'application/json');
	http.setRequestHeader('Authorization', org.token_type + ' ' + org.access_token);
	
	
	
	http.send(body);
    var responseBody = http.getText();
	
	if (http.statusCode >= 200 && http.statusCode < 300 && responseBody) {
		data = JSON.parse(http.getText());
		return  JSON.stringify(data);		
	} else {
		LOGGER.debug('Got an error calling:' + url +
				 '. The status code is:' + http.statusCode + ' ,the text is:' + responseBody +
				 ' and the error text is:' + http.getErrorText());
	}
	return resData;
};
//exports.GetToken.public = true;
module.exports = {
	createOrderWithLines: createOrderWithLines
};