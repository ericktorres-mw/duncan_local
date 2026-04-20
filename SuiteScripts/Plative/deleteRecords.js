/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
/**
 * @param {record} record
 */
function(record) {
    
    /**
     * Definition of Mass Update trigger point.
     *
     * @param {Object} params
     * @param {string} params.type - Record type of the record being processed by the mass update
     * @param {number} params.id - ID of the record being processed by the mass update
     *
     * @since 2016.1
     */
    function each(params)
    {
    	log.debug("params", params);
    	try
    	{

        	var deletedRecordId = record.delete({
        		type : params.type,
        		id : params.id
        	});
        	log.debug("deletedRecordId", deletedRecordId);
    	}
    	catch(e)
    	{
    		log.error("ERROR trying to delete record, params", params);
    	}
    }

    return {
        each: each
    };
    
});
