/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/error", "N/http", "../Controllers/EditableShippingTicketsController"], function (require, exports, log, error, http, controller) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function onRequest(pContext) {
        try {
            var eventMap = {}; //event router pattern design
            eventMap[http.Method.GET] = handleGet;
            eventMap[http.Method.POST] = handlePost;
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
        var salesOrder = pContext.request.parameters.so;
        var result = controller.getPage(salesOrder);
        pContext.response.writePage({ pageObject: result });
    }
    function handlePost(pContext) {
        var dataString = pContext.request.parameters.custpage_data;
        var ddata = JSON.parse(dataString || '{}');
        log.debug("ddata", ddata);
        var ffile = controller.getPDF(ddata);
        pContext.response.writeFile({ file: ffile, isInline: true });
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
