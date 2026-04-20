/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/search", "N/currentRecord"], function (require, exports, log, search, currentRecord) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var E_SURCHARGE_ID = "208";
    function pageInit(pContext) { }
    exports.pageInit = pageInit;
    function fieldChanged(pContext) {
        try {
            var rec = pContext.currentRecord;
            if (pContext.fieldId === 'entity') {
                updateShippingCost(rec);
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.fieldChanged = fieldChanged;
    function sublistChanged(pContext) {
        if (pContext.sublistId === 'item') {
            var rec = currentRecord.get();
            log.debug("sublistChanged", pContext.sublistId);
            updateShippingCost(rec);
        }
    }
    exports.sublistChanged = sublistChanged;
    function updateShippingCost(pRecord) {
        try {
            var customerId = pRecord.getValue('entity');
            var shippingMethod = pRecord.getValue('shipmethod');
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
                        var subtotal = parseFloat(pRecord.getValue('subtotal').toString()) || 0;
                        log.debug("subtotal", subtotal);
                        var newShippingCost = (subtotal * shippingPercentage) / 100;
                        pRecord.setValue({
                            fieldId: 'shippingcost',
                            value: newShippingCost.toFixed(2)
                        });
                    }
                    log.debug("shippingcost", newShippingCost.toFixed(2));
                }
            }
        }
        catch (error) {
            log.error('Error updating shipping cost', error);
        }
    }
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
