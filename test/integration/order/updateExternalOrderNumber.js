var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var Base64 = require('js-base64').Base64;
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);


describe('Getting the access token', function () {
  var usr = 'demouser';
  var pwd = 'Alchemist@99';
  var siteId = 'RefArch';
  var orderNo = '00000708';

  var clientPwd = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  var clientId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  this.timeout(5000);

  it('should get the access token', function () {
    var grantTypeEncode = encodeURI('urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken', 'UTF-8');
    var base64Cred = Base64.encode(usr + ':' + pwd + ':' + clientPwd);
    var cookieJar = request.jar();
    var myRequest = {
      url: config.baseUrl + '/dw/oauth2/access_token?client_id=' + clientId + '&grant_type=' + grantTypeEncode,
      method: 'POST',
      rejectUnauthorized: false,
      resolveWithFullResponse: true,
      jar: cookieJar,
      form: {},
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + base64Cred
      }
    };
    var expectedTokenJSON = {
      'access_token': '5f19f1cb-b307-4cef-a24c-ae82b18518d5',
      'expires_in': 899,
      'token_type': 'Bearer'
    };

    return request(myRequest, function (error, response) {
      var bodyAsJson = JSON.parse(response.body);
      var token = bodyAsJson.access_token;

      assert.equal(response.statusCode, 200, 'Update External Order number call should return statusCode of 200');
      assert.containSubset(bodyAsJson.token_type, expectedTokenJSON.token_type, 'Actual response. token type must be Bearer.');

      describe('Update External Order Number', function () {
        this.timeout(5000);

        it('should update the external order number', function () {
          var cookieJarNew = request.jar();
          var myRequestNew = {
            url: config.baseUrl + '/s/' + siteId + '/dw/shop/v19_5/orders/' + orderNo,
            method: 'POST',
            json: true,
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJarNew,
            body: {
              'c_externalOrderNo': 'glovia_001'
            },
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'x-dw-http-method-override': 'PATCH',
              'Content-Type': 'application/json',
              'Accpet': 'application/json',
              'Authorization': 'Bearer ' + token
            }
          };

          var expectedBodyOrder = {
            '_v': '19.5',
            '_type': 'order',
            '_resource_state': '490c1479efaeeff3e87094270e81641a6cebfe4709deab9f9f4a74ae5becc429',
            'adjusted_merchandize_total_tax': 25,
            'adjusted_shipping_total_tax': 0.8,
            'confirmation_status': 'confirmed',
            'created_by': 'Customer',
            'currency': 'USD',
            'customer_info': {
              '_type': 'customer_info',
              'customer_id': 'abJyNr8vPq0eDIwCbvT1ap5dcs',
              'customer_name': 'Abhishek Singh',
              'customer_no': '00006001'
            },
            'customer_name': 'Abhishek Singh',
            'export_status': 'ready',
            'order_no': orderNo,
            'order_token': '9QAfdi2g6nqAUdZz2IZBa0aSefcDWODB-TAoKmDMJ6Y',
            'order_total': 541.79,
            'payment_status': 'not_paid',
            'product_items': [{
              '_type': 'product_item',
              'adjusted_tax': 25,
              'base_price': 500,
              'bonus_product_line_item': false,
              'gift': false,
              'item_id': '2015b2ab9dc1ad61291fa01258',
              'item_text': 'Charcoal Single Pleat Wool Suit',
              'price': 500,
              'price_after_item_discount': 500,
              'price_after_order_discount': 500,
              'product_id': '750518894553',
              'product_name': 'Charcoal Single Pleat Wool Suit',
              'quantity': 1,
              'shipment_id': 'me',
              'tax': 25,
              'tax_basis': 500,
              'tax_class_id': 'standard',
              'tax_rate': 0.05
            }],
            'product_sub_total': 500,
            'product_total': 500,
            'shipments': [{
              '_type': 'shipment',
              'adjusted_merchandize_total_tax': 25,
              'adjusted_shipping_total_tax': 0.8,
              'gift': false,
              'merchandize_total_tax': 25,
              'product_sub_total': 500,
              'product_total': 500,
              'shipment_id': 'me',
              'shipment_no': '00000001',
              'shipment_total': 541.79,
              'shipping_address': {
                '_type': 'order_address',
                'address1': '110 Cheshire Ln',
                'city': 'Minnetonka',
                'country_code': 'US',
                'first_name': 'Abhishek',
                'full_name': 'Abhishek Singh',
                'id': 'c7541c0e7836459b590d7a5e7e',
                'last_name': 'Singh',
                'phone': '9292396937',
                'postal_code': '55305',
                'state_code': 'MN'
              },
              'shipping_method': {
                '_type': 'shipping_method',
                'description': 'Order received within 7-10 business days',
                'id': '001',
                'name': 'Ground',
                'price': 15.99
              },
              'shipping_status': 'not_shipped',
              'shipping_total': 15.99,
              'shipping_total_tax': 0.8,
              'tax_total': 25.8
            }],
            'shipping_items': [{
              '_type': 'shipping_item',
              'adjusted_tax': 0.8,
              'base_price': 15.99,
              'item_id': 'd9cc8cdee4eb82d8f9ff09886e',
              'item_text': 'Shipping',
              'price': 15.99,
              'price_after_item_discount': 15.99,
              'shipment_id': 'me',
              'tax': 0.8,
              'tax_basis': 15.99,
              'tax_class_id': 'standard',
              'tax_rate': 0.05
            }],
            'shipping_status': 'shipped',
            'shipping_total': 15.99,
            'shipping_total_tax': 0.8,
            'site_id': siteId,
            'status': 'open',
            'taxation': 'net',
            'tax_total': 25.8
          };

          return request(myRequestNew, function (errorNew, responseNew) {
            assert.equal(responseNew.statusCode, 200, 'Update External Order number call should return statusCode of 200');
            assert.containSubset(bodyAsJson.order_no, expectedBodyOrder.order_no, 'Actual response. Order number must match.');
            assert.containSubset(bodyAsJson.site_id, expectedBodyOrder.site_id, 'Actual response. Site Id must match.');
          });
        });
      });
    });
  });
});
