/******Import Library of Commerce Cloud******/
importPackage( dw.system );
importPackage( dw.order );

/**************Before PATCH Trigger**********************/
exports.beforePATCH  = function(order, orderInput)
{
	order.setExternalOrderNo(orderInput.c_externalOrderNo);
	return new Status(Status.OK);
};
