/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Duncan Midware
 * @contact contact@midware.net
 * @description Filters items on Purchase Order based on vendor selection
 */
define(["N/search"], function (search) {
  /**
   * Page Init - Filters items when form loads in edit mode
   */
  function pageInit(context) {
    console.log("pageInit - Script started", {
      mode: context.mode,
      type: context.type,
    });

    var currentRec = context.currentRecord;
    var vendor = currentRec.getValue({ fieldId: "entity" });

    console.log("pageInit - Vendor retrieved", {
      vendorId: vendor,
      mode: context.mode,
    });

    if (vendor && context.mode === "edit") {
      console.log("pageInit - Calling filterItemsByVendor");
      filterItemsByVendor(currentRec, vendor);
    } else {
      console.log("pageInit - Conditions not met for filtering", {
        hasVendor: !!vendor,
        isEditMode: context.mode === "edit",
      });
    }
  }

  /**
   * Field Changed - Filters items when vendor is changed
   */
  function fieldChanged(context) {
    var currentRec = context.currentRecord;
    var fieldId = context.fieldId;

    console.log("fieldChanged - Event triggered", {
      fieldId: fieldId,
      sublistId: context.sublistId,
    });

    if (fieldId === "entity") {
      var vendor = currentRec.getValue({ fieldId: "entity" });

      console.log("fieldChanged - Vendor field changed", {
        newVendorId: vendor,
      });

      if (vendor) {
        console.log("fieldChanged - Calling filterItemsByVendor");
        filterItemsByVendor(currentRec, vendor);
      } else {
        console.log("fieldChanged - Vendor is empty, skipping filter");
      }
    }
  }

  /**
   * Filters the item field based on vendor
   */
  function filterItemsByVendor(currentRec, vendorId) {
    console.log("filterItemsByVendor - Started", {
      vendorId: vendorId,
    });

    try {
      // Search for items where the vendor is in the item's vendor list
      console.log("filterItemsByVendor - Creating item search");
      var itemSearch = search.create({
        type: search.Type.ITEM,
        filters: [
          ["isinactive", "is", "F"],
          "AND",
          ["vendor", "anyof", vendorId],
        ],
        columns: ["internalid", "itemid", "displayname", "vendor"],
      });

      console.log("filterItemsByVendor - Running search");
      var itemResults = [];
      var pagedData = itemSearch.runPaged({ pageSize: 1000 });

      console.log("filterItemsByVendor - Paged search created", {
        pageCount: pagedData.pageRanges.length,
      });

      pagedData.pageRanges.forEach(function (pageRange) {
        var page = pagedData.fetch({ index: pageRange.index });
        page.data.forEach(function (result) {
          itemResults.push(result);
        });
      });

      console.log("filterItemsByVendor - Search completed", {
        resultsCount: itemResults.length,
      });

      // Get the item field on the sublist
      console.log("filterItemsByVendor - Getting item field");
      var itemField = currentRec.getSublistField({
        sublistId: "item",
        fieldId: "item",
      });

      if (itemField) {
        console.log("filterItemsByVendor - Item field found, clearing options");
        // Clear existing options
        itemField.removeSelectOption({ value: null });

        console.log("filterItemsByVendor - Adding filtered items as options");
        // Add filtered items as options
        itemResults.forEach(function (result, index) {
          var itemId = result.getValue("internalid");
          var itemName =
            result.getValue("displayname") || result.getValue("itemid");

          itemField.addSelectOption({
            value: itemId,
            text: itemName,
          });

          if (index < 5) {
            console.log("filterItemsByVendor - Added item option", {
              itemId: itemId,
              itemName: itemName,
            });
          }
        });

        console.log("filterItemsByVendor - Completed successfully", {
          totalItemsAdded: itemResults.length,
          vendorId: vendorId,
        });
      } else {
        console.warn("filterItemsByVendor - Item field not found");
      }
    } catch (e) {
      console.error("filterItemsByVendor - Error occurred", {
        errorMessage: e.message,
        errorName: e.name,
        errorStack: e.stack,
        vendorId: vendorId,
      });
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
  };
});
