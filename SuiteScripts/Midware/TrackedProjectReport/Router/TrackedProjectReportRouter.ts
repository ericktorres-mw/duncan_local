/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import { EntryPoints } from "N/types";

import * as log from "N/log";
import * as error from "N/error";
import * as http from "N/http";

import * as controller from "../Controllers/TrackedProjectReportController";

export function onRequest(pContext: EntryPoints.Suitelet.onRequestContext) {
    try {
        const eventMap = {}; //event router pattern design
        eventMap[http.Method.GET] = handleGet;
        eventMap[http.Method.POST] = handlePost;

        eventMap[pContext.request.method] ? eventMap[pContext.request.method](pContext) : httpRequestError();
    } catch (error) {
        pContext.response.write(`Unexpected error. Detail: ${error.message}`);
        handleError(error);
    }
}

function handleGet(pContext: EntryPoints.Suitelet.onRequestContext) {
    pContext.response.writePage(controller.getMainView());
}

function handlePost(pContext: EntryPoints.Suitelet.onRequestContext) {
    const tracked_project_id = pContext.request.parameters["custpage_tracked_project"];

    pContext.response.writePage(controller.getResultView(tracked_project_id));
}

function httpRequestError() {
    throw error.create({
        name: "MW_UNSUPPORTED_REQUEST_TYPE",
        message: "Suitelet only supports GET and POST",
        notifyOff: true,
    });
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });

    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
