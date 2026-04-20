/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/ui/serverWidget", "N/log"], function (require, exports, serverWidget, log) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function getMainView(customerList) {
        var form = serverWidget.createForm({
            title: "Select Email Recipients",
        });
        form.addField({
            id: "custpage_do_not_send_email",
            type: serverWidget.FieldType.CHECKBOX,
            label: "Do not Send Email",
        });
        // Create sublist for items
        var sublist = form.addSublist({
            id: "custpage_contact_sublist",
            type: serverWidget.SublistType.LIST,
            label: "Contacts",
        });
        // Add columns
        sublist.addField({
            id: "custpage_select",
            type: serverWidget.FieldType.CHECKBOX,
            label: "Select",
        });
        sublist.addField({
            id: "custpage_contact_name",
            type: serverWidget.FieldType.TEXT,
            label: "Name",
        });
        sublist.addField({
            id: "custpage_contact_email",
            type: serverWidget.FieldType.TEXT,
            label: "Email",
        });
        // Populate sublist with items
        for (var i = 0; i < customerList.length; i++) {
            log.debug("customerList[i]", customerList[i]);
            sublist.setSublistValue({
                id: "custpage_contact_name",
                line: i,
                value: customerList[i].name,
            });
            sublist.setSublistValue({
                id: "custpage_contact_email",
                line: i,
                value: customerList[i].email,
            });
            if (customerList[i].role === "2") {
                //"Customer - AP"
                sublist.setSublistValue({
                    id: "custpage_select",
                    line: i,
                    value: "T",
                });
            }
        }
        form.addButton({
            id: "custpage_cancel",
            label: "Cancel",
            functionName: "cancelSelection",
        });
        form.addSubmitButton({
            label: "Confirm",
        });
        // Add client script to handle form submission
        form.clientScriptModulePath = "./itemSelectionClient.js";
        return form;
    }
    exports.getMainView = getMainView;
});
