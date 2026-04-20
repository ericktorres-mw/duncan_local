/**
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/https", "N/search", "N/log"], function (require, exports, https, search, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getESurchargePercentageOfTotal = exports.calculateMinimumOrderAmount = exports.getCustomerMinimumOrderAmount = void 0;
    var queriesCache = {};
    function getCustomerMinimumOrderAmount(customerId) {
        var customerLookup = search.lookupFields({
            type: search.Type.CUSTOMER,
            id: customerId,
            columns: ["custentity_mw_minimum_order_amount"],
        });
        var minimumOrderQuantity = customerLookup && customerLookup.custentity_mw_minimum_order_amount
            ? Number(customerLookup.custentity_mw_minimum_order_amount)
            : getGlobalCustomerMinimumOrderAmount();
        return minimumOrderQuantity;
    }
    exports.getCustomerMinimumOrderAmount = getCustomerMinimumOrderAmount;
    function getGlobalCustomerMinimumOrderAmount() {
        var response = https.requestSuitelet({
            scriptId: "customscript_mw_comp_info_st",
            deploymentId: "customdeploy_mw_comp_info_st_d",
        });
        log.debug("getGlobalCustomerMinimumOrderAmount", response);
        if (response) {
            return Number(response.body);
        }
        return 0;
    }
    function calculateMinimumOrderAmount(subTotal, customerMinimumOrderAmount, surchangePercentage) {
        return Math.round((customerMinimumOrderAmount / (1 + surchangePercentage / 100) - subTotal) * 100) / 100;
    }
    exports.calculateMinimumOrderAmount = calculateMinimumOrderAmount;
    function getESurchargePercentageOfTotal() {
        var searchObj = search.create({
            type: search.Type.SHIP_ITEM,
            columns: ["shippingrateaspercentoftotal"],
            filters: [["itemid", search.Operator.CONTAINS, "E-Surcharge"]],
        });
        var results = searchObj.run().getRange({ start: 0, end: 1 });
        if (results && results.length > 0) {
            return Number(results[0].getValue("shippingrateaspercentoftotal"));
        }
        return 0;
    }
    exports.getESurchargePercentageOfTotal = getESurchargePercentageOfTotal;
});
