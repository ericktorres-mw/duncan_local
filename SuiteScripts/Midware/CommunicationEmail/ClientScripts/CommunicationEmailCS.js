/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/url", "N"], function (require, exports, log, url, N_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var isPopupOpen = false; // Global variable to track popup state
    var currentPopup = null; // Reference to current popup
    function fieldChanged(pContext) {
        try {
            var currentRecord = pContext.currentRecord;
            var fieldId = pContext.fieldId;
            if (fieldId === "entity" || fieldId === "tobeemailed") {
                console.log("clear email field");
                currentRecord.setValue({
                    fieldId: "email",
                    value: "",
                });
            }
            if (fieldId === "entity") {
                currentRecord.setValue({
                    fieldId: "tobeemailed",
                    value: false,
                });
                setSendToAP(pContext, true);
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.fieldChanged = fieldChanged;
    function pageInit(pContext) {
        try {
            var currentRecord = pContext.currentRecord;
            currentRecord.setValue({
                fieldId: "email",
                value: "",
            });
            setSendToAP(pContext);
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.pageInit = pageInit;
    function saveRecord(pContext) {
        try {
            var currentRecord = pContext.currentRecord;
            var tobeemailed = currentRecord.getValue({ fieldId: "tobeemailed" });
            var email = currentRecord.getValue({ fieldId: "email" });
            if (tobeemailed && !email) {
                console.log("showEmailDialog");
                showEmailDialog(currentRecord);
                return false;
            }
            return true;
        }
        catch (error) {
            handleError(error);
        }
    }
    exports.saveRecord = saveRecord;
    function showEmailDialog(currentRecord) {
        if (isPopupOpen) {
            currentPopup.focus();
            console.log("Popup already open, ignoring request");
            return;
        }
        // Create URL to suitelet with items data
        var suiteletUrl = url.resolveScript({
            scriptId: "customscript_mw_emai_recipients_email",
            deploymentId: "customdeploy_mw_email_recipients_email_d",
            params: {
                customerId: currentRecord.getValue({ fieldId: "entity" }),
            },
        });
        isPopupOpen = true;
        // Open popup window
        currentPopup = window.open(suiteletUrl, "itemSelection", "width=850,height=500,resizable=yes,scrollbars=yes");
        // Check if popup was blocked
        if (!currentPopup) {
            isPopupOpen = false;
            alert("Popup was blocked. Please allow popups for this site.");
            return;
        }
        // Monitor popup closure
        var checkClosed = setInterval(function () {
            if (currentPopup && currentPopup.closed) {
                clearInterval(checkClosed);
                currentRecord.setValue({
                    fieldId: "tobeemailed",
                    value: false,
                });
                isPopupOpen = false;
                currentPopup = null;
                console.log("Popup closed, state reset");
            }
        }, 1000);
        // Listen for data from popup
        window.addEventListener("message", function (event) {
            console.log("event", event.data);
            if (event.data &&
                event.data.emails &&
                event.data.dontSendEmail &&
                event.data.type === "customEmailSelection") {
                // Set the selected items to your field
                currentRecord.setValue({
                    fieldId: "email",
                    value: event.data.emails.join(","),
                });
                // Reset popup state
                isPopupOpen = false;
                if (currentPopup && !currentPopup.closed) {
                    currentPopup.close();
                }
                currentPopup = null;
                var emailValue = currentRecord.getValue("email");
                if (event.data.dontSendEmail === "T") {
                    currentRecord.setValue({
                        fieldId: "tobeemailed",
                        value: false,
                    });
                    NLMultiButton_doAction("multibutton_submitter", "submitter");
                    return;
                }
                if (emailValue) {
                    try {
                        //This will send the email on save, we cant use saveemail directly as we also need to print the pdf
                        currentRecord.setValue({
                            fieldId: "tobeemailed",
                            value: true,
                            ignoreFieldChange: true,
                        });
                        //Also show the print screen
                        NLMultiButton_doAction("multibutton_submitter", "saveprint");
                    }
                    catch (error) {
                        console.error("Error saving record:", error);
                        alert("Email was set but there was an error saving the record: Plase save it manually");
                    }
                }
                else {
                    currentRecord.setValue({
                        fieldId: "tobeemailed",
                        value: false,
                    });
                    alert("You need to select at least one email address. Please try again. Or click Save instead");
                }
            }
        }, { once: true });
    }
    function setSendToAP(pContext, revert) {
        if (revert === void 0) { revert = false; }
        var customer = pContext.currentRecord.getValue({
            fieldId: "entity",
        });
        var customerRecord = N_1.record.load({
            type: N_1.record.Type.CUSTOMER,
            id: customer,
        });
        var sendToAp = customerRecord.getValue({
            fieldId: "custentity_mw_send_invoice_to_ap",
        });
        if (sendToAp === true) {
            console.log("Changing default save options for this record");
            jQuery("#btn_multibutton_submitter")
                .val("Save & Email AP")
                .attr("data-nsps-label", "Save & Email AP");
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.text = "\n            (function() {\n              var btn = getNLMultiButtonByName('multibutton_submitter');\n              if (!btn) return;\n              // Get the option that is missing, add it again and remove the save & print one\n              var existingLabels = btn.sParams.map(function (p) { return p[0]; });\n              btn.pValues.forEach(function (p) {\n                var label = p[0];\n                var action = p[1];\n    \n                if (!existingLabels.includes(label)) {\n                  btn.sParams.push([\n                    label,\n                    \"javascript:NLMultiButton_doAction('multibutton_submitter', '\" + action + \"');return false;\",\n                    \"\"\n                  ]);\n                }\n              });\n    \n              // 3\uFE0F\u20E3 Remove \"Save & Email\" from sParams\n              btn.sParams = btn.sParams.filter(function (p) {\n                return p[0] !== \"Save & Email\";\n              });\n      \n              //Set default to 'Save & Email'\n                const defaultIndex = btn.pValues.findIndex(p => p[0] === 'Save & Email');\n                if (defaultIndex !== -1) {\n                  btn.nDefault = defaultIndex;\n      \n                  // Update main button label\n                  if (btn.btnMain) {\n                    btn.btnMain.value = 'Save & Email AP';\n                  }\n                }\n      \n                // 4\uFE0F\u20E3 Ensure sName is correct\n                btn.sName = 'multibutton_submitter';\n              try { btn.render(); } catch(e){console.error(e);}\n            })();\n          ";
            document.body.appendChild(script);
        }
        else {
            if (revert) {
                console.log("Reverting save options back to default");
                jQuery("#btn_multibutton_submitter")
                    .val("Save")
                    .attr("data-nsps-label", "Save");
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.text = "\n      (function() {\n        var btn = getNLMultiButtonByName('multibutton_submitter');\n        if (!btn) return;\n  \n        // Ensure \"Save & Email\" exists again in sParams\n        var hasSaveEmail = btn.sParams.some(p => p[0] === \"Save & Email\");\n        if (!hasSaveEmail) {\n          btn.sParams.push([\n            \"Save & Email\",\n            \"javascript:NLMultiButton_doAction('multibutton_submitter', 'saveemail');return false;\",\n            \"\"\n          ]);\n        }\n  \n        // Reset default to \"Save\"\n        const saveIndex = btn.pValues.findIndex(p => p[0] === 'Save');\n        if (saveIndex !== -1) {\n          btn.nDefault = saveIndex;\n  \n          if (btn.btnMain) {\n            btn.btnMain.value = 'Save';\n          }\n        }\n  \n        btn.sName = 'multibutton_submitter';\n        try { btn.render(); } catch(e){ console.error(e); }\n      })();\n    ";
                document.body.appendChild(script);
            }
        }
    }
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
