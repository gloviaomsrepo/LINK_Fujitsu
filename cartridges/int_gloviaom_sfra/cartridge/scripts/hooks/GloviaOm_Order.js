/*
Import Library of Commerce Cloud
*/
var Status = require('dw/system/Status');
/*
Before PATCH Trigger
*/
exports.beforePATCH = function (order, orderInput) {
  order.setExternalOrderNo(orderInput.c_externalOrderNo);
  return new Status(Status.OK);
};
