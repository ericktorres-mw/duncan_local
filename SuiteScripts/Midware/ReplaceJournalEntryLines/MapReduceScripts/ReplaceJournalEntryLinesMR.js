/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/record", "N/search"], function (require, exports, log, record, search) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.reduce = exports.map = exports.getInputData = void 0;
    var getInputData = function (context) {
        var searchObj = null;
        try {
            searchObj = search.load({ id: "customsearch_mw_get_journal_entries" });
        }
        catch (pError) {
            handleError(pError);
        }
        return searchObj;
    };
    exports.getInputData = getInputData;
    var map = function (context) {
        try {
            log.audit("[map] Processing", "Processing Data: ".concat(JSON.stringify(context)));
            var searchLine = JSON.parse(context.value);
            var journalEntryId = searchLine.values["GROUP(internalid)"]["value"];
            var journalEntry = record.load({
                type: record.Type.JOURNAL_ENTRY,
                id: journalEntryId,
            });
            var lineCount = journalEntry.getLineCount({ sublistId: "line" });
            for (var i = 0; i < lineCount; i++) {
                var currentCustomerText = journalEntry.getSublistText({
                    sublistId: "line",
                    fieldId: "entity",
                    line: i,
                });
                var account = journalEntry.getSublistValue({
                    sublistId: "line",
                    fieldId: "account",
                    line: i,
                });
                log.debug("[map] currentCustomerText", currentCustomerText);
                log.debug("[map] account", account);
                if (
                // currentCustomerText.includes(":") &&
                currentCustomerText == "" &&
                    account == 54) {
                    /*const parentCustomerName = currentCustomerText.split(":")[0].trim();
    
                    log.debug("[map] parentCustomerName", parentCustomerName);
    
                    const customerSearch = search
                        .create({
                            type: search.Type.CUSTOMER,
                            filters: [["entityid", "is", parentCustomerName]],
                            columns: ["internalid"],
                        })
                        .run()
                        .getRange({ start: 0, end: 1 });
    
                    if (customerSearch.length > 0) {
                        log.debug("[map] customerSearch", customerSearch);
    
                        journalEntry.setSublistValue({
                            sublistId: "line",
                            fieldId: "entity",
                            line: i,
                            value: customerSearch[0].id,
                        });
    
                        log.audit("[map] Updated line", `Line ${i}: ${currentCustomerText} -> ${parentCustomerName}`);
                    }*/
                    journalEntry.setSublistValue({
                        sublistId: "line",
                        fieldId: "entity",
                        line: i,
                        value: 9970,
                    });
                    log.audit("[map] Updated line", "Line ".concat(i, ": ").concat(currentCustomerText, " -> INNOVATION IRON WORKS"));
                }
            }
            journalEntry.save({
                enableSourcing: false,
                ignoreMandatoryFields: true,
            });
        }
        catch (error) {
            handleError(error);
        }
    };
    exports.map = map;
    var reduce = function (context) { };
    exports.reduce = reduce;
    var summarize = function (context) { };
    exports.summarize = summarize;
    var handleError = function (pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    };
});
