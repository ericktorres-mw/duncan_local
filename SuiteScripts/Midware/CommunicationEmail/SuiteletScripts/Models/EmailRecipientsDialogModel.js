/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/search", "N/record"], function (require, exports, log, search, record) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function getCustomers(customerId) {
        var data = [];
        var contactsSearch = search.create({
            type: search.Type.CONTACT,
            filters: [
                ["company", search.Operator.ANYOF, customerId],
                "AND",
                ["email", search.Operator.ISNOTEMPTY, ""],
            ],
            columns: [
                search.createColumn({ name: "entityid", label: "Name" }),
                search.createColumn({ name: "email", label: "Email" }),
                search.createColumn({ name: "contactrole", label: "Role" }),
            ],
        });
        var customerRecord = record.load({
            type: record.Type.CUSTOMER,
            id: customerId,
        });
        var sendToAp = customerRecord.getValue({
            fieldId: "custentity_mw_send_invoice_to_ap",
        });
        contactsSearch.run().each(function (result) {
            data.push({
                name: result.getValue({ name: "entityid" }),
                email: result.getValue({ name: "email" }),
                role: sendToAp
                    ? result.getValue({ name: "contactrole" })
                    : "",
            });
            return true;
        });
        log.debug("data", data);
        return data;
    }
    exports.getCustomers = getCustomers;
    function getSelectedCustomers(pContext) {
        log.debug("start sent data", "start");
        var emails = [];
        var lineCount = pContext.request.getLineCount("custpage_contact_sublist");
        var dontSendEmail = pContext.request.parameters.custpage_do_not_send_email;
        log.debug("dontSendEmail", dontSendEmail);
        for (var i = 0; i < lineCount; i++) {
            var isSelected = pContext.request.getSublistValue({
                group: "custpage_contact_sublist",
                name: "custpage_select",
                line: i,
            });
            log.debug("isSelected", isSelected);
            if (isSelected === "T") {
                emails.push(pContext.request.getSublistValue({
                    group: "custpage_contact_sublist",
                    name: "custpage_contact_email",
                    line: i,
                }));
            }
        }
        // Send data back to parent window and close
        log.debug("emails sent", emails);
        return "\n        <script>\n            if (window.opener) {\n                window.opener.postMessage({\n                    type: \"customEmailSelection\",\n                    emails: " + JSON.stringify(emails) + ",\n                    dontSendEmail: " + JSON.stringify(dontSendEmail) + "\n                }, \"*\");\n            }\n            window.close();\n        </script>\n            ";
    }
    exports.getSelectedCustomers = getSelectedCustomers;
});
