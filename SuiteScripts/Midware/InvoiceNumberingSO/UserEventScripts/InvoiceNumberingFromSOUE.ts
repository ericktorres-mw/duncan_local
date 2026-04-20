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
import * as record from "N/record";

export function beforeSubmit(pContext: EntryPoints.UserEvent.beforeSubmitContext) {
    try {
        const { newRecord, type, UserEventType } = pContext;

        const isCreateMode = type === UserEventType.CREATE;

        log.debug("[afterSubmit] type", type);
        log.debug("[afterSubmit]", `isCreateMode [${isCreateMode}]`);

        if (!isCreateMode) {
            return;
        }

        const createdFrom = newRecord.getValue({
            fieldId: "createdfrom",
        });

        const saleOrder = record.load({
            type: record.Type.SALES_ORDER,
            id: createdFrom,
        });

        try {
            const soNumberID = saleOrder.getText({
                fieldId: "tranid",
            });

            const soNumber = String(soNumberID).replace(/\D/g, "");

            newRecord.setValue({
                fieldId: "tranid",
                value: `INV${soNumber}`,
            });
        } catch (error) {
            handleError(error);
        }
    } catch (error) {
        handleError(error);
    }
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
