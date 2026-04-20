/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

export const RECORD_IDS = {
    material_item_id: 107,
    g_item_id: 325,
    mass_tax_id: 411,

    qty_unit_id: 1,
    in_lb_unit_id: 5,
};

export const BYLL_BY_ID_LIST = [
    "custcol_mw_out_weight",
    "custcol_mw_material_qty",
    "custcol_mw_service_qty",
    "custcol_mw_area"
]

export const BILL_BY_SELECTOR = {
    "2" : "custcol_mw_out_weight",    // Out Weight
    "3" : "custcol_mw_material_qty",  // Material Qty
    "4" : "custcol_mw_service_qty",   // Service Qty
    "5" : "custcol_mw_area",          // Area
    "6" : "" // Lot Charge
}

export const ITEMS_BILL_BY = {
    "107" : "3",                       // Material
    "326" : "4",                       // Holes
    //"311" : "4",                       // Masking
    "311" : "4",                       // Blast
    "328" : "4",                       // Other Purchase
    "329" : "4",                       // Other Service
    "332" : "4",                       // Plugs
    "211" : "4",                       // Shipping
    "335" : "4",                       // Zirp
}