/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import { EntryPoints, UserEventType } from "N/types";

import * as log from "N/log";
import * as search from "N/search";
import * as currentRecord from "N/currentRecord";

const E_SURCHARGE_ID = "208";

export function pageInit(pContext: EntryPoints.Client.pageInitContext) { }

export function fieldChanged(pContext: EntryPoints.Client.fieldChangedContext) {
    try {

        let rec = pContext.currentRecord;

        if (pContext.fieldId === 'entity') {
            updateShippingCost(rec);
        }

    } catch (error) {
        handleError(error);
    }
}

export function sublistChanged(pContext: EntryPoints.Client.sublistChangedContext) {

    if (pContext.sublistId === 'item') {

        let rec = currentRecord.get();

        log.debug("sublistChanged",pContext.sublistId); 

        updateShippingCost(rec);

    }
}

function updateShippingCost(pRecord) {

    try {

        const customerId = pRecord.getValue('entity');
        const shippingMethod = pRecord.getValue('shipmethod');

        if (customerId && shippingMethod) {

            if (shippingMethod.toString() == E_SURCHARGE_ID) {

                let customerLookup = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: customerId.toString(),
                    columns: ['custentity_mw_e_surcharge_percent']
                });

                let shippingPercentage = parseFloat(customerLookup['custentity_mw_e_surcharge_percent']) || 0;

                log.debug("shippingPercentage", shippingPercentage);

                if (shippingPercentage > 0) {

                    var subtotal = parseFloat(pRecord.getValue('subtotal').toString()) || 0;

                    log.debug("subtotal", subtotal);

                    var newShippingCost = (subtotal * shippingPercentage) / 100;

                    pRecord.setValue({
                        fieldId: 'shippingcost',
                        value: newShippingCost.toFixed(2)
                    });
                }

                //log.debug("shippingcost", newShippingCost.toFixed(2));
            }
        }
    } catch (error) {
        log.error('Error updating shipping cost', error);
    }
}

function handleError(pError: Error) {

    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });

}
