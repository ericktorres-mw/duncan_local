/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/ui/serverWidget", "../functions"], function (require, exports, log, serverWidget, functions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = void 0;
    function beforeLoad(pContext) {
        try {
            var newRecord = pContext.newRecord;
            var form = pContext.form;
            // Only filter on create or edit mode
            if (pContext.type === pContext.UserEventType.CREATE ||
                pContext.type === pContext.UserEventType.EDIT) {
                var vendorId = newRecord.getValue({ fieldId: "entity" });
                log.debug({
                    title: "beforeLoad - Vendor detected",
                    details: JSON.stringify({ vendorId: vendorId, type: pContext.type }),
                });
                if (vendorId) {
                    createVendorItemsSublist(form, vendorId);
                }
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.beforeLoad = beforeLoad;
    /* export function beforeSubmit(
      pContext: EntryPoints.UserEvent.beforeSubmitContext
    ) {
      try {
      } catch (error) {
        handleError(error);
      }
    }
    
    export function afterSubmit(
      pContext: EntryPoints.UserEvent.afterSubmitContext
    ) {
      try {
      } catch (error) {
        handleError(error);
      }
    } */
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
    function createVendorItemsSublist(form, vendorId) {
        try {
            log.debug({
                title: "createVendorItemsSublist - Started",
                details: JSON.stringify({ vendorId: vendorId }),
            });
            // Use the shared function to fetch vendor items
            var itemResults = (0, functions_1.fetchVendorItems)(vendorId);
            log.debug({
                title: "createVendorItemsSublist - Search completed",
                details: JSON.stringify({ resultsCount: itemResults.length }),
            });
            // Store vendor items in a hidden field for client script to use
            var itemsJson = JSON.stringify(itemResults);
            var vendorItemsField = form.addField({
                id: "custpage_vendor_items_data",
                type: serverWidget.FieldType.LONGTEXT,
                label: "Vendor Items Data",
            });
            vendorItemsField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            vendorItemsField.defaultValue = itemsJson;
            log.audit({
                title: "createVendorItemsSublist - Completed",
                details: JSON.stringify({
                    totalItemsAvailable: itemResults.length,
                    vendorId: vendorId,
                }),
            });
        }
        catch (e) {
            log.error({
                title: "createVendorItemsSublist - Error occurred",
                details: JSON.stringify({
                    errorMessage: e.message,
                    errorName: e.name,
                    vendorId: vendorId,
                }),
            });
        }
    }
});
