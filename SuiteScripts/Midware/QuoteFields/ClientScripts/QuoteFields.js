/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/runtime", "N/search"], function (require, exports, log, runtime, search) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function pageInit(pContext) {
        try {
            if (pContext.mode == "create") {
                var currentUser = runtime.getCurrentUser();
                //Set due date = today + 90 days
                var today = new Date();
                var dueDate = new Date(today.setDate(today.getDate() + 90));
                pContext.currentRecord.setValue({
                    fieldId: "duedate",
                    value: dueDate,
                });
                var current_quoted_by_value = pContext.currentRecord.getValue({
                    fieldId: "custbody_mw_quoted_by",
                });
                if (current_quoted_by_value == false) {
                    //Set quoted by field = current User if possible
                    var quotedByCurrentUserSearch = search
                        .create({
                        type: "customrecord_mw_quoted_by",
                        filters: [["custrecord_mw_user.internalid", "anyof", currentUser.id]],
                        columns: ["id"],
                    })
                        .runPaged({ pageSize: 1000 });
                    for (var i = 0; i < quotedByCurrentUserSearch.pageRanges.length; i++) {
                        var page = quotedByCurrentUserSearch.fetch({ index: quotedByCurrentUserSearch.pageRanges[i].index });
                        for (var j = 0; j < page.data.length; j++) {
                            var user = page.data[j];
                            pContext.currentRecord.setValue({
                                fieldId: "custbody_mw_quoted_by",
                                value: user.id,
                            });
                        }
                    }
                }
            }
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
            //Set due date = trandate + 90 days
            if (pContext.fieldId == "trandate") {
                var quoteDateField = pContext.currentRecord.getValue({
                    fieldId: "trandate",
                });
                var tranDate = new Date(quoteDateField);
                var dueDate = new Date(tranDate.setDate(tranDate.getDate() + 90));
                pContext.currentRecord.setValue({
                    fieldId: "duedate",
                    value: dueDate,
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
