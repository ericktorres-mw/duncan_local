/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log"], function (require, exports, log) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function pageInit(pContext) {
        try {
            console.log("Init");
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.pageInit = pageInit;
    function validateField(pContext) {
        try {
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.validateField = validateField;
    function validateLine(pContext) {
        try {
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.validateLine = validateLine;
    function validateInsert(pContext) {
        try {
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.validateInsert = validateInsert;
    function validateDelete(pContext) {
        try {
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.validateDelete = validateDelete;
    function fieldChanged(pContext) {
        try {
            console.log("Init: ", pContext.fieldId);
            var currentRecord_1 = pContext.currentRecord;
            if (pContext.fieldId == "custrecord_mw_dft") {
                currentRecord_1.setValue({
                    fieldId: "custrecord_mw_ext_pp_inspection",
                    value: false,
                    ignoreFieldChange: true,
                });
                currentRecord_1.setValue({
                    fieldId: "custrecord_mw_ext_ip_inspection",
                    value: false,
                    ignoreFieldChange: true,
                });
            }
            else if (pContext.fieldId == "custrecord_mw_ext_pp_inspection") {
                var new_value = currentRecord_1.getValue({
                    fieldId: "custrecord_mw_ext_pp_inspection",
                });
                new_value = Boolean(new_value);
                currentRecord_1.setValue({
                    fieldId: "custrecord_mw_dft",
                    value: new_value,
                    ignoreFieldChange: true,
                });
                currentRecord_1.setValue({
                    fieldId: "custrecord_mw_ext_ip_inspection",
                    value: false,
                    ignoreFieldChange: true,
                });
            }
            else if (pContext.fieldId == "custrecord_mw_ext_ip_inspection") {
                var new_value = currentRecord_1.getValue({
                    fieldId: "custrecord_mw_ext_ip_inspection",
                });
                new_value = Boolean(new_value);
                currentRecord_1.setValue({
                    fieldId: "custrecord_mw_dft",
                    value: new_value,
                    ignoreFieldChange: true,
                });
                currentRecord_1.setValue({
                    fieldId: "custrecord_mw_ext_pp_inspection",
                    value: new_value,
                    ignoreFieldChange: true,
                });
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.fieldChanged = fieldChanged;
    function postSourcing(pContext) {
        try {
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.postSourcing = postSourcing;
    function sublistChanged(pContext) {
        try {
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.sublistChanged = sublistChanged;
    function saveRecord(pContext) {
        try {
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.saveRecord = saveRecord;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
