/**
 * @NApiVersion 2.1
 * Shared functions for Vendor Item Filtering on Purchase Orders
 */

import search = require("N/search");
import log = require("N/log");

/**
 * Fetches all active purchase items for a specific vendor
 * @param vendorId - Internal ID of the vendor
 * @returns Array of vendor items with id and name
 */
export function fetchVendorItems(
  vendorId: string
): Array<{ id: string; name: string }> {
  try {
    log.audit({
      title: "Fetching Vendor Items",
      details: `Vendor ID: ${vendorId}`,
    });

    // Search for items matching these criteria:
    // 1. Item is active (required for all)
    // 2. Item subtype is Purchase
    // 3. Item is assigned to this vendor OR has no vendor assigned
    const itemSearch = search.create({
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

    const itemResults: Array<{ id: string; name: string }> = [];
    const pagedData = itemSearch.runPaged({ pageSize: 1000 });

    pagedData.pageRanges.forEach(function (pageRange) {
      const page = pagedData.fetch({ index: pageRange.index });
      page.data.forEach(function (result) {
        itemResults.push({
          id: result.getValue("internalid") as string,
          name:
            (result.getValue("displayname") as string) ||
            (result.getValue("itemid") as string),
        });
      });
    });

    log.audit({
      title: "Vendor Items Fetched",
      details: `Found ${itemResults.length} items for vendor ${vendorId}`,
    });

    return itemResults;
  } catch (error) {
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
