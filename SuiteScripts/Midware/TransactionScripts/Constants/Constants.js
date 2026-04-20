/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RECORD_IDS = {
        material_item_id: 107,
        g_item_id: 325,
        mass_tax_id: 411,
        qty_unit_id: 1,
        in_lb_unit_id: 5,
    };
    exports.BYLL_BY_ID_LIST = [
        "custcol_mw_out_weight",
        "custcol_mw_material_qty",
        "custcol_mw_service_qty",
        "custcol_mw_area"
    ];
    exports.BILL_BY_SELECTOR = {
        "2": "custcol_mw_out_weight",
        "3": "custcol_mw_material_qty",
        "4": "custcol_mw_service_qty",
        "5": "custcol_mw_area",
        "6": "" // Lot Charge
    };
    exports.ITEMS_BILL_BY = {
        "107": "3",
        "326": "4",
        //"311" : "4",                       // Masking
        "311": "4",
        "328": "4",
        "329": "4",
        "332": "4",
        "211": "4",
        "335": "4",
    };
});
