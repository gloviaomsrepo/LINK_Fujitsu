'use strict';
/* Script Modules */
var OrderMgr = require('dw/order/OrderMgr');
var TOKEN = require('~/cartridge/scripts/util/GloviaOm_Token');
var LOGGER = require('dw/system/Logger');
var Status = require('dw/system/Status');
var ServiceFactory = require('~/cartridge/scripts/util/ServiceFactory');
var GloviaOmFactory = require('~/cartridge/scripts/util/GloviaOmFactory');
var Site = require('dw/system/Site');

function createOrderWithLines(orderNo) {
  var orderInfo = OrderMgr.getOrder(orderNo);
  var customerNo = orderInfo.customer.profile.customerNo;
  var customerDetailJSON = '';
  var billingAddress = orderInfo.getBillingAddress();
  var billingAddressJSON = '';
  var ShipAddressFromShipments = orderInfo.getShipments();
  var shippingAddressJSON = '';
  var Shipments = orderInfo.getShipments();
  var shipmentsJSON = '';
  var orderLines = orderInfo.getProductLineItems();
  var productLinesJSON = '';
  var i = 0;
  var shippingAddress = '';
  var shippingMethod = '';
  var shipment;
  var totalPrice;
  var productLineItem;
  var shipmentAndLines = '';
  var body = '';
  var resData = '';
  var org = TOKEN.getToken();
  var sitePref = Site.getCurrent().getPreferences();
  var serviceFrameworkName = sitePref.getCustom().GLOVIAOM_ServiceName;
  var service = ServiceFactory.getServiceRegistry({
    serviceName: serviceFrameworkName,
    feature: GloviaOmFactory.FEATURES.ORDER_CREATE
  });
  var result;
  var responseObj;
  var returnStatus;

  /** *********Customer Detail -START***********/
  customerDetailJSON += '"giic_Account__c" : "' + customerNo + '",';
  customerDetailJSON += '"giic_Source__c" : "Online Sale",';
  /** *********Customer Detail -END***********/

  /** *********Billing Addres -Start***********/
  billingAddressJSON += '"giic_BillingStreet__c" : "' + billingAddress.address1 + '",';
  billingAddressJSON += '"giic_BillingCity__c" : "' + billingAddress.city + '",';
  billingAddressJSON += '"giic_BillingStateProvince__c" : "' + billingAddress.stateCode + '",';
  billingAddressJSON += '"giic_BillingCountry__c" : "' + billingAddress.countryCode + '",';
  billingAddressJSON += '"giic_BillingZipPostalCode__c" : "' + billingAddress.postalCode + '",';
  /** *********Billing Addres -END***********/

  /** *********Shipping Addres -Start***********/

  for (i = 0; i < ShipAddressFromShipments.size(); i++) {
    shippingAddress = ShipAddressFromShipments[i].getShippingAddress();
    shippingAddressJSON += '"giic_ShipToStreet__c" : "' + shippingAddress.address1 + '",';
    shippingAddressJSON += '"giic_ShipToCity__c" : "' + shippingAddress.city + '",';
    shippingAddressJSON += '"giic_ShipToStateProvince__c" : "' + shippingAddress.stateCode + '",';
    shippingAddressJSON += '"giic_ShipToCountry__c" : "' + shippingAddress.countryCode + '",';
    shippingAddressJSON += '"giic_ShipToZipPostalCode__c" : "' + shippingAddress.postalCode + '",';
    break;
  }
  /** *********Billing Addres -END***********/

  /** **********Shipping Charge -START***************/
  if (Shipments.size() > 0) {
    shipmentsJSON = '"records": [';
    i = 0;
    for (i = 0; i < Shipments.size(); i++) {
      shipment = Shipments[i];
      shippingMethod = shipment.getShippingMethod();
      shipmentsJSON += '{' +
      '       "attributes": {' +
      '       "type": "gii__SalesOrderLineStaging__c",' +
      '        "referenceId": "' + shippingMethod.getID() + '"' +
      '     },';
      shipmentsJSON += ' "giic_ShippingId__c": "' + shippingMethod.getID() + '"';
      shipmentsJSON += ',"giic_ShippingDescription__c":"' + shippingMethod.getDescription() + '"';
      shipmentsJSON += ',"giic_ShippingUnitPrice__c":"' + shipment.getShippingTotalPrice() + '"';
      shipmentsJSON += ',"giic_Shipping_Tax__c":"' + shipment.getShippingTotalTax() + '"';
      shipmentsJSON += '},';
    }
  }
  /** **********Shipping Charge -END***************/

  /** *********Order Lines -START***********/
  if (orderLines.size() > 0) {
    for (i = 0; i < orderLines.size(); i++) {
      if (i > 0) {
        productLinesJSON += ',';
      }
      totalPrice = orderLines[i].price + orderLines[i].tax;
      productLineItem = orderLines[i];
      productLinesJSON += '{'
      + '       "attributes": {'
      + '       "type": "gii__SalesOrderLineStaging__c",'
      + '        "referenceId": "' + orderLines[i].orderItem.itemID + '"'
      + '     },';
      productLinesJSON += '"giic_ProductSKU__c": "'
      + productLineItem.getProductID()
      + '","giic_OrderQuantity__c":"'
      + orderLines[i].quantity
      + '","giic_UnitPrice__c":"'
      + orderLines[i].price + '"';
      productLinesJSON += ',"giic_LineNo__c":"' + orderLines[i].orderItem.itemID + '"';
      productLinesJSON += ',"giic_TaxAmount__c":"' + orderLines[i].tax + '"';
      productLinesJSON += ',"giic_LineDescription__c":"' + orderLines[i].productName + '"';
      productLinesJSON += ',"giic_ProductAmount__c":"' + totalPrice + '"';
      LOGGER.debug('::UPC::' + orderLines[i].product.UPC);
      LOGGER.debug('::ProductId::' + productLineItem.getProductID());
      productLinesJSON += '}';
    }
  }
  shipmentAndLines = shipmentsJSON + productLinesJSON + ']';
  /** *********Order Lines -END***********/
  body = '{'
    + '"records": ['
    + '{'
    + '"attributes": {'
    + '"type": "gii__SalesOrderStaging__c",'
    + '"referenceId": "' + orderNo + '" '
    + '},'
    + customerDetailJSON
    + billingAddressJSON
    + shippingAddressJSON
    + '	"giic_OrderNumber__c":"' + orderNo + '",'
    + ' "SalesOrderLineStagings__r": {'
    + shipmentAndLines
    + ' }} ]}';

  service.addHeader('Authorization', org.token_type + ' ' + org.access_token);
  service.setURL(org.instance_url +
  GloviaOmFactory.CONFIGURATIONS.ORDER_CREATE.ORDER_STAGING_SUFFIX);

  // make the call
  result = service.call(body);
  // error case
  if (result.error !== 0 || result.errorMessage !== null || result.mockResult) {
    // setting response object in status
    responseObj = JSON.parse(result.object);
    returnStatus = new Status(Status.ERROR, GloviaOmFactory.STATUS_CODES.GENERAL.SUCCESS_ERROR);
    if (result && 'object' in result) {
      returnStatus.addDetail(GloviaOmFactory.STATUS_CODES.RESPONSE_OBJECT, result.object);
    }
    LOGGER.debug('::::gloviaom-staging-error=' + result.errorMessage);
  } else {
    // setting response object in status
    responseObj = JSON.parse(result.object);
    LOGGER.debug('::::gloviaom-staging-data=' + JSON.stringify(responseObj));
  }

  return resData;
}

module.exports = {
  createOrderWithLines: createOrderWithLines
};
