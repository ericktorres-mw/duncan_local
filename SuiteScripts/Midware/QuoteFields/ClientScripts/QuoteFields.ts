/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import { EntryPoints, UserEventType } from "N/types";

import * as log from "N/log";
import * as runtime from "N/runtime";
import * as search from "N/search";
import * as record from "N/record";

export function pageInit(pContext: EntryPoints.Client.pageInitContext) {
    try {
        if (pContext.mode == "create") {
            const currentUser = runtime.getCurrentUser();

            //Set due date = today + 90 days

            const today = new Date();
            const dueDate = new Date(today.setDate(today.getDate() + 90));

            pContext.currentRecord.setValue({
                fieldId: "duedate",
                value: dueDate,
            });

            const current_quoted_by_value = pContext.currentRecord.getValue({
                fieldId: "custbody_mw_quoted_by",
            });

            if (current_quoted_by_value == false) {
                //Set quoted by field = current User if possible
                const quotedByCurrentUserSearch = search
                    .create({
                        type: "customrecord_mw_quoted_by",
                        filters: [["custrecord_mw_user.internalid", "anyof", currentUser.id]],
                        columns: ["id"],
                    })
                    .runPaged({ pageSize: 1000 });

                for (let i = 0; i < quotedByCurrentUserSearch.pageRanges.length; i++) {
                    const page = quotedByCurrentUserSearch.fetch({ index: quotedByCurrentUserSearch.pageRanges[i].index });

                    for (let j = 0; j < page.data.length; j++) {
                        const user = page.data[j];

                        pContext.currentRecord.setValue({
                            fieldId: "custbody_mw_quoted_by",
                            value: user.id,
                        });
                    }
                }
            }
        }
    } catch (error) {
        handleError(error);
    }
}

export function validateField(pContext: EntryPoints.Client.validateFieldContext) {
    try {
        return true;
    } catch (error) {
        handleError(error);
    }
}

export function validateLine(pContext: EntryPoints.Client.validateLineContext) {
    try {
        return true;
    } catch (error) {
        handleError(error);
    }
}

export function validateInsert(pContext: EntryPoints.Client.validateInsertContext) {
    try {
        return true;
    } catch (error) {
        handleError(error);
    }
}

export function validateDelete(pContext: EntryPoints.Client.validateDeleteContext) {
    try {
        return true;
    } catch (error) {
        handleError(error);
    }
}

export function fieldChanged(pContext: EntryPoints.Client.fieldChangedContext) {
    try {
        //Set due date = trandate + 90 days
        if (pContext.fieldId == "trandate") {
            const quoteDateField = pContext.currentRecord.getValue({
                fieldId: "trandate",
            });
            const tranDate = new Date(<string>quoteDateField);
            const dueDate = new Date(tranDate.setDate(tranDate.getDate() + 90));

            pContext.currentRecord.setValue({
                fieldId: "duedate",
                value: dueDate,
            });
        }
    } catch (error) {
        handleError(error);
    }
}

export function postSourcing(pContext: EntryPoints.Client.postSourcingContext) {
    try {
        return true;
    } catch (error) {
        handleError(error);
    }
}

export function sublistChanged(pContext: EntryPoints.Client.sublistChangedContext) {
    try {
        return true;
    } catch (error) {
        handleError(error);
    }
}

export function saveRecord(pContext: EntryPoints.Client.saveRecordContext) {
    try {
        return true;
    } catch (error) {
        handleError(error);
    }
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });

    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
