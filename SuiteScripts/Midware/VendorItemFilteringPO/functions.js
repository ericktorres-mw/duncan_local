/**
 * @NApiVersion 2.1
 * Shared functions for Vendor Item Filtering on Purchase Orders
 */
define(["require", "exports", "N/search", "N/log"], function (require, exports, search, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fetchVendorItems = void 0;
    /**
     * Fetches all active purchase items for a specific vendor
     * @param vendorId - Internal ID of the vendor
     * @returns Array of vendor items with id and name
     */
    function fetchVendorItems(vendorId) {
        try {
            log.audit({
                title: "Fetching Vendor Items",
                details: "Vendor ID: ".concat(vendorId),
            });
            // Search for items matching these criteria:
            // 1. Item is active (required for all)
            // 2. Item subtype is Purchase
            // 3. Item is assigned to this vendor OR has no vendor assigned
            var itemSearch = search.create({
                type: search.Type.ITEM,
                filters: [
                    ["isinactive", "is", "F"],
                    "AND",
                    ["subtype", "anyof", "Purchase"],
                    "AND",
                    [
                        ["vendor", "anyof", vendorId],
                        "OR",
                        ["othervendor", "anyof", vendorId],
                        "OR",
                        ["vendor", "anyof", "@NONE@"],
                    ],
                ],
                columns: ["internalid", "itemid", "displayname"],
            });
            var itemResults_1 = [];
            var pagedData_1 = itemSearch.runPaged({ pageSize: 1000 });
            pagedData_1.pageRanges.forEach(function (pageRange) {
                var page = pagedData_1.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    itemResults_1.push({
                        id: result.getValue("internalid"),
                        name: result.getValue("displayname") ||
                            result.getValue("itemid"),
                    });
                });
            });
            log.audit({
                title: "Vendor Items Fetched",
                details: "Found ".concat(itemResults_1.length, " items for vendor ").concat(vendorId),
            });
            return itemResults_1;
        }
        catch (error) {
            log.error({
                title: "Error Fetching Vendor Items",
                details: JSON.stringify({
                    vendorId: vendorId,
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                }),
            });
            // Return empty array on error rather than throwing
            return [];
        }
    }
    exports.fetchVendorItems = fetchVendorItems;
});
