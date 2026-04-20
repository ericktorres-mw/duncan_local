/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/error", "N/http", "../Controllers/PrintTemplateSTController"], function (require, exports, log, error, http, controller) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function onRequest(pContext) {
        try {
            var eventMap = {}; //event router pattern design
            eventMap[http.Method.GET] = handleGet;
            eventMap[pContext.request.method] ?
                eventMap[pContext.request.method](pContext) :
                httpRequestError();
        }
        catch (error) {
            pContext.response.write("Unexpected error. Detail: " + error.message);
            handleError(error);
        }
    }
    exports.onRequest = onRequest;
    function handleGet(pContext) {
        var recId = pContext.request.parameters.recId;
        var templateId = pContext.request.parameters.templateId;
        if (recId && templateId) {
            var doc = controller.printTemplate(recId, templateId);
            if (doc != undefined) {
                pContext.response.writeFile({ file: doc, isInline: true });
            }
            else {
                pContext.response.write("Could not generate file");
            }
        }
        else {
            pContext.response.write("You need to send recId and templateId");
        }
    }
    function httpRequestError() {
        throw error.create({
            name: "MW_UNSUPPORTED_REQUEST_TYPE",
            message: "Suitelet only supports GET and POST",
            notifyOff: true
        });
    }
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
