/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import { EntryPoints } from "N/types";

export function pageInit(pContext: EntryPoints.Client.pageInitContext) {
    return;
}

export function fieldChanged(pContext: EntryPoints.Client.fieldChangedContext) {
    const { fieldId, currentRecord } = pContext;

    const fieldValue = currentRecord.getValue({ fieldId });

    if (fieldId === "custrecord_mw_spec_perm_vend_over") {
        currentRecord.getField({ fieldId: "custrecord_mw_spec_perm_cats" })!.isDisabled = fieldValue;
    }
}
