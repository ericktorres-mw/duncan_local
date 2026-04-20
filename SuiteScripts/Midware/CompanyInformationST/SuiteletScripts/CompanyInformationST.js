/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/http", "N/error", "N/config"], function (require, exports, log, http, error, config) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    function onRequest(pContext) {
        try {
            var eventMap = {}; //event router pattern design
            eventMap[http.Method.GET] = handleGet;
            eventMap[http.Method.POST] = handlePost;
            eventMap[pContext.request.method] ? eventMap[pContext.request.method](pContext) : httpRequestError();
        }
        catch (error) {
            pContext.response.write("Unexpected error. Detail: ".concat(error.message));
            handleError(error);
        }
    }
    exports.onRequest = onRequest;
    function handleGet(pContext) {
        var companyInfo = config.load({
            type: config.Type.COMPANY_INFORMATION,
        });
        pContext.response.write({
            output: JSON.stringify(companyInfo.getValue({ fieldId: "custrecord_mw_gb_minimum_order_amount" })),
        });
    }
    function handlePost(pContext) { }
    function httpRequestError() {
        throw error.create({
            name: "MW_UNSUPPORTED_REQUEST_TYPE",
            message: "Suitelet only supports GET and POST",
            notifyOff: true,
        });
    }
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
