/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "./Functions/TransactionFunctions"], function (require, exports, log, TransactionFunctions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addMinimumOrderChargeToSummary = exports.saveRecord = void 0;
    function saveRecord(pContext) {
        try {
            var currentRecord = pContext.currentRecord;
            var customerOverride = currentRecord.getValue({ fieldId: "custbody_mw_order_amount_override" });
            if (!customerOverride) {
                var subTotal = currentRecord.getValue({ fieldId: "subtotal" });
                log.debug("[saveRecord] customerOverride", customerOverride);
                log.debug("[saveRecord] totalAmount", subTotal);
                var totalAmount = Number(subTotal);
                var customer = currentRecord.getValue({ fieldId: "entity" });
                var customerMinimumOrderAmount = (0, TransactionFunctions_1.getCustomerMinimumOrderAmount)(customer);
                log.debug("[saveRecord] customerMinimumOrderAmount", customerMinimumOrderAmount);
                if (Number(totalAmount) < customerMinimumOrderAmount) {
                    var response = confirm("This customer minimum order amount is ".concat(formatAsCurrency(customerMinimumOrderAmount), ". Do you want to continue?"));
                    currentRecord.setValue({ fieldId: "custbody_mw_complement_order_min", value: response });
                    return response;
                }
                else {
                    currentRecord.setValue({ fieldId: "custbody_mw_complement_order_min", value: false });
                }
            }
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.saveRecord = saveRecord;
    function addMinimumOrderChargeToSummary(minimumOrderAmount, actualSubTotal, isViewMode) {
        try {
            if (minimumOrderAmount < 0 || !isViewMode)
                return;
            var table = document.getElementsByClassName("totallingtable")[0];
            var tableBody = table === null || table === void 0 ? void 0 : table.tBodies[0];
            if (!tableBody)
                return;
            var children = tableBody.children;
            // Find the insertion point (last row with content)
            var insertIndex = children.length;
            for (var i = children.length - 1; i >= 0; i--) {
                var row = children[i];
                if (!row.classList.contains("totallingtable_item")) {
                    insertIndex = i - 1;
                    break;
                }
            }
            if (actualSubTotal) {
                children[0].children[0].children[0].children[1].innerHTML = formatAsCurrency(actualSubTotal).replace("$", "");
            }
            var newRow = document.createElement("tr");
            newRow.className = "totallingtable_item uir-field-wrapper-cell";
            newRow.innerHTML = "\n        <td>\n            <div>\n                <span class=\"smalltextnolink uir-label\">\n                    <span class=\"uir-label-span smalltextnolink\">Minimum Order Charge</span>\n                </span>\n                <span class=\"uir-field inputreadonly\">\n                    ".concat(formatAsCurrency(minimumOrderAmount).replace("$", ""), "\n                </span>\n            </div>\n        </td>\n    ");
            if (insertIndex < children.length) {
                tableBody.insertBefore(newRow, children[insertIndex]);
            }
            else {
                tableBody.appendChild(newRow);
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.addMinimumOrderChargeToSummary = addMinimumOrderChargeToSummary;
    function formatAsCurrency(value) {
        return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
    }
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
