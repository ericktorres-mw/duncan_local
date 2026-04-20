/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import { EntryPoints } from "N/types";

import * as log from "N/log";

export function beforeSubmit(pContext: EntryPoints.UserEvent.beforeSubmitContext) {
    try {
        const { newRecord, type, UserEventType } = pContext;

        const isCreateMode = type === UserEventType.CREATE;

        if (!isCreateMode) return;

        if (isCreateMode) {
            newRecord.setValue("emailpreference", "PDF");
        }
    } catch (error) {
        handleError(error);
    }
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });

    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
