/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import { EntryPoints } from "N/types";

import * as log from "N/log";
import * as record from "N/record";

export function pageInit(pContext: EntryPoints.Client.pageInitContext) {
    try {
        const invoice = pContext.currentRecord;

        console.log(pContext.mode);

        if (pContext.mode == "create" || pContext.mode == "copy") {
            const createdFrom = invoice.getValue({
                fieldId: "createdfrom",
            });

            //console.log(createdFrom);

            if (createdFrom) {
                const saleOrder = record.load({
                    type: record.Type.SALES_ORDER,
                    id: createdFrom,
                });

                try {
                    const soNumberID = saleOrder.getText({
                        fieldId: "tranid",
                    });

                    const soNumber = String(soNumberID).replace(/\D/g, ""); //Get rid of all not numerical characters

                    //console.log(soNumber);

                    invoice.setValue({
                        fieldId: "tranid",
                        value: "INV" + soNumber,
                    });
                } catch (error) {
                    handleError(error);
                }

                const linesToAdd = [];

                const lineCount = saleOrder.getLineCount({ sublistId: "item" });

                // Iterate through the item sublist of the Sales Order
                for (let line = 0; line < lineCount; line++) {
                    const quantity = saleOrder.getSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        line: line,
                    });

                    if (quantity === 0) {
                        // Item with quantity 0 found, add the line to the array
                        linesToAdd.push(line);
                    }
                }
                linesToAdd.forEach(function (line) {
                    // Copy the line from the Sale Order To The Invoice
                    invoice.selectNewLine({ sublistId: "item" });
                    const itemSublistFields = saleOrder.getSublistFields({ sublistId: "item" });

                    itemSublistFields.forEach(function (fieldId) {
                        const value = saleOrder.getSublistValue({
                            sublistId: "item",
                            fieldId: fieldId,
                            line: line,
                        });

                        invoice.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: fieldId,
                            value: value,
                            ignoreFieldChange: true,
                        });
                    });
                    invoice.commitLine({ sublistId: "item" });
                });
            }
        }
    } catch (error) {
        handleError(error);
    }
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
