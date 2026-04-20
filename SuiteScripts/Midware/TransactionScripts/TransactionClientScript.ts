/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import { EntryPoints } from "N/types";

import * as log from "N/log";
import * as record from "N/record";
import * as constants from "./Constants/Constants";

export function fieldChanged(pContext: EntryPoints.Client.fieldChangedContext) {
    try {
        const currentRecord = pContext.currentRecord;
        const currentLine = pContext.currentRecord;
        const sublistId = pContext.sublistId;
        const fieldId = pContext.fieldId;

        /* dft, ext_pp_inspection and ext_ip_inspection */

        if (pContext.fieldId == "custbody_mw_dft") {
            currentRecord.setValue({
                fieldId: "custbody_mw_ext_pp_inspection",
                value: false,
                ignoreFieldChange: true,
            });
            currentRecord.setValue({
                fieldId: "custbody_mw_ext_ip_inspection",
                value: false,
                ignoreFieldChange: true,
            });
        } else if (pContext.fieldId == "custbody_mw_ext_pp_inspection") {
            let new_value = currentRecord.getValue({
                fieldId: "custbody_mw_ext_pp_inspection",
            });
            new_value = Boolean(new_value);

            currentRecord.setValue({
                fieldId: "custbody_mw_dft",
                value: new_value,
                ignoreFieldChange: true,
            });
            currentRecord.setValue({
                fieldId: "custbody_mw_ext_ip_inspection",
                value: false,
                ignoreFieldChange: true,
            });
        } else if (pContext.fieldId == "custbody_mw_ext_ip_inspection") {
            let new_value = currentRecord.getValue({
                fieldId: "custbody_mw_ext_ip_inspection",
            });
            new_value = Boolean(new_value);

            currentRecord.setValue({
                fieldId: "custbody_mw_dft",
                value: new_value,
                ignoreFieldChange: true,
            });
            currentRecord.setValue({
                fieldId: "custbody_mw_ext_pp_inspection",
                value: new_value,
                ignoreFieldChange: true,
            });
        } else if (pContext.fieldId == "entity") {
            /* Customer,  /* Not Job Selected: set default value for TAX an gavl pickup override on new items*/
            const customer = currentRecord.getValue({
                fieldId: "entity",
            });
            if (customer) {
                const customerRecord = record.load({
                    type: record.Type.CUSTOMER,
                    id: customer,
                });
                currentRecord.setValue({
                    fieldId: "custpage_mw_gavl_pickup_override",
                    value: customerRecord.getValue({
                        fieldId: "custentity_mw_gavl_pickup_override",
                    }),
                });
                currentRecord.setValue({
                    fieldId: "istaxable",
                    value: customerRecord.getValue({
                        fieldId: "taxable",
                    }),
                });
                /* currentRecord.setValue({
                    fieldId: "taxitem",
                    value: customerRecord.getValue({
                        fieldId: "taxitem",
                    }),
                }); */

                const job_id = currentRecord.getValue({
                    fieldId: "custbody_pl_dn_trck_job",
                });
                //If tracked project name, use his taxable value
                if (job_id) {
                    const trackedJobRecord = record.load({
                        type: "customrecord_pl_dn_trck_job",
                        id: job_id,
                    });
                    currentRecord.setValue({
                        fieldId: "istaxable",
                        value: trackedJobRecord.getValue({
                            fieldId: "custrecord_mw_is_taxable",
                        }),
                    });
                } else {
                    //If theres no tracked project name, use customer taxable value
                    currentRecord.setValue({
                        fieldId: "istaxable",
                        value: customerRecord.getValue({
                            fieldId: "taxable",
                        }),
                    });
                }
            }
        } else if (pContext.fieldId == "custbody_pl_dn_trck_job") {
            /* Tracked Job Name */
            const job_id = currentRecord.getValue({
                fieldId: "custbody_pl_dn_trck_job",
            });
            if (job_id) {
                /* If a Job is selected: Set vales for dft, ext pp inspection, ext ip inspection */
                const trackedJobRecord = record.load({
                    type: "customrecord_pl_dn_trck_job",
                    id: job_id,
                });
                currentRecord.setValue({
                    fieldId: "custbody_mw_dft",
                    value: trackedJobRecord.getValue({
                        fieldId: "custrecord_mw_dft",
                    }),
                    ignoreFieldChange: true,
                });
                currentRecord.setValue({
                    fieldId: "custbody_mw_ext_pp_inspection",
                    value: trackedJobRecord.getValue({
                        fieldId: "custrecord_mw_ext_pp_inspection",
                    }),
                    ignoreFieldChange: true,
                });
                currentRecord.setValue({
                    fieldId: "custbody_mw_ext_ip_inspection",
                    value: trackedJobRecord.getValue({
                        fieldId: "custrecord_mw_ext_ip_inspection",
                    }),
                    ignoreFieldChange: true,
                });
                /* Set default value for TAX on new items */
                const taxable_checkbok = trackedJobRecord.getValue({
                    fieldId: "custrecord_mw_is_taxable",
                });
                currentRecord.setValue({
                    fieldId: "istaxable",
                    value: taxable_checkbok,
                });
                if (taxable_checkbok) {
                    currentRecord.setValue({
                        fieldId: "taxitem",
                        value: constants.RECORD_IDS.mass_tax_id,
                    });
                }
            } else {
                /* Not Job Selected: set default value for TAX on new items based on client*/
                const customer = currentRecord.getValue({
                    fieldId: "entity",
                });
                if (customer) {
                    const customerRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id: customer,
                    });
                    currentRecord.setValue({
                        fieldId: "istaxable",
                        value: customerRecord.getValue({
                            fieldId: "taxable",
                        }),
                    });
                    currentRecord.setValue({
                        fieldId: "taxitem",
                        value: customerRecord.getValue({
                            fieldId: "taxitem",
                        }),
                    });
                }
            }
        } else if (sublistId === "item" && fieldId === "custcol_mw_bill_by") {
            const selectedOption = currentLine
                .getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: fieldId,
                })
                .toString();

            updateQuantityField(currentLine, selectedOption);
        } else if (sublistId === "item" && constants.BYLL_BY_ID_LIST.indexOf(fieldId) !== -1) {
            const selectedOption = currentLine
                .getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_mw_bill_by",
                })
                .toString();

            if (constants.BILL_BY_SELECTOR[selectedOption] == fieldId) {
                updateQuantityField(currentLine, selectedOption);
            }
        } else if (sublistId === "item" && fieldId === "description") {
            const description = currentRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "description",
            });

            if (description) {
                if (description !== description.toString().toUpperCase()) {
                    const upperCaseDescription = description.toString().toUpperCase();

                    currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "description",
                        value: upperCaseDescription,
                    });
                }
            }
        } else if (sublistId === "item" && fieldId === "item") {
            const item = currentRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "item",
            });

            if (item) {
                if (constants.ITEMS_BILL_BY[item.toString()]) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mw_bill_by",
                        value: constants.ITEMS_BILL_BY[item.toString()],
                    });
                } else {
                    const billBy = currentRecord.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_mw_bill_by",
                    });

                    if ("2" != billBy) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_mw_bill_by",
                            value: "2",
                        });
                    }
                }
            }
        }
    } catch (error) {
        handleError(error);
    }
}

export function postSourcing(pContext: EntryPoints.Client.postSourcingContext) {
    try {
        const currentRecord = pContext.currentRecord;

        //Set amount and rate = 0 if item added is "Material"
        if (pContext.sublistId == "item" && pContext.fieldId == "item") {
            const itemId = currentRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "item",
            });

            if (itemId == constants.RECORD_IDS.material_item_id) {
                //Material item
                currentRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "rate",
                    value: 0,
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    value: 0,
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "units",
                    value: constants.RECORD_IDS.qty_unit_id,
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_mw_out_weight",
                    value: "",
                });
            } else {
                //Default unit = lb to all items except material
                currentRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "units",
                    value: constants.RECORD_IDS.in_lb_unit_id,
                });
            }

            if (itemId == constants.RECORD_IDS.g_item_id) {
                //G item
                const gavlPickupOverride = pContext.currentRecord.getValue({
                    fieldId: "custpage_mw_gavl_pickup_override",
                });
                if (gavlPickupOverride) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_dcn_pl_pick_percent",
                        value: gavlPickupOverride,
                    });
                }
            }

            const istaxable = pContext.currentRecord.getValue({
                fieldId: "istaxable",
            });
            currentRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "istaxable",
                value: istaxable,
            });
        }
    } catch (error) {
        handleError(error);
    }
}

function updateQuantityField(pCurrentLine, pSelectedOption) {
    let selectedQty = 0;

    if (pSelectedOption == "6") {
        selectedQty = 1;
    } else {
        selectedQty = pCurrentLine.getCurrentSublistValue({
            sublistId: "item",
            fieldId: constants.BILL_BY_SELECTOR[pSelectedOption],
        });
    }

    pCurrentLine.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "quantity",
        value: selectedQty || 0,
    });
}

function handleError(pError: Error) {
    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });
}
