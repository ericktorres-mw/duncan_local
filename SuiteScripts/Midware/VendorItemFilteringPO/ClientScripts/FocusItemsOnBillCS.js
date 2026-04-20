/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log"], function (require, exports, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pageInit = void 0;
    function pageInit(pContext) {
        try {
            if (pContext.mode === "copy") {
                console.log("FocusItemsOnBillCS - Switching to expense tab");
                switchToExpenseTab();
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.pageInit = pageInit;
    function switchToExpenseTab() {
        // Function to attempt the tab switch
        function attemptSwitch() {
            try {
                // Check if the expense tab element exists
                var expenseTab = document.getElementById("expensetxt");
                if (!expenseTab) {
                    return false;
                }
                console.log("FocusItemsOnBillCS - Expense tab element found");
                // Check if NetSuite's ShowitemsMachine function is available
                if (typeof window.ShowitemsMachine === "function") {
                    window.shownmachine = "expense";
                    window.ShowitemsMachine("expense");
                    return true;
                }
                else {
                    console.log("FocusItemsOnBillCS - ShowitemsMachine not found");
                    return false;
                }
            }
            catch (e) {
                console.error("FocusItemsOnBillCS - Error switching to expense tab:", e);
                return false;
            }
        }
        if (attemptSwitch()) {
            return;
        }
    }
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
