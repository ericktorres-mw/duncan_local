/**
* @NApiVersion 2.0
* @NScriptType ClientScript
* @NModuleScope SameAccount
* @author Midware
* @developer Walter Bonilla
* @contact contact@midware.net
*/
define(["require", "exports", "N/log", "N/url", "../Constants/Constants"], function (require, exports, log, url, constants) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function pageInit(pContext) { }
    exports.pageInit = pageInit;
    function printTemplate(pRecord, pTemplate) {
        var suiteletURL = url.resolveScript({
            scriptId: constants.PRINT_ST.SCRIPT,
            deploymentId: constants.PRINT_ST.DEPLOY,
            params: {
                recId: pRecord,
                templateId: pTemplate
            },
        });
        window.open(suiteletURL);
    }
    exports.printTemplate = printTemplate;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
