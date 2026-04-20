/**
* @NApiVersion 2.0
* @NScriptType ClientScript
* @NModuleScope SameAccount
* @author Midware
* @developer Walter Bonilla
* @contact contact@midware.net
*/

import { EntryPoints } from "N/types"

import * as log from 'N/log'
import * as url from 'N/url'

import * as constants from '../Constants/Constants'

export function pageInit(pContext : EntryPoints.Client.pageInitContext) {}

export function printTemplate(pRecord, pTemplate){

    let suiteletURL = url.resolveScript({
        scriptId: constants.PRINT_ST.SCRIPT,
        deploymentId: constants.PRINT_ST.DEPLOY,
        params: {
            recId: pRecord,
            templateId : pTemplate
        },
    });

    window.open(suiteletURL);
}

function handleError(pError : Error) {

    log.error({ title : "Error", details : pError.message });
    log.error({ title : "Stack", details : JSON.stringify(pError) });

}