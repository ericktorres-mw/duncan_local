/**
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
*/
define(["require", "exports", "N/ui/serverWidget"], function (require, exports, serverWidget) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function getPage(pData) {
        var form = serverWidget.createForm({ title: 'Create Shipping Ticket' });
        form.clientScriptModulePath = '../../ClientScripts/EditableShippingTicketCS.js';
        var dataF = form.addField({ id: "custpage_data", type: serverWidget.FieldType.LONGTEXT, label: "Data" });
        dataF.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
        //soF.defaultValue = pData.salesOrder;
        form.addFieldGroup({ id: "custpage_h_add", label: "Address Information" });
        var bT = form.addField({ id: "custpage_bill_to", type: serverWidget.FieldType.TEXTAREA, label: "Bill To", container: "custpage_h_add" });
        if (pData.billAdd)
            bT.defaultValue = pData.billAdd;
        var sT = form.addField({ id: "custpage_ship_to", type: serverWidget.FieldType.TEXTAREA, label: "Ship To", container: "custpage_h_add" });
        if (pData.shipAdd)
            sT.defaultValue = pData.shipAdd;
        var itemList = form.addSublist({ id: 'custpage_item_list', label: "Items", type: serverWidget.SublistType.INLINEEDITOR });
        var qtyF = itemList.addField({ id: "custpage_i_qty", label: "Quantity", type: serverWidget.FieldType.FLOAT });
        var itemF = itemList.addField({ id: "custpage_i_item", label: "Item", type: serverWidget.FieldType.TEXT });
        var descriptionF = itemList.addField({ id: "custpage_i_desc", label: "Description", type: serverWidget.FieldType.TEXT });
        var weightF = itemList.addField({ id: "custpage_i_weight", label: "Pounds", type: serverWidget.FieldType.FLOAT });
        qtyF.updateDisplaySize({ height: 1, width: 10 });
        itemF.updateDisplaySize({ height: 1, width: 60 });
        descriptionF.updateDisplaySize({ height: 1, width: 60 });
        weightF.updateDisplaySize({ height: 1, width: 10 });
        fillData(itemList, pData.itemsList);
        //form.addSubmitButton({ label: 'Generate PDF' });
        form.addButton({ id: "custpage_createpdf", label: "Generate PDF", functionName: "createPDF(\"" + pData.salesOrder + "\", \"" + pData.soNum + "\")" });
        return form;
    }
    exports.getPage = getPage;
    function fillData(pSublist, pData) {
        for (var i = 0; i < pData.length; i++) {
            var ddata = pData[i];
            pSublist.setSublistValue({ id: "custpage_i_qty", value: ddata["qty"], line: i });
            pSublist.setSublistValue({ id: "custpage_i_item", value: ddata["item"], line: i });
            pSublist.setSublistValue({ id: "custpage_i_desc", value: ddata["description"], line: i });
            pSublist.setSublistValue({ id: "custpage_i_weight", value: ddata["weight"], line: i });
        }
    }
    function getPDFtemplate(pData) {
        var itemsTable = "";
        pData.itemData.forEach(function (element) {
            itemsTable += "<tr>\n            <td align=\"center\" style=\"width: 25%;\">" + element.qty + "</td>\n            <td style=\"width: 50%;\"><span class=\"itemname\">" + element.item.replace(/&/g, "&amp;") + "</span><br />" + element.description.replace(/&/g, "&amp;") + "</td>\n            <td align=\"center\" style=\"width: 25%;\">" + element.weight + "</td>\n        </tr>";
        });
        return "<?xml version=\"1.0\"?>\n    <!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n    <pdf>\n    <head>\n        <macrolist>\n            <macro id=\"nlheader\">\n                <table class=\"header\" style=\"width: 100%; font-size: 10pt;\">\n                    <tr>\n                        <td style=\"width: 30%; vertical-align: middle;\" class=\"headerT\" rowspan=\"4\" align=\"center\">SHIPPING TICKET</td>\n                        <td align=\"center\" style=\"width: 40%\" class=\"headerT2\">Duncan Galvanizing</td>\n                        <td align=\"right\" style=\"width: 30%; vertical-align: bottom;\" class=\"headerT3\" rowspan=\"2\">Order# " + pData.soNum + "</td>\n                    </tr>\n                    <tr>\n                        <td align=\"center\">69 Norman Street</td>\n                    </tr>\n                    <tr>\n                        <td align=\"center\">Everett, MA 02149-1987</td>\n                        <td align=\"right\" class=\"headerT3\">" + getDate(new Date()) + "</td>\n                    </tr>\n                    <tr>\n                        <td align=\"center\">Phone: 617-389-8440</td>\n                        <td></td>\n                    </tr>\n                </table>\n            </macro>\n            <macro id=\"nlfooter\">\n                <div style=\"width: 100%; border-bottom: 1px solid black; margin-bottom: 10px\"></div>\n                <table align=\"right\" class=\"footerTable\" style=\"width: 35%; margin-bottom: 10px\">\n                    <tr style=\"width: 100%\">\n                    <td style=\"width: 65%\">Quantity Shipped:</td>\n                    <td style=\"width: 35%\">" + pData.totalQty + "</td>\n                    </tr>\n                    <tr>\n                    <td style=\"width: 65%\">Pounds Shipped:</td>\n                    <td style=\"width: 35%\">" + pData.totalWeight + "</td>\n                    </tr>\n                </table>\n                <table class=\"footer\" style=\"width: 100%;\">\n                    <tr>\n                    <td style=\"width: 40%\">Received By:</td>\n                    <td style=\"width: 60%\">Date:</td>\n                    </tr>\n                </table>\n            </macro>\n        </macrolist>\n        <style>\n            * {\n                font-family: NotoSans, sans-serif;\n            }\n            table {\n                font-size: 10pt;\n                table-layout: fixed;\n                border-collapse: separate;\n                border-spacing: 0;\n            }\n            th {\n                font-weight: bold;\n                font-size: 10pt;\n                vertical-align: middle;\n                padding: 5px 6px 3px;\n                background-color: #e3e3e3;\n                color: #333333;\n            }\n            td {\n                padding: 4px 6px;\n            }\n            td p { align:left }\n            b {\n                font-weight: bold;\n                color: #333333;\n            }\n            table.header td {\n                padding: 0;\n                font-size: 10pt;\n            }\n            table.itemtable th {\n                padding-bottom: 10px;\n                padding-top: 10px;\n            }\n            table.body td {\n                padding-top: 2px;\n            }\n            td.addressheader {\n            font-size: 12pt;\n            font-weight: bold;\n            padding-top: 5px;\n            padding-bottom: 0px;\n            }\n            td.address {\n            padding-top: 0;\n            font-size: 12pt;\n            }\n            span.title {\n                font-size: 28pt;\n            }\n            span.number {\n                font-size: 16pt;\n            }\n            span.itemname {\n                font-weight: bold;\n                line-height: 150%;\n            }\n            div.returnform {\n                width: 100%;\n                /* To ensure minimal height of return form */\n                height: 200pt;\n                page-break-inside: avoid;\n                page-break-after: avoid;\n            }\n            hr {\n                border-top: 1px dashed #d3d3d3;\n                width: 100%;\n                color: #ffffff;\n                background-color: #ffffff;\n                height: 1px;\n            }\n            td.headerT {\n                font-size: 18pt;\n                font-weight: bold;\n            }\n            td.headerT2 {\n                font-size: 14pt;\n                font-weight: bold;\n            }\n            td.headerT3 {\n                font-size: 14pt;\n                font-weight: bold;\n            }\n            table.footerTable {\n                padding: 0;\n                font-size: 10pt !important;\n            }\n            table.footerTable td{\n                padding: 5px;\n                border: 1px solid black;\n                font-weight: bold;\n            }\n            table.footer td {\n                padding: 5px;\n                font-size: 10pt;\n                border-bottom: 1px solid black;\n                font-weight: bold;\n            }\n            td.bordered {\n                background-color: #e3e3e3;\n            }\n            table.addTable td{\n                padding: 5px;\n                margin: 0;\n            }\n        </style>\n    </head>\n    <body header=\"nlheader\" header-height=\"10%\" footer=\"nlfooter\" footer-height=\"80pt\" padding=\"0.5in 0.5in 0.5in 0.5in\" size=\"Letter\">\n        <table class=\"addTable\" style=\"width: 100%; margin-top: 10px;\">\n            <tr>\n                <td style=\"width: 40%;\" class=\"addressheader bordered\">Bill To:</td>\n                <td rowspan=\"2\" style=\"width: 20%; vertical-align: center;\" class=\"addressheader\" align=\"center\">Page <pagenumber/> of <totalpages/></td>\n                <td style=\"width: 40%;\" class=\"addressheader bordered\">Ship To:</td>\n            </tr>\n            <tr>\n            <td style=\"width: 40%;\" class=\"address bordered\">" + pData.billAdd.replace(/&/g, "&amp;").replace(/\n/g, '<br/>') + "</td>\n            <td style=\"width: 40%;\" class=\"address bordered\">" + pData.shipAdd.replace(/&/g, "&amp;").replace(/\n/g, '<br/>') + "</td>\n            </tr>\n        </table>\n        <table class=\"itemtable\" style=\"width: 100%; margin-top: 10px;\">\n            <thead>\n            <tr>\n            <th align=\"center\" style=\"width: 25%;\">Quantity</th>\n            <th style=\"width: 50%;\">Item</th>\n            <th align=\"center\" style=\"width: 25%;\">Pounds</th>\n            </tr>\n            </thead>\n            " + itemsTable + "\n        </table>\n    </body>\n    </pdf>\n    ";
    }
    exports.getPDFtemplate = getPDFtemplate;
    function pad(value) {
        return (value < 10 ? '0' : '') + value;
    }
    function getDate(dateObj) {
        var month = pad(dateObj.getMonth() + 1);
        var day = pad(dateObj.getDate());
        var year = dateObj.getFullYear();
        return month + "/" + day + "/" + year;
    }
});
