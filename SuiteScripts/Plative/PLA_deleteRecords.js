/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Oct 2022     USER
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
function massUpdate(recType, recId)
{
	try
	{
		nlapiLogExecution("DEBUG", recType, recType);
		var deletedRecId = nlapiDeleteRecord(recType, recId);
		nlapiLogExecution("DEBUG", deletedRecId, deletedRecId);
		
	}
	catch(e)
	{
		nlapiLogExecution("DEBUG", "ERROR trying to delete " + JSON.stringify({recType:recType, recId:recId}), e.message)
	}
	
}
