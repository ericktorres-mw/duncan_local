/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * Description: CS to handle Process Traveler scanner UI
 * 
 * version  : 1.0.0 - initial version
 * author       : Plative/Rodmar
 * date     : 02/13/2022
 */
define(['N/currentRecord', 'N/url'],
/**
 * @param {currentRecord} currentRecord
 */
function(currentRecord, url) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext)
    {
        //console.log("pageInit scriptContext", scriptContext)
        try
        {
            //center a few objects
//            jQuery('.uir-header-buttons').prop('align','center');
//            jQuery('.uir-page-title-firstline').prop('align','center');
        }
        catch(e)
        {
            log.error("ERROR in function pageInit", e.message);
        }
    }
    
    function scan_now(scriptContext)
    {
        try
        {
            //barcodeText = prompt("Scan Barcode");
            
            // Enable navigation prompt
            window.onbeforeunload = function() {
                return true;
            };
            // Remove navigation prompt
            window.onbeforeunload = null;
            
            barcodeText = currentRecord.get().getValue({
                fieldId : "custpage_pla_ptsp_taskinternalid"
            })
            
            if(!barcodeText)
            {
                alert("Discarded / No barcode detected.");
                return;
            }
            
            
            var slUrl = resolveUrl({projecttaskid: barcodeText});
            window.location = slUrl;
            
//            var url = new URL(window.location.href);
//            url.searchParams.set('projecttaskid', barcodeText);
//            window.history.replaceState(null, null, url); // or pushState
//            
//            window.location.reload();
            
//            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?projecttaskid=' + barcodeText;
//            window.history.pushState({ path: newurl }, '', newurl);
            

        }
        catch(e)
        {
            console.log("ERROR in function scan_now", e);
        }
    }
    
    function clear()
    {
        var slUrl = resolveUrl();
        window.location = slUrl;
        
//        var url = new URL(window.location.href);
//        url.searchParams.delete('projecttaskid');
//        window.history.replaceState(null, null, url); // or pushState
//        
//        window.location.reload();
//        
//        var targetRecord = currentRecord.get();
//        var fieldsToClear = ["custpage_pla_ptsp_taskinternalid",
//                             "custpage_pla_ptsp_taskname",
//                             "custpage_pla_ptsp_process",
//                             "custpage_pla_ptsp_status",
//                             ];
//        
//        for(var a = 0 ; a < fieldsToClear.length ; a++)
//        {
//            targetRecord.setValue({
//                fieldId : fieldsToClear[a],
//                value : ""
//            })
//        }
        
    }
    
    function resolveUrl(params)
    {
        var slUrl = url.resolveScript({
            scriptId: 'customscript_pla_sl_processtravelerscan',
            deploymentId: 'customdeploy_pla_sl_processtravelerscan',
            params : params
        });
        
        console.log("resolveUrl", "https://" + window.location.hostname + slUrl);
        
        return "https://" + window.location.hostname + slUrl;
    }

    return {
        pageInit: pageInit,
        scan_now : scan_now,
        clear : clear,
    };
    
});
