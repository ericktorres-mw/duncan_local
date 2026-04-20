/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/record"], function (require, exports, log, record) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeSubmit = void 0;
    function beforeSubmit(pContext) {
        try {
            var newRecord = pContext.newRecord, type = pContext.type, UserEventType = pContext.UserEventType;
            var isCreateMode = type === UserEventType.CREATE;
            log.debug("[afterSubmit] type", type);
            log.debug("[afterSubmit]", "isCreateMode [".concat(isCreateMode, "]"));
            if (!isCreateMode) {
                return;
            }
            var createdFrom = newRecord.getValue({
                fieldId: "createdfrom",
            });
            var saleOrder = record.load({
                type: record.Type.SALES_ORDER,
                id: createdFrom,
            });
            try {
                var soNumberID = saleOrder.getText({
                    fieldId: "tranid",
                });
                var soNumber = String(soNumberID).replace(/\D/g, "");
                newRecord.setValue({
                    fieldId: "tranid",
                    value: "INV".concat(soNumber),
                });
            }
            catch (error) {
                handleError(error);
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.beforeSubmit = beforeSubmit;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
