/**
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/search", "N/record", "N/runtime"], function (require, exports, log, search, record, runtime) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.handleError = exports.validateVendorPermissions = exports.getVendorInformation = exports.isValidRecord = exports.getPermissions = void 0;
    var getPermissions = function () {
        var _a;
        try {
            var user = runtime.getCurrentUser();
            var permissionsSearch = search.create({
                type: "customrecord_mw_spec_rec_perms",
                filters: [["custrecord_mw_spec_perm_role", search.Operator.ANYOF, user.role]],
                columns: [
                    "custrecord_mw_spec_perm_role",
                    "custrecord_mw_spec_perm_cats",
                    "custrecord_mw_spec_perm_vend_ena",
                    "custrecord_mw_spec_perm_vend_over",
                ],
            });
            var results = permissionsSearch.run().getRange({ start: 0, end: 1 });
            if (results && results.length) {
                var result = results[0];
                return {
                    user: user,
                    role: result.getValue("custrecord_mw_spec_perm_role"),
                    is_vendor_enabled: result.getValue("custrecord_mw_spec_perm_vend_ena"),
                    override_vendor_cats: result.getValue("custrecord_mw_spec_perm_vend_over"),
                    vendor_categories: (_a = (result.getValue("custrecord_mw_spec_perm_cats") || "")) === null || _a === void 0 ? void 0 : _a.split(",").map(function (cat) { return cat.trim(); }),
                };
            }
        }
        catch (error) {
            (0, exports.handleError)(error);
        }
        return null;
    };
    exports.getPermissions = getPermissions;
    var isValidRecord = function (recordType) {
        var _a;
        var validRecordTypes = (_a = {},
            _a[record.Type.VENDOR] = true,
            _a[record.Type.VENDOR_BILL] = true,
            _a[record.Type.VENDOR_PAYMENT] = true,
            _a[record.Type.PURCHASE_ORDER] = true,
            _a);
        return recordType in validRecordTypes;
    };
    exports.isValidRecord = isValidRecord;
    // Vendor
    var getVendorInformation = function (vendorId) {
        var _a, _b;
        try {
            var vendorLookup = search.lookupFields({
                type: search.Type.VENDOR,
                id: vendorId,
                columns: ["category"],
            });
            if (vendorLookup) {
                var categoryValue = ((_b = (_a = vendorLookup.category) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || null;
                return {
                    category: categoryValue,
                };
            }
        }
        catch (error) {
            (0, exports.handleError)(error);
        }
        return null;
    };
    exports.getVendorInformation = getVendorInformation;
    var validateVendorPermissions = function (permissions, vendorId, vendorFunction) {
        if (!vendorId) {
            return;
        }
        var vendorInformation = (0, exports.getVendorInformation)(vendorId);
        if (vendorInformation) {
            var category = vendorInformation.category;
            if (!permissions.override_vendor_cats && category && permissions.vendor_categories.indexOf(category) < 0) {
                vendorFunction();
            }
            else if (!category) {
                return;
            }
        }
        else {
            vendorFunction();
        }
    };
    exports.validateVendorPermissions = validateVendorPermissions;
    var handleError = function (pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    };
    exports.handleError = handleError;
});
