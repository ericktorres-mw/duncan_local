/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
 */

import { EntryPoints } from 'N/types'

import * as log from 'N/log'
import * as error from 'N/error'
import * as http from 'N/http'

import * as controller from '../Controllers/PrintTemplateSTController'

export function onRequest(pContext : EntryPoints.Suitelet.onRequestContext) {
    try {
        var eventMap = {}; //event router pattern design
        eventMap[http.Method.GET] = handleGet;

        eventMap[pContext.request.method] ?
            eventMap[pContext.request.method](pContext) :
            httpRequestError();

        
    } catch (error) {
        
        pContext.response.write(`Unexpected error. Detail: ${error.message}`);
        handleError(error);
    }
}

function handleGet(pContext : EntryPoints.Suitelet.onRequestContext) {

    let recId = pContext.request.parameters.recId;
    let templateId = pContext.request.parameters.templateId;

    if (recId && templateId) {

        let doc = controller.printTemplate(recId, templateId);

        if ( doc != undefined ) {

            pContext.response.writeFile({ file : doc, isInline : true });

        } else {

            pContext.response.write("Could not generate file");

        }

    } else {

        pContext.response.write("You need to send recId and templateId");

    }

}

function httpRequestError() {
    throw error.create({
        name : "MW_UNSUPPORTED_REQUEST_TYPE",
        message : "Suitelet only supports GET and POST",
        notifyOff : true
    });
}

function handleError(pError : Error) {
    log.error({ title : "Error", details : pError.message });

    log.error({ title : "Stack", details : JSON.stringify(pError) });
}