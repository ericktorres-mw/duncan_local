/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'],
/**
 * @param {record} record
 */
function(record, runtime, search) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext)
    {
        if(scriptContext.newRecord.type == "salesorder")
        {
            var runtimeLogo = runtime.getCurrentScript().getParameter({
                name : "custscript_pla_coc_logo"
            });
            log.debug("runtimeLogo before clean", runtimeLogo)
            runtimeLogo_clean = runtimeLogo.replace(/&/g, '&amp;');
            log.debug("runtimeLogo after clean", runtimeLogo_clean)
            if(runtimeLogo_clean)
            {
                scriptContext.newRecord.setValue({
                    fieldId : "custbody_coclogo_url",
                    value : runtimeLogo
                })
            }
        }
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext)
    {
        if(scriptContext.type != "delete")
        {
            var finalProcessTexts = [];
            try
            {
                var sublistId = "item";

                var lineCount = scriptContext.newRecord.getLineCount({
                    sublistId : sublistId
                });

                var primaryProcess = []
                var secondaryProcess = [];

                for(var a = 0 ; a < lineCount ; a++)
                {
                    var processOrder = scriptContext.newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : "custcol_mw_so_process_order",
                        line : a
                    });

                  	var line_processId = scriptContext.newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : "custcol_duncan_primaryprocess",
                        line : a
                    });

                    if ( line_processId ) {

                        var processO = processOrder ? processOrder : 1;

                        if ( processO == 1 ) {
                            primaryProcess.push(line_processId);
                        } else {
                            secondaryProcess.push(line_processId);
                        }
                    }
                }
              
              	if(primaryProcess.length > 0)
                {
                    finalProcessTexts = resolveProcessNames(primaryProcess);
                } 
                else if (secondaryProcess.length > 0)
                {
                    finalProcessTexts = resolveProcessNames(secondaryProcess);
                }
                log.debug("finalProcessTexts", finalProcessTexts)
                
                var finalProcessTexts = finalProcessTexts.join(",");
                log.debug("finalProcessTexts", finalProcessTexts);

                scriptContext.newRecord.setValue({
                    fieldId : "custbody_pla_processtype",
                    value : finalProcessTexts
                })
        
                if(scriptContext.newRecord.type == "salesorder")
                {
                    var runtimeLogo = runtime.getCurrentScript().getParameter({
                        name : "custscript_pla_coc_logo"
                    });
                    log.debug("runtimeLogo before clean", runtimeLogo)
                    runtimeLogo_clean = runtimeLogo.replace(/&/g, '&amp;');
                    log.debug("runtimeLogo after clean", runtimeLogo_clean)
                    if(runtimeLogo_clean)
                    {
                        scriptContext.newRecord.setValue({
                            fieldId : "custbody_coclogo_url",
                            value : runtimeLogo
                        })
                    }
                }
                
            }
            catch(e)
            {
                log.debug("ERROR in function beforeSubmit", e)
            }
        }
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }
  
  	function resolveProcessName(processId)
  	{
      	var processText = "";
      	try
        {
            if(processId)
            {
                lookupObj = search.lookupFields({
                  type : "customlist_pla_processtypes",
                  id : processId,
                  columns : ["name"]
                });
              	log.debug("lookupObj", lookupObj)
              	processText = lookupObj.name;
            }
		}
      	catch(e)
        {
          	log.error("ERROR in function resolveProcessName", e)
        }
      	return processText;
    }
      
    function resolveProcessNames(processIds)
  	{
      	var finalProcessTexts = [];
      	try
        {
            if(processIds)
            {
                var searchObj = search.create({
                  type : "customlist_pla_processtypes",
                  filters : ["internalid", "anyof", processIds],
                  columns : ["name"]
                });
              
              	searchObj.run().each(function(res){
                  log.debug("res", res);
                  finalProcessTexts.push(res.getValue({
                    name : "name"
                  }));
                  return true;
                })
            }
		}
      	catch(e)
        {
          	log.error("ERROR in function resolveProcessName", e)
        }
      	return finalProcessTexts;
    }

    return {
//        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
//        afterSubmit: afterSubmit
    };
    
});
