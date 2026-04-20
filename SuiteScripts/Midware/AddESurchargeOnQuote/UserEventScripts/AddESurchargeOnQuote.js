/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/search"], function (require, exports, log, search) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var E_SURCHARGE_ID = "208";
    function beforeLoad(pContext) {
    }
    exports.beforeLoad = beforeLoad;
    function beforeSubmit(pContext) {
        try {
            if (pContext.type == pContext.UserEventType.CREATE || pContext.type == pContext.UserEventType.EDIT) {
                var newRecord = pContext.newRecord;
                var customerId = newRecord.getValue('entity');
                var shippingMethod = newRecord.getValue('shipmethod');
                if (customerId && shippingMethod) {
                    if (shippingMethod.toString() == E_SURCHARGE_ID) {
                        var customerLookup = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: customerId.toString(),
                            columns: ['custentity_mw_e_surcharge_percent']
                        });
                        var shippingPercentage = parseFloat(customerLookup['custentity_mw_e_surcharge_percent']) || 0;
                        log.debug("shippingPercentage", shippingPercentage);
                        if (shippingPercentage > 0) {
                            var subtotal = parseFloat(newRecord.getValue('subtotal').toString()) || 0;
                            var newShippingCost = (subtotal * shippingPercentage) / 100;
                            newRecord.setValue({
                                fieldId: 'shippingcost',
                                value: newShippingCost.toFixed(2)
                            });
                        }
                        log.debug("shippingcost", newShippingCost.toFixed(2));
                    }
                }
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.beforeSubmit = beforeSubmit;
    function afterSubmit(pContext) { }
    exports.afterSubmit = afterSubmit;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
