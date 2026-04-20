/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/currentRecord", "./Global/Functions"], function (require, exports, currentRecord, Functions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fieldChanged = void 0;
    var PERMISSION_ERROR_MESSAGE = "You do not have permission for this vendor category";
    function fieldChanged(pContext) {
        try {
            var currentRecord_1 = pContext.currentRecord, fieldId = pContext.fieldId;
            if (fieldId == "entity") {
                var permissions = (0, Functions_1.getPermissions)();
                if (!permissions) {
                    alertUser();
                    return;
                }
                var vendorId = currentRecord_1.getValue({ fieldId: fieldId });
                (0, Functions_1.validateVendorPermissions)(permissions, vendorId, alertUser);
            }
        }
        catch (error) {
            (0, Functions_1.handleError)(error);
        }
    }
    exports.fieldChanged = fieldChanged;
    var alertUser = function () {
        alert(PERMISSION_ERROR_MESSAGE);
        var cr = currentRecord.get();
        cr.setValue({ fieldId: "entity", value: null, ignoreFieldChange: true, fireSlavingSync: true });
    };
});
