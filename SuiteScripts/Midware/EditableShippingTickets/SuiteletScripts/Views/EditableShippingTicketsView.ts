/**
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
*/

import * as log from 'N/log'
import * as serverWidget from 'N/ui/serverWidget'

export function getPage(pData) {

    let form = serverWidget.createForm({ title: 'Create Shipping Ticket' });

    form.clientScriptModulePath = '../../ClientScripts/EditableShippingTicketCS.js';

    let dataF = form.addField({ id: "custpage_data", type: serverWidget.FieldType.LONGTEXT, label: "Data" });
    dataF.updateDisplayType({ displayType : serverWidget.FieldDisplayType.HIDDEN });
    //soF.defaultValue = pData.salesOrder;

    form.addFieldGroup({ id: "custpage_h_add", label: "Address Information" });

    let bT = form.addField({ id: "custpage_bill_to", type: serverWidget.FieldType.TEXTAREA, label: "Bill To", container: "custpage_h_add" });
    if (pData.billAdd) bT.defaultValue = pData.billAdd;

    let sT = form.addField({ id: "custpage_ship_to", type: serverWidget.FieldType.TEXTAREA, label: "Ship To", container: "custpage_h_add" });
    if (pData.shipAdd) sT.defaultValue = pData.shipAdd;

    let itemList = form.addSublist({ id: 'custpage_item_list', label: "Items", type: serverWidget.SublistType.INLINEEDITOR });

    let qtyF = itemList.addField({ id: "custpage_i_qty", label: "Quantity", type: serverWidget.FieldType.FLOAT });
    let itemF = itemList.addField({ id: "custpage_i_item", label: "Item", type: serverWidget.FieldType.TEXT });
    let descriptionF = itemList.addField({ id: "custpage_i_desc", label: "Description", type: serverWidget.FieldType.TEXT });
    let weightF = itemList.addField({ id: "custpage_i_weight", label: "Pounds", type: serverWidget.FieldType.FLOAT });

    qtyF.updateDisplaySize({ height: 1, width: 10 });
    itemF.updateDisplaySize({ height: 1, width: 60 });
    descriptionF.updateDisplaySize({ height: 1, width: 60 });
    weightF.updateDisplaySize({ height: 1, width: 10 });

    fillData(itemList, pData.itemsList);

    //form.addSubmitButton({ label: 'Generate PDF' });
    form.addButton({ id: "custpage_createpdf", label: "Generate PDF", functionName: `createPDF("${pData.salesOrder}", "${pData.soNum}")` });

    return form;
}

function fillData(pSublist, pData) {

    for (let i = 0; i < pData.length; i++) {

        let ddata = pData[i];

        pSublist.setSublistValue({ id: "custpage_i_qty", value: ddata["qty"], line: i });
        pSublist.setSublistValue({ id: "custpage_i_item", value: ddata["item"], line: i });
        pSublist.setSublistValue({ id: "custpage_i_desc", value: ddata["description"], line: i });
        pSublist.setSublistValue({ id: "custpage_i_weight", value: ddata["weight"], line: i });

    }
}

export function getPDFtemplate(pData) {

    let itemsTable = "";

    pData.itemData.forEach(element => {

        itemsTable += `<tr>
            <td align="center" style="width: 25%;">${element.qty}</td>
            <td style="width: 50%;"><span class="itemname">${element.item.replace(/&/g, "&amp;")}</span><br />${element.description.replace(/&/g, "&amp;")}</td>
            <td align="center" style="width: 25%;">${element.weight}</td>
        </tr>`;

    });

    return `<?xml version="1.0"?>
    <!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
    <pdf>
    <head>
        <macrolist>
            <macro id="nlheader">
                <table class="header" style="width: 100%; font-size: 10pt;">
                    <tr>
                        <td style="width: 30%; vertical-align: middle;" class="headerT" rowspan="4" align="center">SHIPPING TICKET</td>
                        <td align="center" style="width: 40%" class="headerT2">Duncan Galvanizing</td>
                        <td align="right" style="width: 30%; vertical-align: bottom;" class="headerT3" rowspan="2">Order# ${pData.soNum}</td>
                    </tr>
                    <tr>
                        <td align="center">69 Norman Street</td>
                    </tr>
                    <tr>
                        <td align="center">Everett, MA 02149-1987</td>
                        <td align="right" class="headerT3">${getDate(new Date())}</td>
                    </tr>
                    <tr>
                        <td align="center">Phone: 617-389-8440</td>
                        <td></td>
                    </tr>
                </table>
            </macro>
            <macro id="nlfooter">
                <div style="width: 100%; border-bottom: 1px solid black; margin-bottom: 10px"></div>
                <table align="right" class="footerTable" style="width: 35%; margin-bottom: 10px">
                    <tr style="width: 100%">
                    <td style="width: 65%">Quantity Shipped:</td>
                    <td style="width: 35%">${pData.totalQty}</td>
                    </tr>
                    <tr>
                    <td style="width: 65%">Pounds Shipped:</td>
                    <td style="width: 35%">${pData.totalWeight}</td>
                    </tr>
                </table>
                <table class="footer" style="width: 100%;">
                    <tr>
                    <td style="width: 40%">Received By:</td>
                    <td style="width: 60%">Date:</td>
                    </tr>
                </table>
            </macro>
        </macrolist>
        <style>
            * {
                font-family: NotoSans, sans-serif;
            }
            table {
                font-size: 10pt;
                table-layout: fixed;
                border-collapse: separate;
                border-spacing: 0;
            }
            th {
                font-weight: bold;
                font-size: 10pt;
                vertical-align: middle;
                padding: 5px 6px 3px;
                background-color: #e3e3e3;
                color: #333333;
            }
            td {
                padding: 4px 6px;
            }
            td p { align:left }
            b {
                font-weight: bold;
                color: #333333;
            }
            table.header td {
                padding: 0;
                font-size: 10pt;
            }
            table.itemtable th {
                padding-bottom: 10px;
                padding-top: 10px;
            }
            table.body td {
                padding-top: 2px;
            }
            td.addressheader {
            font-size: 12pt;
            font-weight: bold;
            padding-top: 5px;
            padding-bottom: 0px;
            }
            td.address {
            padding-top: 0;
            font-size: 12pt;
            }
            span.title {
                font-size: 28pt;
            }
            span.number {
                font-size: 16pt;
            }
            span.itemname {
                font-weight: bold;
                line-height: 150%;
            }
            div.returnform {
                width: 100%;
                /* To ensure minimal height of return form */
                height: 200pt;
                page-break-inside: avoid;
                page-break-after: avoid;
            }
            hr {
                border-top: 1px dashed #d3d3d3;
                width: 100%;
                color: #ffffff;
                background-color: #ffffff;
                height: 1px;
            }
            td.headerT {
                font-size: 18pt;
                font-weight: bold;
            }
            td.headerT2 {
                font-size: 14pt;
                font-weight: bold;
            }
            td.headerT3 {
                font-size: 14pt;
                font-weight: bold;
            }
            table.footerTable {
                padding: 0;
                font-size: 10pt !important;
            }
            table.footerTable td{
                padding: 5px;
                border: 1px solid black;
                font-weight: bold;
            }
            table.footer td {
                padding: 5px;
                font-size: 10pt;
                border-bottom: 1px solid black;
                font-weight: bold;
            }
            td.bordered {
                background-color: #e3e3e3;
            }
            table.addTable td{
                padding: 5px;
                margin: 0;
            }
        </style>
    </head>
    <body header="nlheader" header-height="10%" footer="nlfooter" footer-height="80pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">
        <table class="addTable" style="width: 100%; margin-top: 10px;">
            <tr>
                <td style="width: 40%;" class="addressheader bordered">Bill To:</td>
                <td rowspan="2" style="width: 20%; vertical-align: center;" class="addressheader" align="center">Page <pagenumber/> of <totalpages/></td>
                <td style="width: 40%;" class="addressheader bordered">Ship To:</td>
            </tr>
            <tr>
            <td style="width: 40%;" class="address bordered">${pData.billAdd.replace(/&/g, "&amp;").replace(/\n/g, '<br/>')}</td>
            <td style="width: 40%;" class="address bordered">${pData.shipAdd.replace(/&/g, "&amp;").replace(/\n/g, '<br/>')}</td>
            </tr>
        </table>
        <table class="itemtable" style="width: 100%; margin-top: 10px;">
            <thead>
            <tr>
            <th align="center" style="width: 25%;">Quantity</th>
            <th style="width: 50%;">Item</th>
            <th align="center" style="width: 25%;">Pounds</th>
            </tr>
            </thead>
            ${itemsTable}
        </table>
    </body>
    </pdf>
    `;
}

function pad(value: number): string {
    return (value < 10 ? '0' : '') + value;
}

function getDate(dateObj: Date): string {

    const month = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    const year = dateObj.getFullYear();

    return `${month}/${day}/${year}`;
}