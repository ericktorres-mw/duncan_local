/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define(["require", "exports", "N/log", "N/runtime", "../functions"], function (require, exports, log, runtime, functions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.saveRecord = exports.pageInit = exports.postSourcing = exports.fieldChanged = exports.lineInit = void 0;
    // Global variable to store current vendor items
    var currentVendorItems = [];
    // Flag to track if we're currently saving
    var isSaving = false;
    var MISC_ITEM_ID = "434";
    function lineInit(pContext) {
        try {
            var currentRecord = pContext.currentRecord;
            var sublistId = pContext.sublistId;
            // Don't do anything if we're currently saving
            if (isSaving) {
                console.log("lineInit - skipping because save is in progress");
                return;
            }
            if (sublistId === "item") {
                // Set default item to "misc" (ID 434) for new lines
                var currentItem = currentRecord.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                });
                // Only set default if item field is empty
                if (!currentItem) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: MISC_ITEM_ID,
                    });
                    console.log("Set default item to misc (434)");
                }
                // Use global vendor items or get from hidden field
                var vendorItems = currentVendorItems;
                if (vendorItems.length === 0) {
                    var vendorItemsData = currentRecord.getValue({
                        fieldId: "custpage_vendor_items_data",
                    });
                    if (vendorItemsData) {
                        vendorItems = JSON.parse(vendorItemsData);
                        currentVendorItems = vendorItems;
                    }
                }
                if (vendorItems.length > 0) {
                    console.log("lineInit triggered - Setting up item field interception for", vendorItems.length, "vendor items");
                    // Set up click interception on the item field
                    setupItemFieldInterception(currentRecord);
                }
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.lineInit = lineInit;
    function setupItemFieldInterception(currentRecord) {
        try {
            // Find the item field input that's currently active
            var itemInputs = document.querySelectorAll('input[name^="inpt_item"]');
            console.log("Found", itemInputs.length, "item input fields");
            itemInputs.forEach(function (input) {
                var _a;
                // Check if we've already set up this input
                if (input.getAttribute("data-vendor-filter-setup") === "true") {
                    return;
                }
                // Mark this input as set up
                input.setAttribute("data-vendor-filter-setup", "true");
                // Add mousedown event to show custom modal (fires before click)
                // Use global currentVendorItems instead of closure variable
                input.addEventListener("mousedown", function (e) {
                    // Only trigger on real user interactions, not programmatic events
                    if (!e.isTrusted) {
                        console.log("Ignoring programmatic mousedown event");
                        return;
                    }
                    // Only prevent default, don't stop propagation globally
                    e.preventDefault();
                    console.log("Item field mousedown - showing vendor modal");
                    showVendorItemModal(currentRecord, currentVendorItems);
                });
                // Also intercept click to prevent default behavior
                input.addEventListener("click", function (e) {
                    // Only trigger on real user interactions, not programmatic events
                    if (!e.isTrusted) {
                        console.log("Ignoring programmatic click event");
                        return;
                    }
                    // Only prevent default, don't stop propagation globally
                    e.preventDefault();
                });
                // Also intercept keydown to prevent manual typing
                input.addEventListener("keydown", function (e) {
                    // Only show modal if it's a character key or backspace/delete
                    // Ignore tab, escape, and other navigation keys
                    if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
                        e.preventDefault();
                        console.log("Item field keydown - showing vendor modal with key:", e.key);
                        // Pass the pressed key to the modal (empty string for backspace/delete)
                        var initialSearch = e.key.length === 1 ? e.key : "";
                        showVendorItemModal(currentRecord, currentVendorItems, initialSearch);
                    }
                });
                // Make field readonly to prevent typing
                input.setAttribute("readonly", "true");
                // Also intercept the dropdown arrow click
                var dropdownArrow = (_a = input.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector(".ddarrowSpan");
                if (dropdownArrow) {
                    if (dropdownArrow.getAttribute("data-vendor-filter-setup") !== "true") {
                        dropdownArrow.setAttribute("data-vendor-filter-setup", "true");
                        // Use mousedown for immediate response
                        dropdownArrow.addEventListener("mousedown", function (e) {
                            e.preventDefault();
                            console.log("Dropdown arrow mousedown - showing vendor modal");
                            showVendorItemModal(currentRecord, currentVendorItems);
                        });
                        // Also intercept click to prevent default behavior
                        dropdownArrow.addEventListener("click", function (e) {
                            e.preventDefault();
                        });
                    }
                }
            });
        }
        catch (e) {
            console.error("Error setting up item field interception:", e);
        }
    }
    function showVendorItemModal(currentRecord, vendorItems, initialSearch) {
        var _a;
        if (initialSearch === void 0) { initialSearch = ""; }
        try {
            // Function to hide native NetSuite dropdowns
            var hideNativeDropdowns = function () {
                // Comprehensive list of selectors for NetSuite dropdowns
                var selectors = ['div[class*="dropdown"]'];
                var nativeDropdowns = document.querySelectorAll(selectors.join(", "));
                nativeDropdowns.forEach(function (dropdown) {
                    // Use cssText for more aggressive styling with !important
                    dropdown.style.cssText += "display: none !important; ";
                });
            };
            setTimeout(hideNativeDropdowns, 30);
            // Create modal overlay
            var overlay_1 = document.createElement("div");
            overlay_1.style.cssText = "\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.5);\n      z-index: 10000;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n    ";
            // Create modal content
            var modal = document.createElement("div");
            modal.style.cssText = "\n      background: white;\n      border-radius: 4px;\n      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n      max-width: 600px;\n      width: 90%;\n      max-height: 80vh;\n      overflow: hidden;\n      display: flex;\n      flex-direction: column;\n    ";
            // Modal header
            var header = document.createElement("div");
            header.style.cssText = "\n      padding: 16px;\n      border-bottom: 1px solid #ddd;\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n    ";
            header.innerHTML = "\n      <h3 style=\"margin: 0;\">Select Vendor Item</h3>\n      <button id=\"closeModal\" style=\"background: none; border: none; font-size: 24px; cursor: pointer;\">&times;</button>\n    ";
            // Search input
            var searchDiv = document.createElement("div");
            searchDiv.style.cssText = "padding: 16px; border-bottom: 1px solid #ddd;";
            searchDiv.innerHTML = "\n      <input type=\"text\" id=\"itemSearch\" placeholder=\"Search items...\" style=\"width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;\">\n    ";
            // Items list
            var itemsList_1 = document.createElement("div");
            itemsList_1.id = "itemsList";
            itemsList_1.style.cssText = "\n      flex: 1;\n      overflow-y: auto;\n      padding: 8px;\n    ";
            // Track currently highlighted item index
            var highlightedIndex_1 = -1;
            // Track if user is navigating with keyboard (to prevent mouse interference)
            var isKeyboardNavigation_1 = false;
            // Function to select an item (shared logic)
            var selectItem_1 = function (item) {
                try {
                    // Set the item value
                    currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: item.id,
                    });
                    console.log("Selected vendor item:", item.name);
                    // Trigger field sourcing by simulating a change event on the actual input
                    setTimeout(function () {
                        var itemInputs = document.querySelectorAll('input[name^="inpt_item"]');
                        itemInputs.forEach(function (input) {
                            // Trigger change event to make NetSuite process the field
                            var changeEvent = new Event("change", { bubbles: true });
                            input.dispatchEvent(changeEvent);
                        });
                    }, 50);
                }
                catch (e) {
                    console.error("Error setting item value:", e);
                }
                // Restore native dropdowns and close modal
                restoreNativeDropdowns_1();
                document.body.removeChild(overlay_1);
            };
            // Populate items function
            var renderItems_1 = function (filter) {
                if (filter === void 0) { filter = ""; }
                itemsList_1.innerHTML = "";
                // Keyword-style search: treat spaces as separators
                // Split filter by spaces and check if ALL keywords are present in the item name
                var keywords = filter
                    .trim()
                    .toLowerCase()
                    .split(/\s+/) // Split by one or more spaces
                    .filter(function (keyword) { return keyword.length > 0; }); // Remove empty strings
                var filtered = vendorItems.filter(function (item) {
                    var itemNameLower = item.name.toLowerCase();
                    // If no keywords, show all items
                    if (keywords.length === 0)
                        return true;
                    // Check if ALL keywords are present in the item name (in any order)
                    return keywords.every(function (keyword) { return itemNameLower.includes(keyword); });
                });
                filtered.forEach(function (item, index) {
                    var itemDiv = document.createElement("div");
                    itemDiv.className = "vendor-item";
                    itemDiv.setAttribute("data-index", index.toString());
                    itemDiv.style.cssText = "\n          padding: 12px;\n          cursor: pointer;\n          border-bottom: 1px solid #f0f0f0;\n          transition: background 0.2s;\n        ";
                    itemDiv.textContent = item.name;
                    itemDiv.addEventListener("mouseenter", function () {
                        // Ignore mouse hover if user is navigating with keyboard
                        if (isKeyboardNavigation_1)
                            return;
                        // Remove highlight from all items
                        var allItems = itemsList_1.querySelectorAll(".vendor-item");
                        allItems.forEach(function (el) {
                            el.style.background = "white";
                            el.style.borderLeft = "3px solid transparent";
                        });
                        itemDiv.style.background = "#f5f5f5";
                        itemDiv.style.borderLeft = "3px solid transparent";
                        highlightedIndex_1 = index;
                    });
                    itemDiv.addEventListener("click", function () {
                        selectItem_1(item);
                    });
                    itemsList_1.appendChild(itemDiv);
                });
                if (filtered.length === 0) {
                    itemsList_1.innerHTML =
                        '<div style="padding: 20px; text-align: center; color: #999;">No items found</div>';
                }
                return filtered;
            };
            renderItems_1();
            // Assemble modal
            modal.appendChild(header);
            modal.appendChild(searchDiv);
            modal.appendChild(itemsList_1);
            overlay_1.appendChild(modal);
            document.body.appendChild(overlay_1);
            // Function to restore native dropdowns
            var restoreNativeDropdowns_1 = function () {
                var dropdowns = document.querySelectorAll('div[class*="dropdown"]');
                dropdowns.forEach(function (dropdown) {
                    dropdown.style.display = "";
                    dropdown.style.visibility = "";
                    dropdown.style.zIndex = "";
                });
            };
            // Event listeners
            (_a = document
                .getElementById("closeModal")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
                restoreNativeDropdowns_1();
                document.body.removeChild(overlay_1);
            });
            overlay_1.addEventListener("click", function (e) {
                if (e.target === overlay_1) {
                    restoreNativeDropdowns_1();
                    document.body.removeChild(overlay_1);
                }
            });
            var searchInput_1 = document.getElementById("itemSearch");
            var currentFilteredItems_1 = [];
            searchInput_1 === null || searchInput_1 === void 0 ? void 0 : searchInput_1.addEventListener("input", function () {
                currentFilteredItems_1 = renderItems_1(searchInput_1.value);
                highlightedIndex_1 = -1; // Reset highlight when filtering
            });
            // Update visual highlight
            var updateHighlight_1 = function (allItems) {
                allItems.forEach(function (item, index) {
                    if (index === highlightedIndex_1) {
                        item.style.background = "#e3f2fd";
                        item.style.borderLeft = "3px solid #2196f3";
                        // Use auto (instant) scrolling for responsive navigation
                        item.scrollIntoView({ block: "nearest", behavior: "auto" });
                    }
                    else {
                        item.style.background = "white";
                        item.style.borderLeft = "3px solid transparent";
                    }
                });
            };
            // Keyboard navigation
            var handleKeyDown = function (e) {
                var allItems = itemsList_1.querySelectorAll(".vendor-item");
                if (allItems.length === 0)
                    return;
                // Arrow Down or Tab
                if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
                    e.preventDefault();
                    isKeyboardNavigation_1 = true; // Mark keyboard navigation active
                    highlightedIndex_1 = (highlightedIndex_1 + 1) % allItems.length;
                    updateHighlight_1(allItems);
                }
                // Arrow Up or Shift+Tab
                else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
                    e.preventDefault();
                    isKeyboardNavigation_1 = true; // Mark keyboard navigation active
                    highlightedIndex_1 =
                        highlightedIndex_1 <= 0 ? allItems.length - 1 : highlightedIndex_1 - 1;
                    updateHighlight_1(allItems);
                }
                // Enter - select highlighted item
                else if (e.key === "Enter" && highlightedIndex_1 >= 0) {
                    e.preventDefault();
                    var selectedItem = currentFilteredItems_1[highlightedIndex_1];
                    if (selectedItem) {
                        selectItem_1(selectedItem);
                    }
                }
                // Escape - close modal
                else if (e.key === "Escape") {
                    e.preventDefault();
                    restoreNativeDropdowns_1();
                    document.body.removeChild(overlay_1);
                }
            };
            // Reset keyboard navigation flag when mouse moves over the list
            itemsList_1.addEventListener("mousemove", function () {
                isKeyboardNavigation_1 = false;
            });
            // Add keyboard listener to search input
            searchInput_1 === null || searchInput_1 === void 0 ? void 0 : searchInput_1.addEventListener("keydown", handleKeyDown);
            // Set initial search value if provided and render filtered items
            if (initialSearch && searchInput_1) {
                searchInput_1.value = initialSearch;
                currentFilteredItems_1 = renderItems_1(initialSearch);
            }
            else {
                currentFilteredItems_1 = renderItems_1();
            }
            // Trap focus within modal - prevent Tab from escaping to background
            modal.addEventListener("keydown", function (e) {
                // Stop all keyboard events from propagating to the page
                e.stopPropagation();
            });
            // Focus search input with a small delay to ensure modal is rendered
            setTimeout(function () {
                if (searchInput_1) {
                    searchInput_1.focus();
                    // Move cursor to end of text instead of selecting it
                    var length_1 = searchInput_1.value.length;
                    searchInput_1.setSelectionRange(length_1, length_1);
                }
            }, 50);
        }
        catch (e) {
            console.error("Error showing vendor item modal:", e);
        }
    }
    function fieldChanged(pContext) {
        return __awaiter(this, void 0, void 0, function () {
            var currentRecord, fieldId, newVendorId, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        currentRecord = pContext.currentRecord;
                        fieldId = pContext.fieldId;
                        if (!(fieldId === "entity")) return [3 /*break*/, 2];
                        newVendorId = currentRecord.getValue({ fieldId: "entity" });
                        if (!newVendorId) return [3 /*break*/, 2];
                        console.log("Vendor changed to:", newVendorId, "- Fetching new vendor items");
                        // Fetch new vendor items from RESTlet
                        return [4 /*yield*/, fetchVendorItems(newVendorId, currentRecord)];
                    case 1:
                        // Fetch new vendor items from RESTlet
                        _a.sent();
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        handleError(error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    exports.fieldChanged = fieldChanged;
    function postSourcing(pContext) {
        try {
            var sublistId = pContext.sublistId;
            var fieldId = pContext.fieldId;
            var currentRecord = pContext.currentRecord;
            //Cancel line to set misc as default item
            if (fieldId === "entity") {
                currentRecord.cancelLine({ sublistId: "item" });
            }
            // After an item is selected on the item sublist, move focus to quantity
            if (sublistId === "item" && fieldId === "item") {
                var itemId = pContext.currentRecord.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                });
                if (itemId && itemId !== MISC_ITEM_ID) {
                    var quantityInput = document.querySelector('input[name="inpt_item"]');
                    if (quantityInput) {
                        quantityInput.focus();
                        quantityInput.select();
                        var activeElement = document.activeElement;
                        var tabEvent = new KeyboardEvent("keydown", {
                            key: "Tab",
                            code: "Tab",
                            keyCode: 9,
                            which: 9,
                            bubbles: true,
                            cancelable: true,
                        });
                        activeElement.dispatchEvent(tabEvent);
                    }
                }
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.postSourcing = postSourcing;
    function fetchVendorItems(vendorId, currentRecord) {
        return __awaiter(this, void 0, void 0, function () {
            var itemResults, error;
            return __generator(this, function (_a) {
                try {
                    console.log("Fetching vendor items for vendor:", vendorId);
                    itemResults = (0, functions_1.fetchVendorItems)(vendorId);
                    console.log("Fetched", itemResults.length, "items for vendor", vendorId);
                    // Update the global vendor items variable
                    currentVendorItems = itemResults;
                    // Re-setup item field interception after fetching new items
                    // This ensures any new lines (like auto-generated ones) get the interception
                    setupItemFieldInterception(currentRecord);
                    console.log(itemResults.length > 0
                        ? "Vendor items updated: " + itemResults.length + " items available"
                        : "No items found for this vendor");
                }
                catch (e) {
                    error = e;
                    console.error("Error fetching vendor items:", error);
                    log.error({
                        title: "Error in fetchVendorItems",
                        details: JSON.stringify({
                            message: error.message,
                            stack: error.stack,
                            vendorId: vendorId,
                        }),
                    });
                    console.error("Error fetching vendor items: " +
                        error.message +
                        ". Please check the console for details.");
                }
                return [2 /*return*/];
            });
        });
    }
    function pageInit(pContext) {
        try {
            console.log("pageInit - Script started");
            var currentRecord = pContext.currentRecord;
            var mode = pContext.mode;
            if (mode === "create") {
                var currentUser = runtime.getCurrentUser();
                pContext.currentRecord.setValue({
                    fieldId: "employee",
                    value: currentUser.id,
                });
            }
            if (mode == "edit" || mode == "create") {
                //This will make the new line default to misc when just editing or creating a record
                pContext.currentRecord.cancelLine({
                    sublistId: "item",
                });
            }
            // Get vendor items data from hidden field and store in global variable
            var vendorItemsData = currentRecord.getValue({
                fieldId: "custpage_vendor_items_data",
            });
            if (vendorItemsData) {
                var vendorItems = JSON.parse(vendorItemsData);
                currentVendorItems = vendorItems;
                console.log("pageInit - Setting up item field interception for", vendorItems.length, "vendor items");
                // Also set up a mutation observer to catch dynamically added lines
                setupDynamicLineObserver(currentRecord);
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.pageInit = pageInit;
    function setupDynamicLineObserver(currentRecord) {
        try {
            // Observe the items table for new rows being added
            var observer = new MutationObserver(function () {
                setupItemFieldInterception(currentRecord);
            });
            // Find the items sublist table
            var itemsTable = document.querySelector('table[id*="_item_splits"]');
            if (itemsTable) {
                observer.observe(itemsTable, { childList: true, subtree: true });
                console.log("Set up mutation observer for dynamic item lines");
            }
        }
        catch (e) {
            console.error("Error setting up mutation observer:", e);
        }
    }
    function saveRecord(pContext) {
        try {
            console.log("saveRecord - Setting isSaving flag to true");
            isSaving = true;
            // Reset the flag after a short delay to allow save to complete
            setTimeout(function () {
                isSaving = false;
                console.log("saveRecord - Reset isSaving flag to false");
            }, 100);
            return true; // Allow save to proceed
        }
        catch (error) {
            isSaving = false; // Reset flag on error
            handleError(error);
            return true; // Allow save to proceed even if error
        }
    }
    exports.saveRecord = saveRecord;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
