/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import { EntryPoints } from "N/types";

import * as log from "N/log";
import * as serverWidget from "N/ui/serverWidget";
import * as record from "N/record";

export function beforeLoad(pContext: EntryPoints.UserEvent.beforeLoadContext) {
    try {
        if (pContext.type) {
            const form = pContext.form;

            const gavlPickupOverride = form.addField({
                type: serverWidget.FieldType.TEXT,
                id: "custpage_mw_gavl_pickup_override",
                label: "null",
            });

            const customer = pContext.newRecord.getValue({
                fieldId: "entity",
            });

            if (customer) {
                const customerRecord = record.load({
                    type: record.Type.CUSTOMER,
                    id: customer,
                });
                gavlPickupOverride.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                pContext.newRecord.setValue({
                    fieldId: "custpage_mw_gavl_pickup_override",
                    value: customerRecord.getValue({
                        fieldId: "custentity_mw_gavl_pickup_override",
                    }),
                });
            }
        }
    } catch (error) {
        handleError(error);
    }
}

export function beforeSubmit(pContext: EntryPoints.UserEvent.beforeSubmitContext) {
    try {
        let oldRec = pContext.oldRecord;
        let rec = pContext.newRecord;

        let trackedJobName = rec.getValue("custbody_pl_dn_trck_job") ? rec.getText("custbody_pl_dn_trck_job") : null;

        if (trackedJobName) {
            let oldTrackedJobName = rec.getValue("custbody_pl_dn_trck_job") ? rec.getText("custbody_pl_dn_trck_job") : null;

            if (trackedJobName != oldTrackedJobName) {
                rec.setValue({
                    fieldId: "custbody_platve_duncan_non_tracked_pj",
                    value: trackedJobName.toString(),
                });
            }
        }
    } catch (error) {
        handleError(error);
    }
}

export function afterSubmit(pContext: EntryPoints.UserEvent.afterSubmitContext) {
    try {
    } catch (error) {
        handleError(error);
    }
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
