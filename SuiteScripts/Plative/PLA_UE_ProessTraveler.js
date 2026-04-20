/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * Description: Provides button to initiate the Process Traveler PDF / Rendered
 * 
 * version  : 1.0.0 - initial version
 * author       : Plative/Rodmar
 * date     : 02/13/2022
 */

define(['N/ui/serverWidget', 'N/url', './PLA_SL_ProcessTravelerRenderer.js'],
/**
 * @param {serverWidget} serverWidget
 * @param {url} url
 */
function(serverWidget, url, processTraveler) {
   
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
        try
        {
            if(scriptContext.newRecord.id)
            {
                var projecttaskSearchObj = processTraveler.getBaseSearch(scriptContext.newRecord.id);
                var projecttaskSearchObj_sr = getResults(projecttaskSearchObj.run());
                
                log.debug("projecttaskSearchObj_sr", projecttaskSearchObj_sr);
                
                if(projecttaskSearchObj_sr.length > 0)
                {
                    scriptContext.form.addButton({
                        name : "custpage_print_process_traveler",
                        id : "custpage_print_process_traveler",
                        label : "Print Process Traveller",
                        functionName : 'window.open("' + url.resolveScript({
                            returnExternalUrl: false,
                            scriptId: 'customscript_pla_sl_processtraveler',
                            deploymentId: 'customdeploy_pla_sl_processtraveler',
                            params: {
                                processid: scriptContext.newRecord.id
                            }
                          }) + '")'
                    })
                }
            }
        }
        catch(e)
        {
            log.error("ERROR in function beforeLoad", e);
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
    function beforeSubmit(scriptContext) {

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
        beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    };
    
});
