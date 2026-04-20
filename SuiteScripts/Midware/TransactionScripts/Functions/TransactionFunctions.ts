/**
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as https from "N/https";
import * as search from "N/search";
import * as log from "N/log";

const queriesCache = {};

export function getCustomerMinimumOrderAmount(customerId: number): number {
    const customerLookup = search.lookupFields({
        type: search.Type.CUSTOMER,
        id: customerId,
        columns: ["custentity_mw_minimum_order_amount"],
    });

    const minimumOrderQuantity =
        customerLookup && customerLookup.custentity_mw_minimum_order_amount
            ? Number(customerLookup.custentity_mw_minimum_order_amount)
            : getGlobalCustomerMinimumOrderAmount();

    return minimumOrderQuantity;
}

function getGlobalCustomerMinimumOrderAmount() {
    const response = https.requestSuitelet({
        scriptId: "customscript_mw_comp_info_st",
        deploymentId: "customdeploy_mw_comp_info_st_d",
    });

    log.debug("getGlobalCustomerMinimumOrderAmount", response);

    if (response) {
        return Number(response.body);
    }

    return 0;
}

export function calculateMinimumOrderAmount(subTotal: number, customerMinimumOrderAmount: number, surchangePercentage: number) {
    return Math.round((customerMinimumOrderAmount / (1 + surchangePercentage / 100) - subTotal) * 100) / 100;
}

export function getESurchargePercentageOfTotal() {
    const searchObj = search.create({
        type: search.Type.SHIP_ITEM,
        columns: ["shippingrateaspercentoftotal"],
        filters: [["itemid", search.Operator.CONTAINS, "E-Surcharge"]],
    });

    const results = searchObj.run().getRange({ start: 0, end: 1 });

    if (results && results.length > 0) {
        return Number(results[0].getValue("shippingrateaspercentoftotal"));
    }

    return 0;
}
