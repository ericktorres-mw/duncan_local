/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/ui/serverWidget", "N/record"], function (require, exports, log, serverWidget, record) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = exports.beforeSubmit = exports.beforeLoad = void 0;
    function beforeLoad(pContext) {
        try {
            if (pContext.type) {
                var form = pContext.form;
                var gavlPickupOverride = form.addField({
                    type: serverWidget.FieldType.TEXT,
                    id: "custpage_mw_gavl_pickup_override",
                    label: "null",
                });
                var customer = pContext.newRecord.getValue({
                    fieldId: "entity",
                });
                if (customer) {
                    var customerRecord = record.load({
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
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.beforeLoad = beforeLoad;
    function beforeSubmit(pContext) {
        try {
            var oldRec = pContext.oldRecord;
            var rec = pContext.newRecord;
            var trackedJobName = rec.getValue("custbody_pl_dn_trck_job") ? rec.getText("custbody_pl_dn_trck_job") : null;
            if (trackedJobName) {
                var oldTrackedJobName = rec.getValue("custbody_pl_dn_trck_job") ? rec.getText("custbody_pl_dn_trck_job") : null;
                if (trackedJobName != oldTrackedJobName) {
                    rec.setValue({
                        fieldId: "custbody_platve_duncan_non_tracked_pj",
                        value: trackedJobName.toString(),
                    });
                }
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.beforeSubmit = beforeSubmit;
    function afterSubmit(pContext) {
        try {
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.afterSubmit = afterSubmit;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
