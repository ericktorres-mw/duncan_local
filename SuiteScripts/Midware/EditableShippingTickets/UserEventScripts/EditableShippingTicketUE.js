/**
* @NApiVersion 2.0
* @NScriptType UserEventScript
* @NModuleScope SameAccount
* @author Midware
* @developer Walter Bonilla
* @contact contact@midware.net
*/
define(["require", "exports", "N/log"], function (require, exports, log) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function beforeLoad(pContext) {
        try {
            pContext.form.clientScriptModulePath = "../ClientScripts/EditableShippingTicketCS.js";
            pContext.form.addButton({
                id: "custpage_print_st_btn",
                label: "Print Shipping Ticket",
                functionName: "printShippingTicket(\"" + pContext.newRecord.id + "\")"
            });
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.beforeLoad = beforeLoad;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
