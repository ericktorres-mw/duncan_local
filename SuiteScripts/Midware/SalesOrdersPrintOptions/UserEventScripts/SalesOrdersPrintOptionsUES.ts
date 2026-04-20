/**
* @NApiVersion 2.0
* @NScriptType UserEventScript
* @NModuleScope SameAccount
* @author Midware
* @developer Walter Bonilla
* @contact contact@midware.net
*/

import { EntryPoints } from "N/types"

import * as log from 'N/log'

import * as constants from '../Constants/Constants'

export function beforeLoad(pContext : EntryPoints.UserEvent.beforeLoadContext) {

    try {

        if (pContext.type === pContext.UserEventType.VIEW) {

            pContext.form.clientScriptModulePath = "../ClientScripts/SalesOrdersPrintOptionsCS.js";

            pContext.form.addButton({
                id : "custpage_print_cert_btn",
                label : "Print Certificate",
                functionName : `printTemplate("${pContext.newRecord.id}","${constants.SO_TEMPLATES.CERT}")`
            });

            pContext.form.addButton({
                id : "custpage_print_draft_btn",
                label : "Print Office Draft",
                functionName : `printTemplate("${pContext.newRecord.id}","${constants.SO_TEMPLATES.DRAFT}")`
            });
        }

    } catch (error) {
        handleError(error);
    }

}

function handleError(pError : Error) {

    log.error({ title : "Error", details : pError.message });
    log.error({ title : "Stack", details : JSON.stringify(pError) });

}