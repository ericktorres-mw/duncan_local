/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log"], function (require, exports, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fieldChanged = exports.validateInsert = exports.validateLine = void 0;
    function validateLine(pContext) {
        try {
            var itemClass = pContext.currentRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "class",
            });
            if (!itemClass) {
                alert("Please select a class for this item");
                return false;
            }
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.validateLine = validateLine;
    function validateInsert(pContext) {
        try {
            var itemClass = pContext.currentRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "class",
            });
            if (!itemClass) {
                alert("Please select a class for this item");
                return false;
            }
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.validateInsert = validateInsert;
    function fieldChanged(pContext) {
        try {
            var currentRecord = pContext.currentRecord;
            var sublistId = pContext.sublistId;
            var fieldId = pContext.fieldId;
            if (sublistId === "item" && fieldId === "custcol_mw_item_class") {
                var date = new Date();
                var startingDate = new Date(2025, 8, 1);
                if (date.getTime() < startingDate.getTime())
                    return;
                var itemClass = currentRecord.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_mw_item_class",
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "class",
                    value: itemClass,
                });
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.fieldChanged = fieldChanged;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
