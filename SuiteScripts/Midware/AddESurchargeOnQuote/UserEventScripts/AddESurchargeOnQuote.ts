/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import { EntryPoints } from "N/types";

import * as log from "N/log";
import * as record from "N/record";
import * as search from "N/search";

const E_SURCHARGE_ID = "208";

export function beforeLoad(pContext: EntryPoints.UserEvent.beforeLoadContext) {
}

export function beforeSubmit(pContext: EntryPoints.UserEvent.beforeSubmitContext) {

    try {

        if (pContext.type == pContext.UserEventType.CREATE || pContext.type == pContext.UserEventType.EDIT) {

            const newRecord = pContext.newRecord;

            const customerId = newRecord.getValue('entity');
            const shippingMethod = newRecord.getValue('shipmethod');

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

                        var subtotal = parseFloat(newRecord.getValue('subtotal').toString()) || 0;

                        var newShippingCost = (subtotal * shippingPercentage) / 100;

                        newRecord.setValue({
                            fieldId: 'shippingcost',
                            value: newShippingCost.toFixed(2)
                        });
                    }

                    log.debug("shippingcost", newShippingCost.toFixed(2));
                }
            }
        }

    } catch (error) {
        handleError(error);
    }
}

export function afterSubmit(pContext: EntryPoints.UserEvent.afterSubmitContext) { }

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });

    log.error({ title: "Stack", details: JSON.stringify(pError) });
}

