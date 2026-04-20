/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as log from "N/log";

import { EntryPoints } from "N/types";
import { getCustomerMinimumOrderAmount } from "./Functions/TransactionFunctions";

export function saveRecord(pContext: EntryPoints.Client.saveRecordContext) {
    try {
        const { currentRecord } = pContext;

        const customerOverride = currentRecord.getValue({ fieldId: "custbody_mw_order_amount_override" });

        if (!customerOverride) {
            const subTotal = currentRecord.getValue({ fieldId: "subtotal" });

            log.debug("[saveRecord] customerOverride", customerOverride);
            log.debug("[saveRecord] totalAmount", subTotal);

            const totalAmount = Number(subTotal);

            const customer = currentRecord.getValue({ fieldId: "entity" });

            const customerMinimumOrderAmount = getCustomerMinimumOrderAmount(customer as number);

            log.debug("[saveRecord] customerMinimumOrderAmount", customerMinimumOrderAmount);

            if (Number(totalAmount) < customerMinimumOrderAmount) {
                const response = confirm(
                    `This customer minimum order amount is ${formatAsCurrency(customerMinimumOrderAmount)}. Do you want to continue?`,
                );

                currentRecord.setValue({ fieldId: "custbody_mw_complement_order_min", value: response });

                return response;
            } else {
                currentRecord.setValue({ fieldId: "custbody_mw_complement_order_min", value: false });
            }
        }

        return true;
    } catch (error) {
        handleError(error);
    }
}

export function addMinimumOrderChargeToSummary(minimumOrderAmount: number, actualSubTotal: number, isViewMode: boolean) {
    try {
        if (minimumOrderAmount < 0 || !isViewMode) return;

        const table = document.getElementsByClassName("totallingtable")[0] as HTMLTableElement;
        const tableBody = table?.tBodies[0];
        if (!tableBody) return;

        const children = tableBody.children;

        // Find the insertion point (last row with content)
        let insertIndex = children.length;
        for (let i = children.length - 1; i >= 0; i--) {
            const row = children[i] as HTMLTableRowElement;
            if (!row.classList.contains("totallingtable_item")) {
                insertIndex = i - 1;
                break;
            }
        }

        if (actualSubTotal) {
            children[0].children[0].children[0].children[1].innerHTML = formatAsCurrency(actualSubTotal).replace("$", "");
        }

        const newRow = document.createElement("tr");
        newRow.className = "totallingtable_item uir-field-wrapper-cell";
        newRow.innerHTML = `
        <td>
            <div>
                <span class="smalltextnolink uir-label">
                    <span class="uir-label-span smalltextnolink">Minimum Order Charge</span>
                </span>
                <span class="uir-field inputreadonly">
                    ${formatAsCurrency(minimumOrderAmount).replace("$", "")}
                </span>
            </div>
        </td>
    `;

        if (insertIndex < children.length) {
            tableBody.insertBefore(newRow, children[insertIndex]);
        } else {
            tableBody.appendChild(newRow);
        }
    } catch (error) {
        handleError(error);
    }
}

function formatAsCurrency(value: number) {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
