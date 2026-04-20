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

export function beforeLoad(pContext: EntryPoints.UserEvent.beforeLoadContext) {

    try {

        pContext.form.clientScriptModulePath = "../ClientScripts/EditableShippingTicketCS.js";

        pContext.form.addButton({
            id: "custpage_print_st_btn",
            label: "Print Shipping Ticket",
            functionName: `printShippingTicket("${pContext.newRecord.id}")`
        });

    } catch (error) {
        handleError(error);
    }
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });
}