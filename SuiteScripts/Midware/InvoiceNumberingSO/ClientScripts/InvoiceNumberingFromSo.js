/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/record"], function (require, exports, log, record) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pageInit = void 0;
    function pageInit(pContext) {
        try {
            var invoice_1 = pContext.currentRecord;
            console.log(pContext.mode);
            if (pContext.mode == "create" || pContext.mode == "copy") {
                var createdFrom = invoice_1.getValue({
                    fieldId: "createdfrom",
                });
                //console.log(createdFrom);
                if (createdFrom) {
                    var saleOrder_1 = record.load({
                        type: record.Type.SALES_ORDER,
                        id: createdFrom,
                    });
                    try {
                        var soNumberID = saleOrder_1.getText({
                            fieldId: "tranid",
                        });
                        var soNumber = String(soNumberID).replace(/\D/g, ""); //Get rid of all not numerical characters
                        //console.log(soNumber);
                        invoice_1.setValue({
                            fieldId: "tranid",
                            value: "INV" + soNumber,
                        });
                    }
                    catch (error) {
                        handleError(error);
                    }
                    var linesToAdd = [];
                    var lineCount = saleOrder_1.getLineCount({ sublistId: "item" });
                    // Iterate through the item sublist of the Sales Order
                    for (var line = 0; line < lineCount; line++) {
                        var quantity = saleOrder_1.getSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            line: line,
                        });
                        if (quantity === 0) {
                            // Item with quantity 0 found, add the line to the array
                            linesToAdd.push(line);
                        }
                    }
                    linesToAdd.forEach(function (line) {
                        // Copy the line from the Sale Order To The Invoice
                        invoice_1.selectNewLine({ sublistId: "item" });
                        var itemSublistFields = saleOrder_1.getSublistFields({ sublistId: "item" });
                        itemSublistFields.forEach(function (fieldId) {
                            var value = saleOrder_1.getSublistValue({
                                sublistId: "item",
                                fieldId: fieldId,
                                line: line,
                            });
                            invoice_1.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: fieldId,
                                value: value,
                                ignoreFieldChange: true,
                            });
                        });
                        invoice_1.commitLine({ sublistId: "item" });
                    });
                }
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.pageInit = pageInit;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
