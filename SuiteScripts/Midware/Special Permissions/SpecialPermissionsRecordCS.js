/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fieldChanged = exports.pageInit = void 0;
    function pageInit(pContext) {
        return;
    }
    exports.pageInit = pageInit;
    function fieldChanged(pContext) {
        var fieldId = pContext.fieldId, currentRecord = pContext.currentRecord;
        var fieldValue = currentRecord.getValue({ fieldId: fieldId });
        if (fieldId === "custrecord_mw_spec_perm_vend_over") {
            currentRecord.getField({ fieldId: "custrecord_mw_spec_perm_cats" }).isDisabled = fieldValue;
        }
    }
    exports.fieldChanged = fieldChanged;
});
