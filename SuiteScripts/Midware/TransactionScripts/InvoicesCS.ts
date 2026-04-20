/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import { EntryPoints } from "N/types";

import * as log from "N/log";

export function validateLine(pContext: EntryPoints.Client.validateLineContext) {
    try {
        const itemClass = pContext.currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "class",
        });

        if (!itemClass) {
            alert("Please select a class for this item");
            return false;
        }

        return true;
    } catch (error) {
        handleError(error);
    }
}

export function validateInsert(pContext: EntryPoints.Client.validateInsertContext) {
    try {
        const itemClass = pContext.currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "class",
        });

        if (!itemClass) {
            alert("Please select a class for this item");
            return false;
        }

        return true;
    } catch (error) {
        handleError(error);
    }
}

export function fieldChanged(pContext: EntryPoints.Client.fieldChangedContext) {
    try {
        const currentRecord = pContext.currentRecord;
        const sublistId = pContext.sublistId;
        const fieldId = pContext.fieldId;

        if (sublistId === "item" && fieldId === "custcol_mw_item_class") {
            const date = new Date();
            const startingDate = new Date(2025, 8, 1);

            if (date.getTime() < startingDate.getTime()) return;

            const itemClass = currentRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_mw_item_class",
            });

            currentRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "class",
                value: itemClass,
            });
        }
    } catch (error) {
        handleError(error);
    }
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
