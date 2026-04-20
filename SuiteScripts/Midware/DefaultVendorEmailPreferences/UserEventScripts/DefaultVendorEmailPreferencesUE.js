/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log"], function (require, exports, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeSubmit = void 0;
    function beforeSubmit(pContext) {
        try {
            var newRecord = pContext.newRecord, type = pContext.type, UserEventType = pContext.UserEventType;
            var isCreateMode = type === UserEventType.CREATE;
            if (!isCreateMode)
                return;
            if (isCreateMode) {
                newRecord.setValue("emailpreference", "PDF");
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
