/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

/**
 * Description: renders Process Traveler printout
 *
 * version  : 1.0.0 - initial version
 * author       : Plative/Rodmar
 * date     : 02/13/2022
 */

define(["N/record", "N/search", "N/render", "N/file", "N/format"], /**
* @param {record} record
* @param {search} search
*/ function (record, search, render, file, format) {
    var BARCODE_WIDTH = "1";
    var BARCODE_HEIGHT = "50";

    /**
    * Definition of the Suitelet script trigger point.
    *
    * @param {Object} context
    * @param {ServerRequest} context.request - Encapsulation of the incoming request
    * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
    * @Since 2015.2
    */
    function onRequest(context) {
        //log.debug("context.request", context.request); //request object
        //log.debug("context.request.parameters", context.request.parameters); //request object parameters
        //log.debug("context.request.headers", context.request.headers); //request object header

        if (context.request.parameters && context.request.parameters.processid) {
            renderPdf(context);
        }
    }

    function renderPdf(context) {
        try {
            var projectRecord = record.load({
                type: record.Type.JOB,
                id: context.request.parameters.processid,
            });
            var projecttaskSearchObj = getBaseSearch(context.request.parameters.processid);

            var projecttaskSearchObj_sr = getResults(projecttaskSearchObj.run());
            var projecttaskSearchObj_sr_mapped = projecttaskSearchObj_sr.map(function (res) {
                var internalid = res.getValue({
                    name: "internalid",
                    label: "Internal ID",
                });
                var name = res.getValue({ name: "title", label: "Name" });
                var status = res.getText({ name: "status", label: "Status" });
                var start_date = res.getValue({ name: "startdate", label: "Start Date" });
                var predecessor_ids = res.getValue({ name: "predecessors", label: "Predecessors" });
                var predecessor_name = res.getValue({
                    name: "title",
                    join: "predecessor",
                    label: "Name",
                });

                return {
                    internalid: internalid,
                    name: name,
                    status: status,
                    start_date: start_date,
                    predecessor_ids: predecessor_ids,
                    predecessor_name: predecessor_name,
                };
            });

            //log.debug("projecttaskSearchObj_sr_mapped", projecttaskSearchObj_sr_mapped);
            var projecttaskSearchObj_sr_grouped = groupBy(projecttaskSearchObj_sr_mapped, "internalid");
            log.debug("projecttaskSearchObj_sr_grouped", projecttaskSearchObj_sr_grouped);

            //get SO ITEM DETAILS
            var soSearchObj = getSoSearch(context.request.parameters.processid);
            var soSearchObj_sr = getResults(soSearchObj.run());
            var customerPhone = "";
            var soDocNum = "";
            var uniqueSoDocNum = [];
            var finalMemo = "";
            var memoList = [];
            var poNum = "";
            var poNumList = [];
            var jobNameList = [];
            var processTypeList = [];
            var totalInWeight = 0;
            var totalOutWeight = 0;
            var so_last_tran_date = "";
            var finalStandardMemo = "";
            var finalScheduledDate = "";
            var finalCommittedDate = "";
            var finalCommittedDateNotes = "";
            var finalContact = "";
            var finalContactPhone = "";
            var finalLoad = "";
            var finalTotalQty = 0;
            var finalReceivedDate = "";
            var finalContact = "";

            var soSearchObj_sr_mapped = soSearchObj_sr.map(function (res) {
                var internalid = res.getValue({
                    name: "internalid",
                    label: "Internal ID",
                });
                var docnum = res.getValue({ name: "tranid", label: "Document Number" });
                var memomain = res.getValue({ name: "memomain", label: "Memo Main" });

                customerPhone = res.getValue({ name: "phone", join: "customerMain", label: "Phone" });

                //                var soLookup = search.lookupFields({
                //                    type : "salesorder",
                //                    id : res.id,
                //                    columns : ["custbody_pl_dcn_process_notes"]
                //                });
                var soRec = record.load({
                    type: "salesorder",
                    id: res.id,
                });
                so_last_tran_date = soRec.getText({
                    fieldId: "trandate",
                });
                var processnotes = soRec.getValue({
                    fieldId: "custbody_pl_dcn_process_notes",
                });
                var jobtext_tracked = soRec.getText({
                    fieldId: "custbody_pl_dn_trck_job",
                });
                var jobtext_nontracked = soRec.getValue({
                    fieldId: "custbody_platve_duncan_non_tracked_pj",
                });
                var poNum = soRec.getValue({
                    fieldId: "otherrefnum",
                });

                finalLoad = soRec.getValue({
                    fieldId: "custbody_load_number",
                });
                finalCommittedDate = soRec.getText({
                    fieldId: "custbody_dg_committeddate",
                });
                finalCommittedDateNotes = soRec.getValue({
                    fieldId: "custbody_dg_commiteddatenotes",
                });
                finalScheduledDate = soRec.getText({
                    fieldId: "custbody_dg_scheduleddate",
                });
                finalReceivedDate = soRec.getText({
                    fieldId: "trandate",
                });

                var contactId = soRec.getValue({
                    fieldId: "custbody_dg_contact",
                });
                if (contactId) {
                    contactLookup = search.lookupFields({
                        type: "contact",
                        id: contactId,
                        columns: ["entityid"],
                    });

                    //log.debug("contactLookup", contactLookup)

                    finalContact = contactLookup.entityid;
                }

                finalContactPhone = soRec.getText({
                    fieldId: "custbody_dg_contactphone",
                });

                var standardMemo = soRec.getValue({
                    fieldId: "memo",
                });

                finalStandardMemo = standardMemo ? standardMemo : finalStandardMemo;

                var jobtext = jobtext_tracked + " " + jobtext_nontracked;

                var processType = res.getValue({ name: "custbody_pla_processtype", label: "Primary Process Name" });
                var outWeight = res.getValue({ name: "custcol_mw_out_weight" });
                var inWeight = res.getValue({ name: "custcol_pla_inweight", label: "In Weight" });
                var matQty = res.getValue({ name: "custcol_mw_material_qty" });

                totalInWeight += Number(inWeight || 0);
                totalOutWeight += Number(outWeight || 0);
                finalTotalQty += Number(matQty || 0);

                if (docnum) {
                    if (docnum.substr(0, 3) == "W-") {
                        docnum = docnum.substr(3);
                    }
                }

                if (uniqueSoDocNum.indexOf(docnum) == -1) {
                    processnotes = processnotes.replace(/\n/g, "<br/>");
                    uniqueSoDocNum.push(docnum);
                    memoList.push("" + processnotes);
                    jobNameList.push(jobtext);
                    processTypeList.push(processType);
                    poNumList.push(poNum);
                }

                var item = res.getText({ name: "item", label: "Item" });
                var memo = res.getValue({ name: "memo", label: "Memo" });
                var quantity = res.getValue({ name: "custcol_mw_out_weight" });
                var materialQuantity = res.getValue({ name: "custcol_mw_material_qty" });

                return {
                    docnum: docnum,
                    item: item,
                    memo: memo,
                    quantity: quantity,
                    materialQty : materialQuantity
                };
            });

            soDocNum = uniqueSoDocNum.join(",");
            poNum = poNumList.join(",");
            finalMemo = memoList.join("<br/>");
            jobName = jobNameList.join("<br/>");
            finalProcessTypes = processTypeList.join(",");
            if (finalProcessTypes) {
                //                finalProcessTypes = "(" + finalProcessTypes + ")"
            }

            //get HTML representation
            var soItemTable = get_soItemTable(soSearchObj_sr_mapped);
            //pass so item html representation, because they wanted to see soitem every page

            log.debug("soItemTable", soItemTable);
            var tableBodyHtml = getTableBodyHtml(projecttaskSearchObj_sr_grouped, soItemTable);

            var templateFile_internalid = 2625;
            var templateFile_obj = file.load({
                id: "./PLA_TMPLT_ProcessTraveler.html",
            });
            var templateFile_content = templateFile_obj.getContents();
            var finalXmlStr = templateFile_content;

            finalXmlStr = finalXmlStr.replace("{tbody}", tableBodyHtml);

            var replaceStrings = {
                "<customtag for='processId'></customtag>": context.request.parameters.processid,
                //                "<customtag for='startDate'></customtag>" : projectRecord.getText({fieldId : 'startdate'}),
                //08032022 - change start date to date created
                //                "<customtag for='startDate'></customtag>" : projectRecord.getText({fieldId : 'datecreated'}),
                "<customtag for='startDate'></customtag>": so_last_tran_date,
                "<customtag for='processName'></customtag>": projectRecord.getValue({ fieldId: "companyname" }),
                "<customtag for='customerName'></customtag>": projectRecord.getText({ fieldId: "parent" }) || "",
                "<customtag for='salesOrdNum'></customtag>": soDocNum,
                "<customtag for='printTimeStamp'></customtag>": format.format(new Date(), format.Type.DATETIMETZ),
                "<customtag for='soMemo'></customtag>": finalMemo,
                "<customtag for='processType'></customtag>": finalProcessTypes,
                "<customtag for='totalOutWeight'></customtag>": totalOutWeight,
                "<customtag for='jobName'></customtag>": jobName,
                "<customtag for='customerPhone'></customtag>": customerPhone,
                "<customtag for='poNum'></customtag>": poNum,
                "<customtag for='memo'></customtag>": finalStandardMemo,

                "<customtag for='totalQty'></customtag>": finalTotalQty,
                //"<customtag for='scheduledDate'></customtag>": finalScheduledDate,
                "<customtag for='committedDateNotes'></customtag>": finalCommittedDateNotes,
                "<customtag for='committedDate'></customtag>": finalCommittedDate,
                "<customtag for='load'></customtag>": finalLoad,
                "<customtag for='receivedDate'></customtag>": finalReceivedDate,
                "<customtag for='contact'></customtag>": finalContact,
                "<customtag for='contactPhone'></customtag>": finalContactPhone,
            };
            //            var replaceStrings = {
            //                    "<customtag class='processId'></customtag>" : context.request.parameters.processid,
            //                    "<customtag class='startDate'></customtag>" : projectRecord.getText({fieldId : 'startdate'}),
            //                    "<customtag class='processName'></customtag>" : projectRecord.getValue({fieldId : 'companyname'}),
            //                    "<customtag class='customerName'></customtag>" : (projectRecord.getText({fieldId : 'parent'}) || "")
            //                };

            for (var replaceString in replaceStrings) {
                var regex = RegExp(replaceString, "g");
                finalXmlStr = finalXmlStr.replace(regex, replaceStrings[replaceString]);
            }
            log.debug("replaceStrings", JSON.stringify(replaceStrings));

            finalXmlStr = finalXmlStr.replace(/&/g, "&amp;");

            var pdf = render.xmlToPdf({
                xmlString: finalXmlStr,
            });

            context.response.writeFile({ file: pdf, isInline: true });
        } catch (e) {
            log.error("ERROR in function renderPdf", e.message);
        }
    }

    function get_soItemTable(soSearchObj_sr_mapped) {
        var soItemTable = "";

        if (soSearchObj_sr_mapped && soSearchObj_sr_mapped.length > 0) {
            soItemTable += '<table table-layout="fixed" align="left" border="1">';

            soItemTable += '<thead>';

            soItemTable += "<tr>";

            soItemTable += '<td align="center" class="border left top tdItem">';
            soItemTable += '<span class="qtyFont">Item Description</span>';
            soItemTable += "</td>";

            soItemTable += '<td align="center" class="border left top tdQty">';
            soItemTable += '<span class="qtyFont">Out Weight</span>';
            soItemTable += "</td>";

            soItemTable += '<td align="center" class="border left top tdQty">';
            soItemTable += '<span class="qtyFont">Item Quantity</span>';
            soItemTable += "</td>";

            soItemTable += "</tr>";

            soItemTable += '</thead>';
            soItemTable += '<tbody>';

            for (var a = 0; a < soSearchObj_sr_mapped.length; a++) {
                soItemTable += "<tr>";

                soItemTable += '<td class="border left top"><span class="qtyFontVal">';
                if (soSearchObj_sr_mapped[a].memo) {
                    if ( soSearchObj_sr_mapped[a].item != "Material" ) {
                        soItemTable += soSearchObj_sr_mapped[a].item + " : ";
                    }
                    soItemTable += soSearchObj_sr_mapped[a].memo;
                } else {
                    soItemTable += soSearchObj_sr_mapped[a].item;
                }
                soItemTable += "</span></td>";

                soItemTable += '<td align="center" class="border left top">';
                soItemTable += '<span class="qtyFontVal">'+soSearchObj_sr_mapped[a].quantity+'</span>';
                soItemTable += "</td>";

                soItemTable += '<td align="center" class="border left top">';
                soItemTable += '<span class="qtyFontVal">'+soSearchObj_sr_mapped[a].materialQty+'</span>';
                soItemTable += "</td>";

                soItemTable += "</tr>";
            }

            soItemTable += '</tbody>';
            soItemTable += "</table>";
        }

        return soItemTable;
    }

    function getSoSearch(processId) {
        var filters = [
            ["mainline", "is", "F"],
            "AND",
            ["item.type", "anyof", "Description", "InvtPart", "Group", "Kit", "NonInvtPart", "OthCharge", "Service", "Subtotal"],
            "AND",
            ["item","noneof","414"]
        ];
        if (processId) {
            filters.push("AND"), filters.push(["name", "anyof", processId]);
        }
        var soSearchObj = search.create({
            type: "salesorder",
            filters: filters,
            columns: [
                search.createColumn({ name: "tranid", label: "Document Number" }),
                search.createColumn({ name: "item", label: "Item" }),
                search.createColumn({ name: "memomain", label: "Memo Main" }),
                search.createColumn({ name: "quantityuom", label: "Quantity" }),
                search.createColumn({ name: "custcol_mw_out_weight", label: "Out Weight Quantity" }),
                search.createColumn({ name: "custcol_mw_material_qty", label: "Material Quantity" }),
                search.createColumn({ name: "custbody_pla_processtype", label: "Process Type" }),
                search.createColumn({ name: "custcol_pla_outweight", label: "Out Weight" }),
                search.createColumn({ name: "custcol_pla_inweight", label: "In Weight" }),
                search.createColumn({ name: "custbody_pla_processtype", label: "Primary Process Name" }),
                search.createColumn({ name: "memo", label: "Memo" }),
                search.createColumn({ name: "phone", join: "customerMain", label: "Phone" }),
            ],
        });

        return soSearchObj;
    }

    function getBaseSearch(processId) {
        var filters = [];
        if (processId) {
            filters.push(["project", "anyof", processId]);
        }
        var projecttaskSearchObj = search.create({
            type: "projecttask",
            filters: filters,
            columns: [
                search.createColumn({
                    name: "internalid",
                    sort: search.Sort.ASC,
                    label: "Internal ID",
                }),
                search.createColumn({ name: "title", label: "Name" }),
                search.createColumn({ name: "status", label: "Status" }),
                search.createColumn({ name: "startdate", label: "Start Date" }),
                search.createColumn({ name: "predecessors", label: "Predecessors" }),
                search.createColumn({
                    name: "title",
                    join: "predecessor",
                    label: "Name",
                }),
            ],
        });

        return projecttaskSearchObj;
    }

    function getTableBodyHtml(projecttaskSearchObj_sr_grouped, soItemTable) {
        var htmlBodyHtml = "";

        var minimumDigits = 10;

        try {
            for (var taskInternalId in projecttaskSearchObj_sr_grouped) {
                htmlBodyHtml += soItemTable;
                if (projecttaskSearchObj_sr_grouped[taskInternalId][0].name != "Customer") {
                    htmlBodyHtml += '<table style="margin-top:10px; width:100%;" border="1">';
                    htmlBodyHtml += "<thead>";
                    htmlBodyHtml += "<tr>";
                    htmlBodyHtml += '<th width="40%" class="border left"><p align="center">Task ID</p></th>';
                    htmlBodyHtml += '<th width="60%" class="border left"><p align="center">Task Name</p></th>';
                    //                htmlBodyHtml += '<th class="border left"><p align="center">Predecessor</p></th>';
                    //                htmlBodyHtml += '<th class="border left"><p align="center">Start Date</p></th>';
                    //                htmlBodyHtml += '<th class="border left"><p align="center">Status</p></th>';
                    htmlBodyHtml += "</tr>";
                    htmlBodyHtml += "</thead>";
                    htmlBodyHtml += "<tbody>";

                    var maximizedBarcodeText = maximizeBarcode(taskInternalId, minimumDigits);
                    htmlBodyHtml += "<tr>";
                    var barcodeElement =
                        '<barcode bar-width="' +
                        BARCODE_WIDTH +
                        '" height="' +
                        BARCODE_HEIGHT +
                        '" codetype="code128" showtext="false" value="' +
                        maximizedBarcodeText +
                        '"></barcode>';
                    htmlBodyHtml +=
                        '<td class="border left top">' +
                        '<p align="center">' +
                        maximizedBarcodeText +
                        "</p>" +
                        '<p align="center">' +
                        barcodeElement +
                        "</p></td>";

                    htmlBodyHtml +=
                        '<td class="border left top">' +
                        '<p align="center" vertical-align="middle" class="taskName">' +
                        projecttaskSearchObj_sr_grouped[taskInternalId][0].name +
                        "</p></td>";
                    //                htmlBodyHtml += '<td class="border left top">';
                    //                for(var a = 0 ; a < projecttaskSearchObj_sr_grouped[taskInternalId].length ; a++)
                    //                {
                    //                    htmlBodyHtml += '<p align="center">' + projecttaskSearchObj_sr_grouped[taskInternalId][a].predecessor_name + '</p>';
                    //                }
                    //                htmlBodyHtml += '</td>';
                    //
                    //                htmlBodyHtml += '<td class="border left top">' +  '<p align="center">' + projecttaskSearchObj_sr_grouped[taskInternalId][0].start_date + '</p></td>';
                    //                htmlBodyHtml += '<td class="border left top">' +  '<p align="center">' + projecttaskSearchObj_sr_grouped[taskInternalId][0].status + '</p></td>';
                    htmlBodyHtml += "</tr>";

                    htmlBodyHtml += "</tbody>";
                    htmlBodyHtml += "</table>";
                }
                htmlBodyHtml +=
                    "<p class='titleNotes' style='font-family: sans-serif;' align='left'>Process Notes : <br/><span style='font-size: 18pt;'><customtag for='soMemo'></customtag></span></p>";

                htmlBodyHtml += "<pbr/>";
            }

            //remove the last PBR
            if (htmlBodyHtml) {
                htmlBodyHtml = htmlBodyHtml.substring(0, htmlBodyHtml.length - 6);
            }
        } catch (e) {
            log.error("ERROR in function getTableBodyHtml", e);
        }

        //log.debug("htmlBodyHtml",htmlBodyHtml)
        return htmlBodyHtml;
    }

    function maximizeBarcode(initialBarcodeText, minimumDigits) {
        var newBarcodeText = "";

        newBarcodeText = "" + initialBarcodeText;

        while (newBarcodeText.length < minimumDigits) {
            newBarcodeText = "0" + newBarcodeText;
        }
        //        if(newBarcodeText.length < minimumDigits)
        //        {
        //
        //        }

        return newBarcodeText;
    }

    var groupBy = function (xs, key) {
        return xs.reduce(function (rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    };

    var getResults = function (set) {
        var holder = [];
        var i = 0;
        while (true) {
            var result = set.getRange({
                start: i,
                end: i + 1000,
            });
            if (!result) break;
            holder = holder.concat(result);
            if (result.length < 1000) break;
            i += 1000;
        }
        return holder;
    };

    return {
        onRequest: onRequest,
        getBaseSearch: getBaseSearch,
    };
});
   