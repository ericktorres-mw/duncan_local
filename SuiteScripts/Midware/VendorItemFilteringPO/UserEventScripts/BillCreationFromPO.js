/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log"], function (require, exports, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = void 0;
    function beforeLoad(pContext) {
        try {
            if (pContext.type === pContext.UserEventType.CREATE) {
                var newVendorBill = pContext.newRecord;
                // Check if there are item lines with PO references
                var itemLineCount = newVendorBill.getLineCount({
                    sublistId: "item",
                });
                log.debug({
                    title: "beforeLoad - Bill Creation",
                    details: JSON.stringify({ itemLineCount: itemLineCount }),
                });
                if (itemLineCount > 0) {
                    log.audit({
                        title: "beforeLoad - Bill from PO Detected",
                        details: "updating ".concat(itemLineCount, " item lines"),
                    });
                    // Remove all item lines in reverse order to avoid index shifting issues
                    for (var i = itemLineCount - 1; i >= 0; i--) {
                        log.debug("line orderdoc", newVendorBill.getSublistValue({
                            sublistId: "item",
                            fieldId: "orderdoc",
                            line: i,
                        }));
                        if (newVendorBill.getSublistValue({
                            sublistId: "item",
                            fieldId: "orderdoc",
                            line: i,
                        })) {
                            newVendorBill.setSublistValue({
                                sublistId: "item",
                                fieldId: "amount",
                                line: i,
                                value: "0",
                            });
                        }
                    }
                    log.audit({
                        title: "beforeLoad - Items Updated",
                        details: "Removed ".concat(itemLineCount, " item lines"),
                    });
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
    } */
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
