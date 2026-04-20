/**
* @NApiVersion 2.0
* @NScriptType ClientScript
* @NModuleScope SameAccount
* @author Midware
* @developer Walter Bonilla
* @contact contact@midware.net
*/
define(["require", "exports", "N/log", "N/url", "N/currentRecord", "../SuiteletScripts/Constants/Constants"], function (require, exports, log, url, currentRecord, constants) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function pageInit(pContext) {
        removeLeavePopUp();
    }
    exports.pageInit = pageInit;
    function removeLeavePopUp() {
        if (window.onbeforeunload) {
            window.onbeforeunload = function () { null; };
        }
        else {
            return true;
        }
    }
    function createPDF(pSalesOrderId, pSalesOrder) {
        try {
            var rec = currentRecord.get();
            // Get Values
            var billAdd = rec.getValue("custpage_bill_to");
            var shipAdd = rec.getValue("custpage_ship_to");
            // Calculated Values
            var totalQty = 0;
            var totalWeight = 0.0;
            // Get items data
            var itemData = [];
            var itemLenght = rec.getLineCount({ sublistId: "custpage_item_list" });
            for (var i = 0; i < itemLenght; i++) {
                var item = rec.getSublistValue({ sublistId: "custpage_item_list", fieldId: "custpage_i_item", line: i });
                var description = rec.getSublistValue({ sublistId: "custpage_item_list", fieldId: "custpage_i_desc", line: i });
                var qty = rec.getSublistValue({ sublistId: "custpage_item_list", fieldId: "custpage_i_qty", line: i });
                var weight = rec.getSublistValue({ sublistId: "custpage_item_list", fieldId: "custpage_i_weight", line: i });
                itemData.push({
                    item: item,
                    description: description,
                    qty: qty,
                    weight: weight,
                });
                totalQty += parseFloat(qty.toString());
                totalWeight += parseFloat(weight.toString());
            }
            var data = {
                salesOrder: pSalesOrderId,
                soNum: pSalesOrder,
                billAdd: billAdd,
                shipAdd: shipAdd,
                totalQty: totalQty,
                totalWeight: totalWeight,
                itemData: itemData
            };
            var jsonVal = JSON.stringify(data);
            rec.setValue({
                fieldId: 'custpage_data',
                value: jsonVal
            });
            document.forms[0].submit();
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.createPDF = createPDF;
    function printShippingTicket(pSalesOrderId) {
        var suiteletURL = url.resolveScript({
            scriptId: constants.SUITELET.SCRIPT,
            deploymentId: constants.SUITELET.DEPLOY,
            params: {
                so: pSalesOrderId
            },
        });
        window.open(suiteletURL);
    }
    exports.printShippingTicket = printShippingTicket;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
