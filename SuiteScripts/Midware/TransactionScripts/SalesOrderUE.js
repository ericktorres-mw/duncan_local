/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/file", "N/ui/serverWidget", "./Functions/TransactionFunctions"], function (require, exports, log, file, serverWidget, TransactionFunctions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeSubmit = exports.beforeLoad = void 0;
    function beforeLoad(pContext) {
        try {
            var newRecord = pContext.newRecord, form = pContext.form, UserEventType = pContext.UserEventType, type = pContext.type;
            var summaryTableScriptInjection = form.addField({
                id: "custpage_add_info_to_sum_table",
                label: " ",
                type: serverWidget.FieldType.INLINEHTML,
            });
            var clientScriptURL = file.load({
                id: 30616, //TODO: check id in Prod
            }).path;
            var isViewMode = type === UserEventType.VIEW;
            var minimumOrderAmount = getMinimumOrderCharge(newRecord);
            var subTotal = newRecord.getValue({ fieldId: "subtotal" });
            var actualSubTotal = Math.abs(Number(subTotal) - Number(minimumOrderAmount));
            summaryTableScriptInjection.defaultValue = "<script>jQuery(function(){ require(['".concat(clientScriptURL, "'], function(module){module.addMinimumOrderChargeToSummary(").concat(minimumOrderAmount, ", ").concat(actualSubTotal, ", ").concat(isViewMode, ");});});</script>");
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.beforeLoad = beforeLoad;
    function beforeSubmit(pContext) {
        try {
            var newRecord = pContext.newRecord, type = pContext.type, UserEventType = pContext.UserEventType;
            var isCreateMode = type === UserEventType.CREATE;
            var isEditMode = type === UserEventType.EDIT;
            if (!isCreateMode && !isEditMode)
                return;
            var customerOverride = newRecord.getValue({ fieldId: "custbody_mw_order_amount_override" });
            if (!customerOverride) {
                var customerId = newRecord.getValue({ fieldId: "entity" });
                var subTotal = newRecord.getValue({ fieldId: "subtotal" });
                var minAmount = (0, TransactionFunctions_1.getCustomerMinimumOrderAmount)(customerId);
                var surchangePercentage = (0, TransactionFunctions_1.getESurchargePercentageOfTotal)();
                //const complementaryMinAmount = calculateMinimumOrderAmount(subTotal as number, minAmount, surchangePercentage);
                var minimumOrderChargeTotal = removeAllMinimumOrderChargeLines(newRecord);
                var actualSubTotal = Number(subTotal) - Number(minimumOrderChargeTotal);
                var newShippingCost = roundTwoDecimals(actualSubTotal * (surchangePercentage / 100));
                var complementaryMinAmount = Math.abs(minAmount - (Number(actualSubTotal) + Number(newShippingCost)));
                log.debug("[beforeSubmit] surchangePercentage / 100", surchangePercentage / 100);
                log.debug("[beforeSubmit] subTotal", subTotal);
                log.debug("[beforeSubmit] minimumOrderChargeTotal", minimumOrderChargeTotal);
                log.debug("[beforeSubmit] actual subTotal", actualSubTotal);
                log.debug("[beforeSubmit] complementaryMinAmount", complementaryMinAmount);
                log.debug("[beforeSubmit] shippingCost", actualSubTotal * (surchangePercentage / 100));
                newRecord.insertLine({ sublistId: "item", line: 0 });
                newRecord.setSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: 0,
                    value: 329, //TODO: check id on Prod
                });
                newRecord.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_mw_bill_by",
                    line: 0,
                    value: null,
                });
                newRecord.setSublistValue({
                    sublistId: "item",
                    fieldId: "quantity",
                    line: 0,
                    value: 1,
                });
                newRecord.setSublistValue({
                    sublistId: "item",
                    fieldId: "description",
                    line: 0,
                    value: "Minimum Order Charge",
                });
                newRecord.setSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    line: 0,
                    value: complementaryMinAmount,
                });
                newRecord.setValue({
                    fieldId: "custbody_mw_complement_order_min",
                    value: false,
                });
                newRecord.setValue({
                    fieldId: "shippingcost",
                    value: actualSubTotal * (surchangePercentage / 100),
                });
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.beforeSubmit = beforeSubmit;
    function removeAllMinimumOrderChargeLines(pRecord) {
        var minimumOrderChargeTotal = 0;
        var lineCount = pRecord.getLineCount({ sublistId: "item" });
        for (var i = lineCount - 1; i >= 0; i--) {
            var lineDescription = pRecord.getSublistValue({ sublistId: "item", fieldId: "description", line: i });
            if (lineDescription === "Minimum Order Charge") {
                minimumOrderChargeTotal += Number(pRecord.getSublistValue({ sublistId: "item", fieldId: "amount", line: i }));
                pRecord.removeLine({ sublistId: "item", line: i });
            }
        }
        return minimumOrderChargeTotal;
    }
    function getMinimumOrderCharge(pRecord) {
        var lineCount = pRecord.getLineCount({ sublistId: "item" });
        for (var i = 0; i < lineCount; i++) {
            var lineDescription = pRecord.getSublistValue({ sublistId: "item", fieldId: "description", line: i });
            if (lineDescription === "Minimum Order Charge") {
                return pRecord.getSublistValue({ sublistId: "item", fieldId: "amount", line: i });
            }
        }
        return -1;
    }
    function roundTwoDecimals(value) {
        return Math.round(value * 100) / 100;
    }
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
