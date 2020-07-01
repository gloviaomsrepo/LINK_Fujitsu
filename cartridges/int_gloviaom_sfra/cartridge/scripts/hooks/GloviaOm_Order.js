/*
Import Library of Commerce Cloud
*/
var Status = require('dw/system/Status');
/*
Before PATCH Trigger
*/
exports.beforePATCH = function (order, orderInput) {
  order.setExternalOrderNo(orderInput.c_externalOrderNo);
  if (orderInput.c_shippedFlag !== null && orderInput.c_shippedFlag !== 0) {
    order.setShippingStatus(orderInput.c_shippedFlag);
    order.setStatus(5);
  }
  return new Status(Status.OK);
};
