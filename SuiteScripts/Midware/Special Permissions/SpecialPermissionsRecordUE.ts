/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as log from "N/log";
import * as serverWidget from "N/ui/serverWidget";

import { EntryPoints } from "N/types";

export const beforeLoad = (pContext: EntryPoints.UserEvent.beforeLoadContext) => {
    const { newRecord, form, type, UserEventType } = pContext;

    const { type: recordType } = newRecord;

    const isViewMode = type === UserEventType.VIEW;
    const isEditMode = type === UserEventType.EDIT;

    log.debug("[beforeLoad] recordType - isViewMode - isEditMode", `${recordType} - ${isViewMode}`);

    if (!(isEditMode || isViewMode)) {
        return;
    }

    // Vendor

    const fullVendorAccess = newRecord.getValue({ fieldId: "custrecord_mw_spec_perm_vend_over" });

    if (fullVendorAccess) {
        if (isViewMode) {
            form.getField({ id: "custrecord_mw_spec_perm_cats" }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
        } else if (isEditMode) {
            form.getField({ id: "custrecord_mw_spec_perm_cats" }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
            });
        }
    }

    return;
};
