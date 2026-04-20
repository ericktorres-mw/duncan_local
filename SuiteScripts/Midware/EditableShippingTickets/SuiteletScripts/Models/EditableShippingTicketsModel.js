/**
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
*/
define(["require", "exports", "N/log", "N/record"], function (require, exports, log, record) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function getOrderData(pSalesOrder) {
        var rec = record.load({ type: record.Type.SALES_ORDER, id: pSalesOrder });
        var soNum = rec.getValue("tranid");
        var billAdd = rec.getValue("billaddress");
        var shipAdd = rec.getValue("shipaddress");
        var itemsList = [];
        var itemLenght = rec.getLineCount({ sublistId: "item" });
        for (var i = 0; i < itemLenght; i++) {
            var qty = rec.getSublistValue({ sublistId: "item", fieldId: "custcol_mw_material_qty", line: i });
            var item = rec.getSublistValue({ sublistId: "item", fieldId: "item_display", line: i });
            var description = rec.getSublistValue({ sublistId: "item", fieldId: "description", line: i });
            var weight = rec.getSublistValue({ sublistId: "item", fieldId: "custcol_mw_out_weight", line: i });
            itemsList.push({
                item: item,
                description: (description || " "),
                qty: (qty || 0),
                weight: (weight || 0)
            });
        }
        var res = {
            salesOrder: pSalesOrder,
            soNum: soNum,
            billAdd: billAdd,
            shipAdd: shipAdd,
            itemsList: itemsList,
        };
        log.debug("GET Data Result", res);
        return res;
    }
    exports.getOrderData = getOrderData;
});
