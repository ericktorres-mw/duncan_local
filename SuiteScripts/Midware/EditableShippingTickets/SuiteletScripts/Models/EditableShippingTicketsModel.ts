/**
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
*/

import * as log from 'N/log'
import * as record from 'N/record'

export function getOrderData(pSalesOrder) {

    const rec = record.load({ type: record.Type.SALES_ORDER, id: pSalesOrder });

    const soNum = rec.getValue("tranid");
    const billAdd = rec.getValue("billaddress");
    const shipAdd = rec.getValue("shipaddress");

    let itemsList = [];

    const itemLenght = rec.getLineCount({ sublistId: "item" });

    for (let i = 0; i < itemLenght; i++) {

        const qty = rec.getSublistValue({ sublistId: "item", fieldId: "custcol_mw_material_qty", line: i });
        const item = rec.getSublistValue({ sublistId: "item", fieldId: "item_display", line: i });
        const description = rec.getSublistValue({ sublistId: "item", fieldId: "description", line: i });
        const weight = rec.getSublistValue({ sublistId: "item", fieldId: "custcol_mw_out_weight", line: i });

        itemsList.push({
            item,
            description: (description || " "),
            qty: (qty || 0),
            weight: (weight || 0)
        });
    }

    const res = {
        salesOrder : pSalesOrder,
        soNum,
        billAdd,
        shipAdd,
        itemsList,
    }

    log.debug("GET Data Result", res);

    return res;
}