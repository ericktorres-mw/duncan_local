/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/runtime'],
/**
 * @param {currentRecord} currentRecord
 * @param {runtime} runtime
 */
function(currentRecord, runtime) {
    
    var PICK_UP_RATE_COL_ID = "custcol_dcn_pl_pick_percent";
    
    var OUTWEIGHT_COL_ID = "custcol_pla_outweight";
    var INWEIGHT_COL_ID = "custcol_pla_inweight";
    
    var TOTAL_OUTWEIGHT_FIELD_ID = "custbody_pla_total_out_weight";
    var TOTAL_INWEIGHT_FIELD_ID = "custbody_pla_total_in_weight";
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext)
    {
        try
        {
//            console.log("fieldChanged scriptContext", scriptContext);
            if(scriptContext.sublistId == "item")
            {
                if(scriptContext.fieldId == INWEIGHT_COL_ID)
                {
                    updateOutweight(scriptContext);
                }
                if(scriptContext.fieldId == PICK_UP_RATE_COL_ID)
                {
                    updateOutweight(scriptContext);
                }
            }
        }
        catch(e)
        {
            log.error("ERROR in function fieldChanged", e);
            console.log("ERROR in function fieldChanged", e);
        }
    }
    
    function updateOutweight(scriptContext)
    {
        
//        console.log("updateOutweight scriptContext", scriptContext)
        try
        {
            var pickupRateVal = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId : "item",
                fieldId : PICK_UP_RATE_COL_ID,
                line : scriptContext.line
            }) || 0;
            
            var inWeightVal = scriptContext.currentRecord.getCurrentSublistValue({
                sublistId : "item",
                fieldId : INWEIGHT_COL_ID,
                line : scriptContext.line
            }) || 0;
            
            inWeightVal = Number(inWeightVal)
            pickupRateVal = parseFloat(pickupRateVal);
            
            var outWeightVal = 0;
            if(pickupRateVal)
            {

//                console.log(1, {
//                    pickupRateVal:pickupRateVal,
//                    inWeightVal:inWeightVal,
//                    outWeightVal : outWeightVal
//                })
                
                outWeightVal = Math.ceil(inWeightVal + (inWeightVal * pickupRateVal / 100));
                
//                console.log(2, {
//                    pickupRateVal:pickupRateVal,
//                    inWeightVal:inWeightVal,
//                    outWeightVal : outWeightVal
//                })
            }
            else
            {
                outWeightVal = Math.ceil(inWeightVal);
                
//                console.log(3, {
//                    pickupRateVal:pickupRateVal,
//                    inWeightVal:inWeightVal,
//                    outWeightVal : outWeightVal
//                })
            }
            
//            console.log({
//                pickupRateVal:pickupRateVal,
//                inWeightVal:inWeightVal,
//                outWeightVal : outWeightVal
//            })
            
            scriptContext.currentRecord.setCurrentSublistValue({
                sublistId : "item",
                fieldId : OUTWEIGHT_COL_ID,
                value : outWeightVal,
                line : scriptContext.line
            });

            scriptContext.currentRecord.setCurrentSublistValue({
                sublistId : "item",
                fieldId : "custcol_mw_out_weight",
                value : outWeightVal,
                line : scriptContext.line
            });
        }
        catch(e)
        {
            log.error("ERROR in function updateOutweight", e);
            console.log("ERROR in function updateOutweight", e);
        }
        
        
        
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext)
    {
        try
        {
            var totalOutweight = getColumnTotal(scriptContext, OUTWEIGHT_COL_ID)
            var totalIweight = getColumnTotal(scriptContext, INWEIGHT_COL_ID)
            
            scriptContext.currentRecord.setValue({
                fieldId : TOTAL_OUTWEIGHT_FIELD_ID,
                value : totalOutweight
            })
            
            scriptContext.currentRecord.setValue({
                fieldId : TOTAL_INWEIGHT_FIELD_ID,
                value : totalIweight
            })
        }
        catch(e)
        {
            console.log("ERROR in function sublistChanged", e);
            log.error("ERROR in function sublistChanged", e);
        }
    }
    
    function getColumnTotal(scriptContext, columnId)
    {
        var total = 0;
        try
        {
            var lineCount = scriptContext.currentRecord.getLineCount({sublistId : "item"})
//            console.log("getColumnTotal lineCount", lineCount);
            for(var a = 0 ; a < lineCount ; a++)
            {
                var val = scriptContext.currentRecord.getSublistValue({
                    sublistId : "item",
                    fieldId : columnId,
                    line : a
                }) || 0;
                total += val;
            }
            
        }
        catch(e)
        {
            log.error("ERROR in function getColumnTotal", e)
            console.log("ERROR in function getColumnTotal", e)
        }
//        console.log("getColumnTotal for " + columnId, total);
        return total;
    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }

    return {
//        pageInit: pageInit,
        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
//        saveRecord: saveRecord
    };
    
});
