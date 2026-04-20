/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import * as log from "N/log";
import * as search from "N/search";
import * as error from "N/error";
import * as file from "N/file";
import * as runtime from "N/runtime";

import * as constants from "../Constants/Constants";

export function getTransactionData(tracked_project_id) {
    const data = [];

    const transactionSearchObj = search.create({
        type: "transaction",
        filters: [
            ["type", "anyof", "Estimate", "SalesOrd"],
            "AND",
            ["mainline", "is", "T"],
            "AND",
            ["custbody_pl_dn_trck_job", "anyof", tracked_project_id],
        ],
        columns: [
            search.createColumn({ name: "type", label: "Type" }),
            search.createColumn({ name: "tranid", label: "Transaction ID" }),
            search.createColumn({ name: "entity", label: "Name" }),
            search.createColumn({ name: "custbody_dg_ttl_out_weight_rpt", label: "Total Weight" }),
            search.createColumn({ name: "amount", label: "Amount" }),
        ],
    });

    const myPagedData = transactionSearchObj.runPaged({
        pageSize: 100,
    });

    myPagedData.pageRanges.forEach((pageRange) => {
        const myPage = myPagedData.fetch({ index: pageRange.index });

        myPage.data.forEach((result) => {
            const internalId = result.id;
            const transacType = String(result.getValue("type"));

            // Fields
            const name = result.getValue("tranid");
            const customer = result.getText("entity");
            const totalWeight = result.getValue("custbody_dg_ttl_out_weight_rpt");
            const totalAmount = result.getValue("amount");

            data.push({
                internalId,
                transacType,
                fields: {
                    name,
                    customer,
                    totalWeight,
                    totalAmount,
                },
            });
        });
    });

    return data;
}

export function getCommunicationData(tracked_project_id) {
    let data = getEmails(tracked_project_id);
    data = data.concat(getNotes(tracked_project_id), getActivities(tracked_project_id));
    //data.concat(getEmails(tracked_project_id));
    return data;
}

function getEmails(tracked_project_id) {
    const data = [];

    const transactionSearchObj = search.create({
        type: "message",
        filters: [["transaction.custbody_pl_dn_trck_job", "anyof", tracked_project_id]],
        columns: [
            search.createColumn({
                name: "internalid",
                summary: search.Summary.GROUP,
                label: "Internal ID",
            }),
            search.createColumn({
                name: "messagedate",
                summary: search.Summary.GROUP,
                label: "Date",
            }),
            search.createColumn({
                name: "messagetype",
                summary: search.Summary.GROUP,
                label: "Type",
            }),
            search.createColumn({
                name: "recipient",
                summary: search.Summary.GROUP,
                label: "Primary Recipient",
            }),
            search.createColumn({
                name: "subject",
                summary: search.Summary.GROUP,
                label: "Subject",
            }),
        ],
    });

    const myPagedData = transactionSearchObj.runPaged({
        pageSize: 100,
    });

    myPagedData.pageRanges.forEach((pageRange) => {
        const myPage = myPagedData.fetch({ index: pageRange.index });

        myPage.data.forEach((result) => {
            // Fields
            const values = result.getAllValues();
            const internalId = values["GROUP(internalid)"][0]["value"] ? values["GROUP(internalid)"][0]["value"].toString() : "0";
            const date = values["GROUP(messagedate)"] ? values["GROUP(messagedate)"].toString() : "Not value";
            const type = values["GROUP(messagetype)"][0]["text"] ? values["GROUP(messagetype)"][0]["text"] : "Not value";
            const recipient = values["GROUP(recipient)"][0]["text"] ? values["GROUP(recipient)"][0]["text"] : "Not value";
            const message = values["GROUP(subject)"] ? values["GROUP(subject)"].toString() : "Not value";

            data.push({
                internalId,
                record: "common/crmmessage",
                fields: {
                    date,
                    type,
                    recipient,
                    message,
                },
            });
        });
    });

    return data;
}

function getNotes(tracked_project_id) {
    const data = [];

    const transactionSearchObj = search.create({
        type: "note",
        filters: [["transaction.custbody_pl_dn_trck_job", "anyof", tracked_project_id]],
        columns: [
            search.createColumn({
                name: "internalid",
                summary: search.Summary.GROUP,
                label: "Internal ID",
            }),
            search.createColumn({
                name: "notedate",
                summary: search.Summary.GROUP,
                label: "Date",
            }),
            search.createColumn({
                name: "title",
                summary: search.Summary.GROUP,
                label: "Title",
            }),
        ],
    });

    const myPagedData = transactionSearchObj.runPaged({
        pageSize: 100,
    });

    myPagedData.pageRanges.forEach((pageRange) => {
        const myPage = myPagedData.fetch({ index: pageRange.index });

        myPage.data.forEach((result) => {
            // Fields
            const values = result.getAllValues();
            const internalId = values["GROUP(internalid)"][0]["value"] ? values["GROUP(internalid)"][0]["value"].toString() : "0";
            const date = values["GROUP(notedate)"] ? values["GROUP(notedate)"].toString() : "Not value";
            const type = "Note";
            const recipient = " ";
            const message = values["GROUP(title)"] ? values["GROUP(title)"].toString() : "Not value";

            data.push({
                internalId,
                record: "common/note",
                fields: {
                    date,
                    type,
                    recipient,
                    message,
                },
            });
        });
    });
    return data;
}

function getActivities(tracked_project_id) {
    const data = [];

    const transactionSearchObj = search.create({
        type: "activity",
        filters: [["transaction.custbody_pl_dn_trck_job", "anyof", tracked_project_id]],
        columns: [
            search.createColumn({
                name: "title",
                sort: search.Sort.ASC,
                label: "Title",
            }),
            search.createColumn({ name: "startdate", label: "Date" }),
            search.createColumn({ name: "assigned", label: "Assigned To" }),
            search.createColumn({ name: "type", label: "Type" }),
        ],
    });

    const myPagedData = transactionSearchObj.runPaged({
        pageSize: 100,
    });

    myPagedData.pageRanges.forEach((pageRange) => {
        const myPage = myPagedData.fetch({ index: pageRange.index });

        myPage.data.forEach((result) => {
            const internalId = result.id;

            // Fields
            const date = result.getValue("startdate");
            let type = result.getValue("type");
            const recipient = result.getText("assigned");
            const message = result.getValue("title");

            if (type == "Phone Call") {
                type = "Call";
            }

            data.push({
                internalId,
                record: "calendar/" + String(type).toLowerCase(),
                fields: {
                    date,
                    type,
                    recipient,
                    message,
                },
            });
        });
    });
    return data;
}
