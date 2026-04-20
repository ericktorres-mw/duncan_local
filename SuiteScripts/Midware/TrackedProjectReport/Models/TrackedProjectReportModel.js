/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports", "N/search"], function (require, exports, search) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function getTransactionData(tracked_project_id) {
        var data = [];
        var transactionSearchObj = search.create({
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
        var myPagedData = transactionSearchObj.runPaged({
            pageSize: 100,
        });
        myPagedData.pageRanges.forEach(function (pageRange) {
            var myPage = myPagedData.fetch({ index: pageRange.index });
            myPage.data.forEach(function (result) {
                var internalId = result.id;
                var transacType = String(result.getValue("type"));
                // Fields
                var name = result.getValue("tranid");
                var customer = result.getText("entity");
                var totalWeight = result.getValue("custbody_dg_ttl_out_weight_rpt");
                var totalAmount = result.getValue("amount");
                data.push({
                    internalId: internalId,
                    transacType: transacType,
                    fields: {
                        name: name,
                        customer: customer,
                        totalWeight: totalWeight,
                        totalAmount: totalAmount,
                    },
                });
            });
        });
        return data;
    }
    exports.getTransactionData = getTransactionData;
    function getCommunicationData(tracked_project_id) {
        var data = getEmails(tracked_project_id);
        data = data.concat(getNotes(tracked_project_id), getActivities(tracked_project_id));
        //data.concat(getEmails(tracked_project_id));
        return data;
    }
    exports.getCommunicationData = getCommunicationData;
    function getEmails(tracked_project_id) {
        var data = [];
        var transactionSearchObj = search.create({
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
        var myPagedData = transactionSearchObj.runPaged({
            pageSize: 100,
        });
        myPagedData.pageRanges.forEach(function (pageRange) {
            var myPage = myPagedData.fetch({ index: pageRange.index });
            myPage.data.forEach(function (result) {
                // Fields
                var values = result.getAllValues();
                var internalId = values["GROUP(internalid)"][0]["value"] ? values["GROUP(internalid)"][0]["value"].toString() : "0";
                var date = values["GROUP(messagedate)"] ? values["GROUP(messagedate)"].toString() : "Not value";
                var type = values["GROUP(messagetype)"][0]["text"] ? values["GROUP(messagetype)"][0]["text"] : "Not value";
                var recipient = values["GROUP(recipient)"][0]["text"] ? values["GROUP(recipient)"][0]["text"] : "Not value";
                var message = values["GROUP(subject)"] ? values["GROUP(subject)"].toString() : "Not value";
                data.push({
                    internalId: internalId,
                    record: "common/crmmessage",
                    fields: {
                        date: date,
                        type: type,
                        recipient: recipient,
                        message: message,
                    },
                });
            });
        });
        return data;
    }
    function getNotes(tracked_project_id) {
        var data = [];
        var transactionSearchObj = search.create({
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
        var myPagedData = transactionSearchObj.runPaged({
            pageSize: 100,
        });
        myPagedData.pageRanges.forEach(function (pageRange) {
            var myPage = myPagedData.fetch({ index: pageRange.index });
            myPage.data.forEach(function (result) {
                // Fields
                var values = result.getAllValues();
                var internalId = values["GROUP(internalid)"][0]["value"] ? values["GROUP(internalid)"][0]["value"].toString() : "0";
                var date = values["GROUP(notedate)"] ? values["GROUP(notedate)"].toString() : "Not value";
                var type = "Note";
                var recipient = " ";
                var message = values["GROUP(title)"] ? values["GROUP(title)"].toString() : "Not value";
                data.push({
                    internalId: internalId,
                    record: "common/note",
                    fields: {
                        date: date,
                        type: type,
                        recipient: recipient,
                        message: message,
                    },
                });
            });
        });
        return data;
    }
    function getActivities(tracked_project_id) {
        var data = [];
        var transactionSearchObj = search.create({
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
        var myPagedData = transactionSearchObj.runPaged({
            pageSize: 100,
        });
        myPagedData.pageRanges.forEach(function (pageRange) {
            var myPage = myPagedData.fetch({ index: pageRange.index });
            myPage.data.forEach(function (result) {
                var internalId = result.id;
                // Fields
                var date = result.getValue("startdate");
                var type = result.getValue("type");
                var recipient = result.getText("assigned");
                var message = result.getValue("title");
                if (type == "Phone Call") {
                    type = "Call";
                }
                data.push({
                    internalId: internalId,
                    record: "calendar/" + String(type).toLowerCase(),
                    fields: {
                        date: date,
                        type: type,
                        recipient: recipient,
                        message: message,
                    },
                });
            });
        });
        return data;
    }
});
