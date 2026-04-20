/**
* @NApiVersion 2.0
* @NScriptType UserEventScript
* @NModuleScope SameAccount
* @author Midware
* @developer Walter Bonilla
* @contact contact@midware.net
*/
define(["require", "exports", "N/log", "../Constants/Constants"], function (require, exports, log, constants) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function beforeLoad(pContext) {
        try {
            if (pContext.type === pContext.UserEventType.VIEW) {
                pContext.form.clientScriptModulePath = "../ClientScripts/SalesOrdersPrintOptionsCS.js";
                pContext.form.addButton({
                    id: "custpage_print_cert_btn",
                    label: "Print Certificate",
                    functionName: "printTemplate(\"" + pContext.newRecord.id + "\",\"" + constants.SO_TEMPLATES.CERT + "\")"
                });
                pContext.form.addButton({
                    id: "custpage_print_draft_btn",
                    label: "Print Office Draft",
                    functionName: "printTemplate(\"" + pContext.newRecord.id + "\",\"" + constants.SO_TEMPLATES.DRAFT + "\")"
                });
            }
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
