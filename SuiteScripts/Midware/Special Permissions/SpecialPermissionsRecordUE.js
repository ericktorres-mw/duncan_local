/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/ui/serverWidget"], function (require, exports, log, serverWidget) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = void 0;
    var beforeLoad = function (pContext) {
        var newRecord = pContext.newRecord, form = pContext.form, type = pContext.type, UserEventType = pContext.UserEventType;
        var recordType = newRecord.type;
        var isViewMode = type === UserEventType.VIEW;
        var isEditMode = type === UserEventType.EDIT;
        log.debug("[beforeLoad] recordType - isViewMode - isEditMode", "".concat(recordType, " - ").concat(isViewMode));
        if (!(isEditMode || isViewMode)) {
            return;
        }
        // Vendor
        var fullVendorAccess = newRecord.getValue({ fieldId: "custrecord_mw_spec_perm_vend_over" });
        if (fullVendorAccess) {
            if (isViewMode) {
                form.getField({ id: "custrecord_mw_spec_perm_cats" }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN,
                });
            }
            else if (isEditMode) {
                form.getField({ id: "custrecord_mw_spec_perm_cats" }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });
            }
        }
        return;
    };
    exports.beforeLoad = beforeLoad;
});
