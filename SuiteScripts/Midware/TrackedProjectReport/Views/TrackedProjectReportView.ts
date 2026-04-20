/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import * as error from "N/error";
import * as url from "N/url";
import * as serverWidget from "N/ui/serverWidget";
import * as log from "N/log";
import * as runtime from "N/runtime";

import * as constants from "../Constants/Constants";
import * as message from "N/ui/message";

export function getMainView() {
    const form = serverWidget.createForm({ title: "Tracked Project Name Report" });

    form.addSubmitButton({ label: "Search" });

    form.addField({
        id: constants.SUITELET_IDS.FORM.FIELDS.PROJECT_SELECT.ID,
        label: constants.SUITELET_IDS.FORM.FIELDS.PROJECT_SELECT.LABEL,
        type: serverWidget.FieldType.SELECT,
        source: "customrecord_pl_dn_trck_job",
    });

    return form;
}

export function getResultView(tracked_project_id, transacData, communicationData) {
    const form = serverWidget.createForm({ title: "Tracked Project Name Report" });

    form.addSubmitButton({ label: "Search" });

    form.addField({
        id: constants.SUITELET_IDS.FORM.FIELDS.PROJECT_SELECT.ID,
        label: constants.SUITELET_IDS.FORM.FIELDS.PROJECT_SELECT.LABEL,
        type: serverWidget.FieldType.SELECT,
        source: "customrecord_pl_dn_trck_job",
    }).defaultValue = tracked_project_id;

    if (tracked_project_id) {
        form.addTab({
            id: constants.SUITELET_IDS.FORM.TABS.RESULT.ID,
            label: constants.SUITELET_IDS.FORM.TABS.RESULT.LABEL,
        });

        buildSOSubList(form, transacData);
        buildQuotesSubList(form, transacData);
        buildCommunicationSubList(form, communicationData);
    } else {
        form.addPageInitMessage({ message: "You must select a Project first", title: "Warning", type: message.Type.WARNING });
    }

    return form;
}

function buildSOSubList(form: serverWidget.Form, transacData) {
    const transactionSubList = form.addSublist({
        id: constants.SUITELET_IDS.SO_SUBLIST.SUBLIST_ID,
        type: serverWidget.SublistType.LIST,
        label: "Sale Orders",
        tab: constants.SUITELET_IDS.FORM.TABS.RESULT.ID,
    });

    /* transactionSubList.addField({
        id: constants.SUITELET_IDS.SO_SUBLIST.VIEW,
        type: serverWidget.FieldType.URL,
        label: "View",
    }).linkText = "View"; */

    /* transactionSubList.addField({
        id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_DATE,
        type: serverWidget.FieldType.TEXT,
        label: "Date",
    }); */

    transactionSubList.addField({
        id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_NAME,
        type: serverWidget.FieldType.TEXT,
        label: "Document Name",
    });

    transactionSubList.addField({
        id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_CUSTOMER,
        type: serverWidget.FieldType.TEXT,
        label: "Customer",
    });

    transactionSubList.addField({
        id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_TOTAL_WEIGHT,
        type: serverWidget.FieldType.TEXT,
        label: "Total Weight",
    });

    transactionSubList.addField({
        id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_TOTAL_AMOUNT,
        type: serverWidget.FieldType.TEXT,
        label: "Total Amount",
    });

    if (transacData.length > 0) {
        setSOSubListData(transactionSubList, transacData);
    }

    return transactionSubList;
}

function setSOSubListData(transactionSubList: serverWidget.Sublist, transacData) {
    let line = 0;
    for (let i = 0; i < transacData.length; i++) {
        const transac = transacData[i];

        if (transac["transacType"] == "SalesOrd") {
            const fields = transac["fields"];

            /* transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.SO_SUBLIST.VIEW,
                value: `https://1233958${
                    env === "SANDBOX" ? "-sb1" : ""
                }.app.netsuite.com/app/accounting/transactions/transaction.nl?id=${transac["internalId"]}`,
                line: line,
            }); */

            /* transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_DATE,
                value: fields.date,
                line: line,
            }); */

            transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_NAME,
                value: `<a target='_blank' href='/app/accounting/transactions/transaction.nl?id=${transac["internalId"]}'>${fields.name}</a>`,
                line: line,
            });

            /* transactionSubList.getField({
                id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_NAME,
            }).linkText = fields.name; */

            transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_CUSTOMER,
                value: fields.customer,
                line: line,
            });

            transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_TOTAL_WEIGHT,
                value: fields.totalWeight,
                line: line,
            });

            transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.SO_SUBLIST.TRANS_TOTAL_AMOUNT,
                value: fields.totalAmount,
                line: line,
            });

            line += 1;
        }
    }
}

function buildQuotesSubList(form: serverWidget.Form, transacData) {
    const transactionSubList = form.addSublist({
        id: constants.SUITELET_IDS.QUOTES_SUBLIST.SUBLIST_ID,
        type: serverWidget.SublistType.LIST,
        label: "Quotes",
        tab: constants.SUITELET_IDS.FORM.TABS.RESULT.ID,
    });

    /* transactionSubList.addField({
        id: constants.SUITELET_IDS.QUOTES_SUBLIST.VIEW,
        type: serverWidget.FieldType.URL,
        label: "View",
    }).linkText = "View"; */

    /* transactionSubList.addField({
        id: constants.SUITELET_IDS.TRANSACTIONS_SUBLIST.TRANS_DATE,
        type: serverWidget.FieldType.TEXT,
        label: "Date",
    }); */

    transactionSubList.addField({
        id: constants.SUITELET_IDS.QUOTES_SUBLIST.TRANS_NAME,
        type: serverWidget.FieldType.TEXT,
        label: "Document Name",
    });

    transactionSubList.addField({
        id: constants.SUITELET_IDS.QUOTES_SUBLIST.TRANS_CUSTOMER,
        type: serverWidget.FieldType.TEXT,
        label: "Customer",
    });

    transactionSubList.addField({
        id: constants.SUITELET_IDS.QUOTES_SUBLIST.TRANS_TOTAL_WEIGHT,
        type: serverWidget.FieldType.TEXT,
        label: "Total Weight",
    });

    transactionSubList.addField({
        id: constants.SUITELET_IDS.QUOTES_SUBLIST.TRANS_TOTAL_AMOUNT,
        type: serverWidget.FieldType.TEXT,
        label: "Total Amount",
    });

    if (transacData.length > 0) {
        setQuotesSubListData(transactionSubList, transacData);
    }

    return transactionSubList;
}

function setQuotesSubListData(transactionSubList: serverWidget.Sublist, transacData) {
    let line = 0;
    for (let i = 0; i < transacData.length; i++) {
        const transac = transacData[i];

        if (transac["transacType"] == "Estimate") {
            const fields = transac["fields"];

            /* transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.QUOTES_SUBLIST.VIEW,
                value: `https://1233958${
                    env === "SANDBOX" ? "-sb1" : ""
                }.app.netsuite.com/app/accounting/transactions/transaction.nl?id=${transac["internalId"]}`,
                line: line,
            }); */

            /* transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.QUOTES_SUBLIST.TRANS_DATE,
                value: fields.date,
                line: line,
            }); */

            transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.QUOTES_SUBLIST.TRANS_NAME,
                value: `<a target='_blank' href='/app/accounting/transactions/transaction.nl?id=${transac["internalId"]}'>${fields.name}</a>`,
                line: line,
            });

            transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.QUOTES_SUBLIST.TRANS_CUSTOMER,
                value: fields.customer,
                line: line,
            });

            transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.QUOTES_SUBLIST.TRANS_TOTAL_WEIGHT,
                value: fields.totalWeight,
                line: line,
            });

            transactionSubList.setSublistValue({
                id: constants.SUITELET_IDS.QUOTES_SUBLIST.TRANS_TOTAL_AMOUNT,
                value: fields.totalAmount,
                line: line,
            });

            line += 1;
        }
    }
}

/* Communication Sublist */

function buildCommunicationSubList(form: serverWidget.Form, communicationData) {
    const communicationSubList = form.addSublist({
        id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.SUBLIST_ID,
        type: serverWidget.SublistType.LIST,
        label: "Communication",
        tab: constants.SUITELET_IDS.FORM.TABS.RESULT.ID,
    });

    communicationSubList.addField({
        id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.VIEW,
        type: serverWidget.FieldType.URL,
        label: "View",
    }).linkText = "View";

    communicationSubList.addField({
        id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.COMMUNICATION_DATE,
        type: serverWidget.FieldType.TEXT,
        label: "Date",
    });

    communicationSubList.addField({
        id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.COMMUNICATION_TYPE,
        type: serverWidget.FieldType.TEXT,
        label: "Type",
    });

    communicationSubList.addField({
        id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.COMMUNICATION_RECIPIENT,
        type: serverWidget.FieldType.TEXT,
        label: "Recipient",
    });

    communicationSubList.addField({
        id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.COMMUNICATION_MESSAGE,
        type: serverWidget.FieldType.TEXTAREA,
        label: "Message",
    });

    if (communicationData.length > 0) {
        setCommunicationSubListData(communicationSubList, communicationData);
    }

    return communicationSubList;
}

function setCommunicationSubListData(communicationSubList: serverWidget.Sublist, communicationData) {
    const env = String(runtime.envType);

    for (let i = 0; i < communicationData.length; i++) {
        const communic = communicationData[i];

        const fields = communic["fields"];

        communicationSubList.setSublistValue({
            id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.VIEW,
            value: `https://1233958${env === "SANDBOX" ? "-sb1" : ""}.app.netsuite.com/app/crm/${communic["record"]}.nl?id=${
                communic["internalId"]
            }`,
            line: i,
        });

        communicationSubList.setSublistValue({
            id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.COMMUNICATION_DATE,
            value: fields.date,
            line: i,
        });

        communicationSubList.setSublistValue({
            id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.COMMUNICATION_TYPE,
            value: fields.type,
            line: i,
        });

        communicationSubList.setSublistValue({
            id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.COMMUNICATION_RECIPIENT,
            value: fields.recipient,
            line: i,
        });

        communicationSubList.setSublistValue({
            id: constants.SUITELET_IDS.COMMUNICATION_SUBLIST.COMMUNICATION_MESSAGE,
            value: fields.message,
            line: i,
        });
    }
}
