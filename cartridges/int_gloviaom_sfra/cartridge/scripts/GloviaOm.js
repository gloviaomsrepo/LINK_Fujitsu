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
  var PAYMENT_RECORDTYPEID = '012f4000000JhYo';
  var SHIPPING_RECORDTYPEID = '012f4000000JhYj';
  var PRODUCTLINE_RECORDTYPEID = '012f4000000JhYe';
  var orderInfo = OrderMgr.getOrder(orderNo);
  var customerNo = orderInfo.customer.profile.customerNo;
  var customerDetailJSON = '';
  var billingAddress = orderInfo.getBillingAddress();
  var billingAddressJSON = '';
  var ShipAddressFromShipments = orderInfo.getShipments();
  var shippingAddressJSON = '';
  var shippingAddress;
  var shippingMethod;
  var PaymentInstruments = orderInfo.getPaymentInstruments();
  var paymentJSON = '';
  var PaymentInstrument;
  var PaymentTransaction;
  var Shipments = orderInfo.getShipments();
  var shipmentsJSON = '';
  var shipment;
  var i = 0;
  var orderLines = orderInfo.getProductLineItems();
  var productLinesJSON = '';
  var totalPrice;
  var productLineItem;
  var shipmentAndLines;
  var body;
  var resData = '';
  var org = TOKEN.getToken();
  var sitePref = Site.getCurrent().getPreferences();
  var serviceFrameworkName = sitePref.getCustom().GLOVIAOM_ServiceName;
  var service;
  var result;
  var responseObj;
  var returnStatus;

  customerDetailJSON += '"giic_Account__c" : "' + customerNo + '",';
  customerDetailJSON += '"giic_Source__c" : "Online Sale",';

  billingAddressJSON += '"giic_BillingStreet__c" : "' + billingAddress.address1 + '",';
  billingAddressJSON += '"giic_BillingCity__c" : "' + billingAddress.city + '",';
  billingAddressJSON += '"giic_BillingStateProvince__c" : "' + billingAddress.stateCode + '",';
  billingAddressJSON += '"giic_BillingCountry__c" : "' + billingAddress.countryCode + '",';
  billingAddressJSON += '"giic_BillingZipPostalCode__c" : "' + billingAddress.postalCode + '",';

  for (i = 0; i < ShipAddressFromShipments.size(); i++) {
    shippingAddress = ShipAddressFromShipments[i].getShippingAddress();
    shippingAddressJSON += '"giic_ShipToStreet__c" : "' + shippingAddress.address1 + '",';
    shippingAddressJSON += '"giic_ShipToCity__c" : "' + shippingAddress.city + '",';
    shippingAddressJSON += '"giic_ShipToStateProvince__c" : "' + shippingAddress.stateCode + '",';
    shippingAddressJSON += '"giic_ShipToCountry__c" : "' + shippingAddress.countryCode + '",';
    shippingAddressJSON += '"giic_ShipToZipPostalCode__c" : "' + shippingAddress.postalCode + '",';

    shippingMethod = ShipAddressFromShipments[i].getShippingMethodID();
    if (shippingMethod !== null && shippingMethod === '005') {
      customerDetailJSON += '"giic_WarehouseCode__c" : "'
      + ShipAddressFromShipments[i].custom.fromStoreId + '",';
    }
    break;
  }

  if (PaymentInstruments.size() > 0) {
    paymentJSON = '';
    for (i = 0; i < PaymentInstruments.size(); i++) {
      PaymentInstrument = PaymentInstruments[i];
      PaymentTransaction = PaymentInstrument.getPaymentTransaction();
      paymentJSON += '{' +
      '       "attributes": {' +
      '       "type": "gii__SalesOrderLineStaging__c",' +
      '        "referenceId": "' + PaymentTransaction.getTransactionID() + '-PAYMENT"' +
      '     },';
      paymentJSON += ' "giic_PaymentMethod__c": "' + PaymentInstrument.getPaymentMethod() + '"';
      paymentJSON += ',"giic_CreditCardType__c":"' + PaymentInstrument.getCreditCardType() + '"';
      paymentJSON += ',"giic_CreditCardNumberLastDigits__c":"'
      + PaymentInstrument.getCreditCardNumberLastDigits() + '"';
      paymentJSON += ',"giic_CreditCardExpirationMonth__c":"'
      + PaymentInstrument.getCreditCardExpirationMonth() + '"';
      paymentJSON += ',"giic_CreditCardExpirationYear__c":"'
      + PaymentInstrument.getCreditCardExpirationYear() + '"';
      paymentJSON += ',"giic_CreditCardHolder__c":"'
      + PaymentInstrument.getCreditCardHolder() + '"';
      paymentJSON += ',"giic_PaymentAmount__c":"'
      + PaymentTransaction.getAmount() + '"';
      paymentJSON += ',"giic_PaymentTransactionId__c":"'
      + PaymentTransaction.getTransactionID() + '"';
      paymentJSON += ',"RecordTypeId":"' + PAYMENT_RECORDTYPEID + '"';
      paymentJSON += '},';
    }
  }

  if (Shipments.size() > 0) {
    shipmentsJSON = '';
    for (i = 0; i < Shipments.size(); i++) {
      shipment = Shipments[i];
      shippingMethod = shipment.getShippingMethod();
      shipmentsJSON += '{' +
      '       "attributes": {' +
      '       "type": "gii__SalesOrderLineStaging__c",' +
      '        "referenceId": "' + shipment.getShipmentNo() + '"' +
      '     },';
      shipmentsJSON += ' "giic_ShippingId__c": "' + shippingMethod.getID() + '"';
      shipmentsJSON += ',"giic_ShippingNumber__c": "' + shipment.getShipmentNo() + '"';
      shipmentsJSON += ',"giic_ShippingDescription__c":"'
      + shippingMethod.getDescription() + '"';
      shipmentsJSON += ',"giic_ShippingUnitPrice__c":"'
      + shipment.getShippingTotalPrice() + '"';
      shipmentsJSON += ',"giic_ShippingTax__c":"' + shipment.getShippingTotalTax() + '"';
      shipmentsJSON += ',"RecordTypeId":"' + SHIPPING_RECORDTYPEID + '"';
      shipmentsJSON += '},';
    }
  }

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
      productLinesJSON += '"giic_ProductSKU__c": "' + productLineItem.getProductID()
      + '","giic_OrderQuantity__c":"' + orderLines[i].quantity
      + '","giic_UnitPrice__c":"' + orderLines[i].price + '"';
      productLinesJSON += ',"giic_LineNo__c":"' + orderLines[i].orderItem.itemID + '"';
      productLinesJSON += ',"giic_TaxAmount__c":"' + orderLines[i].tax + '"';
      productLinesJSON += ',"giic_LineDescription__c":"'
      + (orderLines[i].productName).replace('"', '\\"') + '"';
      productLinesJSON += ',"giic_ProductAmount__c":"' + totalPrice + '"';
      productLinesJSON += ',"RecordTypeId":"' + PRODUCTLINE_RECORDTYPEID + '"';
      LOGGER.debug('::UPC=' + orderLines[i].product.UPC);
      LOGGER.debug('::ProductID=' + productLineItem.getProductID());
      productLinesJSON += '}';
    }
  }

  shipmentAndLines = '"records": [' + paymentJSON + shipmentsJSON + productLinesJSON + ']';
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
  +	shipmentAndLines
  + ' }} ]}';

  service = ServiceFactory.getServiceRegistry({
    serviceName: serviceFrameworkName,
    feature: GloviaOmFactory.FEATURES.ORDER_CREATE
  });

  service.addHeader('Authorization', org.token_type + ' ' + org.access_token);
  service.setURL(org.instance_url
  + GloviaOmFactory.CONFIGURATIONS.ORDER_CREATE.ORDER_STAGING_SUFFIX);
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
    LOGGER.debug('::::error-data=' + JSON.stringify(responseObj));
    LOGGER.debug('::::error-result.error=' + result.error);
    LOGGER.debug('::::error-result.errorMessage=' + result.errorMessage);
    LOGGER.debug('::::error-result.mockResult=' + result.mockResult);
  } else {
    // setting response object in status
    responseObj = JSON.parse(result.object);
    LOGGER.debug('::::staging-data=' + JSON.stringify(responseObj));
  }
  return resData;
}

module.exports = {
  createOrderWithLines: createOrderWithLines
};
