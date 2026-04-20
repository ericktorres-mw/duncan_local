/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as log from "N/log";
import * as file from "N/file";
import * as record from "N/record";
import * as serverWidget from "N/ui/serverWidget";

import { EntryPoints } from "N/types";
import { getCustomerMinimumOrderAmount, getESurchargePercentageOfTotal } from "./Functions/TransactionFunctions";

export function beforeLoad(pContext: EntryPoints.UserEvent.beforeLoadContext) {
    try {
        const { newRecord, form, UserEventType, type } = pContext;

        const summaryTableScriptInjection = form.addField({
            id: "custpage_add_info_to_sum_table",
            label: " ",
            type: serverWidget.FieldType.INLINEHTML,
        });

        const clientScriptURL = file.load({
            id: 30616, //TODO: check id in Prod
        }).path;

        const isViewMode = type === UserEventType.VIEW;

        const minimumOrderAmount = getMinimumOrderCharge(newRecord);
        const subTotal = newRecord.getValue({ fieldId: "subtotal" });

        const actualSubTotal = Math.abs(Number(subTotal) - Number(minimumOrderAmount));

        summaryTableScriptInjection.defaultValue = `<script>jQuery(function(){ require(['${clientScriptURL}'], function(module){module.addMinimumOrderChargeToSummary(${minimumOrderAmount}, ${actualSubTotal}, ${isViewMode});});});</script>`;
    } catch (error) {
        handleError(error);
    }
}

export function beforeSubmit(pContext: EntryPoints.UserEvent.beforeSubmitContext) {
    try {
        const { newRecord, type, UserEventType } = pContext;

        const isCreateMode = type === UserEventType.CREATE;
        const isEditMode = type === UserEventType.EDIT;

        if (!isCreateMode && !isEditMode) return;

        const customerOverride = newRecord.getValue({ fieldId: "custbody_mw_order_amount_override" });

        if (!customerOverride) {
            const customerId = newRecord.getValue({ fieldId: "entity" });

            const subTotal = newRecord.getValue({ fieldId: "subtotal" });

            const minAmount = getCustomerMinimumOrderAmount(customerId as number);

            const surchangePercentage = getESurchargePercentageOfTotal();

            //const complementaryMinAmount = calculateMinimumOrderAmount(subTotal as number, minAmount, surchangePercentage);

            const minimumOrderChargeTotal = removeAllMinimumOrderChargeLines(newRecord);

            const actualSubTotal = Number(subTotal) - Number(minimumOrderChargeTotal);
            const newShippingCost = roundTwoDecimals(actualSubTotal * (surchangePercentage / 100));

            const complementaryMinAmount = Math.abs(minAmount - (Number(actualSubTotal) + Number(newShippingCost)));

            log.debug("[beforeSubmit] surchangePercentage / 100", surchangePercentage / 100);
            log.debug("[beforeSubmit] subTotal", subTotal);
            log.debug("[beforeSubmit] minimumOrderChargeTotal", minimumOrderChargeTotal);
            log.debug("[beforeSubmit] actual subTotal", actualSubTotal);
            log.debug("[beforeSubmit] complementaryMinAmount", complementaryMinAmount);
            log.debug("[beforeSubmit] shippingCost", actualSubTotal * (surchangePercentage / 100));

            newRecord.insertLine({ sublistId: "item", line: 0 });

            newRecord.setSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: 0,
                value: 329, //TODO: check id on Prod
            });

            newRecord.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_mw_bill_by",
                line: 0,
                value: null,
            });

            newRecord.setSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                line: 0,
                value: 1,
            });

            newRecord.setSublistValue({
                sublistId: "item",
                fieldId: "description",
                line: 0,
                value: "Minimum Order Charge",
            });

            newRecord.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                line: 0,
                value: complementaryMinAmount,
            });

            newRecord.setValue({
                fieldId: "custbody_mw_complement_order_min",
                value: false,
            });

            newRecord.setValue({
                fieldId: "shippingcost",
                value: actualSubTotal * (surchangePercentage / 100),
            });
        }
    } catch (error) {
        handleError(error);
    }
}

function removeAllMinimumOrderChargeLines(pRecord: record.Record) {
    let minimumOrderChargeTotal = 0;

    const lineCount = pRecord.getLineCount({ sublistId: "item" });
    for (let i = lineCount - 1; i >= 0; i--) {
        const lineDescription = pRecord.getSublistValue({ sublistId: "item", fieldId: "description", line: i });
        if (lineDescription === "Minimum Order Charge") {
            minimumOrderChargeTotal += Number(pRecord.getSublistValue({ sublistId: "item", fieldId: "amount", line: i }));
            pRecord.removeLine({ sublistId: "item", line: i });
        }
    }

    return minimumOrderChargeTotal;
}

function getMinimumOrderCharge(pRecord: record.Record) {
    const lineCount = pRecord.getLineCount({ sublistId: "item" });

    for (let i = 0; i < lineCount; i++) {
        const lineDescription = pRecord.getSublistValue({ sublistId: "item", fieldId: "description", line: i });
        if (lineDescription === "Minimum Order Charge") {
            return pRecord.getSublistValue({ sublistId: "item", fieldId: "amount", line: i });
        }
    }

    return -1;
}

function roundTwoDecimals(value: number) {
    return Math.round(value * 100) / 100;
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
