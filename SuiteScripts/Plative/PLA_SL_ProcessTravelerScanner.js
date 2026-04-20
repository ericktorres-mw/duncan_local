/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

/**
 * Description: allows scan - submit of (project task) barcodes
 * 
 * version  : 1.0.0 - initial version
 * author       : Plative/Rodmar
 * date     : 02/13/2022
 */

define(['N/record', 'N/search', 'N/render', 'N/file', 'N/format', 'N/ui/serverWidget', 'N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, render, file, format, serverWidget, runtime) {
   
    var ERROR_MSG_STARTWITH = "ERROR resolving barcode as a Process Task";
    var READYFORSUBMIT_MSG = "";
    var SUCCESSFULSUBMIT_MSG = "Process Task updated successfully";
    var PRE_SUBMIT_DEFAULT_MSG = "To be discovered after submiting";
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context)
    {
        
        if(context.request.method == "GET")
        {
            log.debug("context.request.parameters", context.request.parameters); //request object parameters
            var form = buildUi(context);
            
            //these are lost on url parameters when posting / using submit button
            //track the script id and deploy id so you can easily resolve it again if you need to.
            var scriptFld = form.addField({
                id : "custpage_pla_ptsp_scriptid",
                label : "scriptid",
                type : "text"
            })
            scriptFld.defaultValue = context.request.parameters.script;
            scriptFld.updateDisplayType({
                displayType : "hidden"
            })
            var deployFld = form.addField({
                id : "custpage_pla_ptsp_scriptdeploymentid",
                label : "deploymentid",
                type : "text"
            })
            deployFld.defaultValue = context.request.parameters.deploy;
            deployFld.updateDisplayType({
                displayType : "hidden"
            })
            
            
            context.response.writePage(form);
        }
        else
        {
            var form = buildUi(context);
            
            var scriptFld = form.addField({
                id : "custpage_pla_ptsp_scriptid",
                label : "scriptid",
                type : "text"
            })
            scriptFld.defaultValue = context.request.parameters.custpage_pla_ptsp_scriptid;
            scriptFld.updateDisplayType({
                displayType : "hidden"
            })
            var deployFld = form.addField({
                id : "custpage_pla_ptsp_scriptdeploymentid",
                label : "deploymentid",
                type : "text"
            })
            deployFld.defaultValue = context.request.parameters.custpage_pla_ptsp_scriptdeploymentid;
            deployFld.updateDisplayType({
                displayType : "hidden"
            })
            
            context.response.writePage(form);
        }
    }
    
    function buildUi(context)
    {
        var form = serverWidget.createForm({
            title : "Process Task Scanning Page",
            hideNavBar : true
        });
        
        try
        {
            form.clientScriptModulePath = "./PLA_CS_ProcessTravelerScanner.js";
            
            form.addSubmitButton({
                label : "Save",
                id : "custbutton_pla_ptsp_save",
            });
            
//            form.addButton({
//                label : "Validate",
//                id : "custbutton_pla_ptsp_scan_now",
//                functionName : "scan_now"
//            });
            form.addButton({
                label : "Clear",
                id : "custbutton_pla_ptsp_clear",
                functionName : "clear"
            });
            
            var taskidFld = form.addField({
                id : "custpage_pla_ptsp_taskinternalid",
                label : "Task ID / Barcode",
                //type : "textarea"
                type : "text"
            })
            taskidFld.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTCOL
            });
            taskidFld.updateLayoutType({
                layoutType : serverWidget.FieldLayoutType.STARTROW
            });
//            taskidFld.updateDisplayType({
//                displayType : "inline"
//            })
            taskidFld.isMandatory = true;
            
            var tasknameFld = form.addField({
                id : "custpage_pla_ptsp_taskname",
                label : "Task Name",
                type : "textarea"
            })
            tasknameFld.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTROW
            });
            tasknameFld.updateDisplayType({
                displayType : "inline"
            })
            tasknameFld.updateLayoutType({
                layoutType : serverWidget.FieldLayoutType.STARTROW
            });
            
            var processnameFld = form.addField({
                id : "custpage_pla_ptsp_process",
                label : "Process Name",
                type : "textarea"
            })
            processnameFld.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTROW
            });
            processnameFld.updateLayoutType({
                layoutType : serverWidget.FieldLayoutType.STARTROW
            });
            
            processnameFld.updateDisplayType({
                displayType : "inline"
            })
            
            var timestampFld = form.addField({
                id : "custpage_pla_ptsp_timestamp",
                label : "Time Stamp",
                type : "textarea"
            })
            timestampFld.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTROW
            });
            timestampFld.updateLayoutType({
                layoutType : serverWidget.FieldLayoutType.STARTROW
            });
            timestampFld.updateDisplayType({
                displayType : "inline"
            })

            var statusFld = form.addField({
                id : "custpage_pla_ptsp_status",
                label : "Status",
                type : "textarea"
            });
            statusFld.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTROW
            });
            statusFld.updateLayoutType({
                layoutType : serverWidget.FieldLayoutType.STARTROW
            });
            statusFld.updateDisplayType({
                displayType : "inline"
            })
            
            
            
            var lastScanFld = form.addField({
                id : "custpage_pla_ptsp_lastscan",
                label : "Last Scanned Code",
                type : "textarea"
            })
            lastScanFld.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTROW
            });
            lastScanFld.updateLayoutType({
                layoutType : serverWidget.FieldLayoutType.STARTROW
            });
            lastScanFld.updateDisplayType({
                displayType : "inline"
            })
            if(context.request.parameters.projecttaskid)
            {
                lastScanFld.defaultValue = context.request.parameters.projecttaskid
            }
            
//            timestampFld.defaultValue = format.format(new Date(), format.Type.DATETIMETZ)
            
            if(context.request && context.request.parameters && context.request.parameters.projecttaskid)
            {
                try
                {
                    taskidFld.defaultValue = context.request.parameters.projecttaskid;
                    
                    var taskRecord = record.load({
                        type : "projecttask",
                        id : context.request.parameters.projecttaskid
                    });
                    
                    taskRecord_name = taskRecord.getText({
                        fieldId : "title"
                    });
                    if(taskRecord_name)
                    {
                        tasknameFld.defaultValue = taskRecord_name
                    }
                    
                    taskRecord_projectname = taskRecord.getText({
                        fieldId : "company"
                    });
                    if(taskRecord_projectname)
                    {
                        processnameFld.defaultValue = taskRecord_projectname
                    }
                    
                    taskRecord_timestamp = taskRecord.getValue({
                        fieldId : "custevent_completiontimestamp"
                    });
                    //timestampFld.defaultValue = "Previous Value : " + taskRecord_timestamp;
                    timestampFld.defaultValue = "Previous Value : " + format.format(taskRecord_timestamp, format.Type.DATETIMETZ);;
                    
                    taskRecord_status = taskRecord.getText({
                        fieldId : "status"
                    });
                    statusFld.defaultValue = "Previous Value : " + taskRecord_status;
                    
                }
                catch(e)
                {
                    tasknameFld.defaultValue = ERROR_MSG_STARTWITH + " : " + e.message                    
                    processnameFld.defaultValue = ERROR_MSG_STARTWITH + " : " + e.message
                    
                    statusFld.defaultValue = "Cannot save this scan. \n" + ERROR_MSG_STARTWITH + " : " + e.message
                    
                    log.error("ERROR in resolving project task", e)
                }
                
            }
            
            if(context.request.method == "POST")
            {
                log.debug("context.request", context.request)
                log.debug("context.request.body", context.request.body)
                
                if(context.request && context.request.parameters && context.request.parameters.custpage_pla_ptsp_taskinternalid)
                {
                    var hasError = false;
//                    var taskRecord = record.load({
//                        type : "projecttask",
//                        id : context.request.parameters.custpage_pla_ptsp_taskinternalid
//                    });
//                    taskRecord.setFieldValue({})
                    var completionTimeStamp = format.format(new Date(), format.Type.DATETIMETZ)
                    
                    var valuesToUpdate = {
                            status : "COMPLETE",
                            custevent_completiontimestamp : completionTimeStamp
                    };
                    
                    try
                    {
                        var submittedRecId = record.submitFields({
                            type : "projecttask",
                            id : context.request.parameters.custpage_pla_ptsp_taskinternalid,
                            values : valuesToUpdate
                        });

                        log.debug("submittedRecId", submittedRecId);
                    }
                    catch(e)
                    {

                        statusFld.defaultValue = "" + e.message;
                        var hasError = "ERROR : " + e.message;
                        log.error("ERROR updating the Process Task using values : ", valuesToUpdate)
                        log.error("ERROR updating the Process Task : ", e)
                    }
                    
                    
                    
                    
//                    taskidFld.defaultValue = context.request.parameters.custpage_pla_ptsp_taskinternalid;
                    if(context.request.parameters.custpage_pla_ptsp_taskinternalid)
                    {
                        lastScanFld.defaultValue = context.request.parameters.custpage_pla_ptsp_taskinternalid
                    }
                    
                    var taskRecord = record.load({
                        type : "projecttask",
                        id : context.request.parameters.custpage_pla_ptsp_taskinternalid
                    });
                    
                    taskRecord_name = taskRecord.getText({
                        fieldId : "title"
                    });
                    if(taskRecord_name)
                    {
                        tasknameFld.defaultValue = taskRecord_name
                    }
                    
                    taskRecord_projectname = taskRecord.getText({
                        fieldId : "company"
                    });
                    if(taskRecord_projectname)
                    {
                        processnameFld.defaultValue = taskRecord_name
                    }
                    
                    taskRecord_timestamp = taskRecord.getValue({
                        fieldId : "custevent_completiontimestamp"
                    });
                    
                    if(hasError)
                    {
                        statusFld.defaultValue = hasError;
                        timestampFld.defaultValue = hasError;
                    }
                    else
                    {
                        timestampFld.defaultValue = format.format(taskRecord_timestamp, format.Type.DATETIMETZ);
                        //timestampFld.defaultValue = taskRecord_timestamp//format.format(taskRecord_timestamp, format.Type.DATETIMETZ);
                        
                        taskRecord_status = taskRecord.getText({
                            fieldId : "status"
                        });
                        
                        statusFld.defaultValue = taskRecord_status + "\n" + SUCCESSFULSUBMIT_MSG;
                    }
                    
                }
                
            }
            
        }
        catch(e)
        {
            statusFld.defaultValue = "" + e.message;
            log.error("ERROR in function buildUi", e);
        }

        return form;
    }
    
    
    function getBaseSearch(processId)
    {
        var filters = [];
        if(processId)
        {
            filters.push(["project","anyof",processId])
        }
        var projecttaskSearchObj = search.create({
            type: "projecttask",
            filters:filters,
            columns:
            [
               search.createColumn({
                  name: "internalid",
                  sort: search.Sort.ASC,
                  label: "Internal ID"
               }),
               search.createColumn({name: "title", label: "Name"}),
               search.createColumn({name: "status", label: "Status"}),
               search.createColumn({name: "startdate", label: "Start Date"}),
               search.createColumn({name: "predecessors", label: "Predecessors"}),
               search.createColumn({
                  name: "title",
                  join: "predecessor",
                  label: "Name"
               })
            ]
         });
        
        return projecttaskSearchObj;
    }
    
    function getTableBodyHtml(projecttaskSearchObj_sr_grouped)
    {
        var htmlBodyHtml = "";
        
        var minimumDigits = 10;
        
        try
        {
            for(var taskInternalId in projecttaskSearchObj_sr_grouped)
            {
                var maximizedBarcodeText = maximizeBarcode(taskInternalId, minimumDigits);
                htmlBodyHtml += "<tr>";
                var barcodeElement = '<barcode bar-width="1.25" codetype="code128" showtext="false" value="' + maximizedBarcodeText + '"></barcode>';
                htmlBodyHtml += '<td class="border left top">' +  '<p align="center">' + maximizedBarcodeText + '</p>' + '<p align="center">' + barcodeElement + '</p></td>';

                htmlBodyHtml += '<td class="border left top">' +  '<p align="center">' + projecttaskSearchObj_sr_grouped[taskInternalId][0].name + '</p></td>';
                htmlBodyHtml += '<td class="border left top">';
                for(var a = 0 ; a < projecttaskSearchObj_sr_grouped[taskInternalId].length ; a++)
                {
                    htmlBodyHtml += '<p align="center">' + projecttaskSearchObj_sr_grouped[taskInternalId][a].predecessor_name + '</p>';
                }
                htmlBodyHtml += '</td>';
                
                htmlBodyHtml += '<td class="border left top">' +  '<p align="center">' + projecttaskSearchObj_sr_grouped[taskInternalId][0].start_date + '</p></td>';
                htmlBodyHtml += '<td class="border left top">' +  '<p align="center">' + projecttaskSearchObj_sr_grouped[taskInternalId][0].status + '</p></td>';
                
                
                htmlBodyHtml += "</tr>";
            }
        }
        catch(e)
        {
            log.error("ERROR in function getTableBodyHtml", e);
        }
        
        return htmlBodyHtml;
    }
    
    function maximizeBarcode(initialBarcodeText, minimumDigits)
    {
        var newBarcodeText = "";
        
        newBarcodeText = '' + initialBarcodeText;
        
        while(newBarcodeText.length < minimumDigits)
        {
            newBarcodeText = '0' + newBarcodeText;
        }
//        if(newBarcodeText.length < minimumDigits)
//        {
//            
//        }
        
        return newBarcodeText;
    }
    
    var groupBy = function(xs, key) {
        return xs.reduce(function(rv, x) {
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
            end: i + 1000
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
        getBaseSearch : getBaseSearch
    };
    
});
