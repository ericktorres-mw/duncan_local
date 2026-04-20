/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * Author		: Rodmar / Plative
 * Version		: 1.0.0 - initial development
 * 						- 09202022 - automatically create project for sales order, based on a specific project template
 * Description	:
 * Dependencies	:
 *
 *
 */
define(["N/record", "N/runtime"], function (record, runtime) {
    //	var projectTemplateId = 6814;
    var projectTemplateId = "";

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {}

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {}

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
        try {
            if (scriptContext.type == "create" /* || scriptContext.type == "edit"*/) {
                projectTemplateId = runtime.getCurrentScript().getParameter({
                    name: "custscript_pla_projecttemplate",
                });

                var entityId = scriptContext.newRecord.getValue({
                    fieldId: "entity",
                });
                var tranid = scriptContext.newRecord.getValue({
                    fieldId: "tranid",
                });

                var dft = scriptContext.newRecord.getValue({
                    fieldId: "custbody_mw_dft",
                });
                var ext_pp_inspection = scriptContext.newRecord.getValue({
                    fieldId: "custbody_mw_ext_pp_inspection",
                });
                var ext_ip_inspection = scriptContext.newRecord.getValue({
                    fieldId: "custbody_mw_ext_ip_inspection",
                });

                if (Boolean(dft) || Boolean(ext_pp_inspection) || Boolean(ext_ip_inspection)) {
                    projectTemplateId = runtime.getCurrentScript().getParameter({
                        name: "custscript_mw_projecttemplate_qa",
                    });
                }

                var projRecObj = record.create({
                    type: "job",
                    defaultValues: {
                        parent: entityId,
                    },
                });

                projRecObj.setValue({
                    fieldId: "projecttemplate",
                    value: projectTemplateId,
                });
                projRecObj.setValue({
                    fieldId: "companyname",
                    value: tranid,
                });

                var projRecId = "";
                try {
                    projRecId = projRecObj.save({
                        ignoreMandatoryFields: true,
                        allowSourcing: true,
                    });
                } catch (e) {
                    log.error("ACCEPTABLE ERROR TRYING to create Process", e);
                    var lastError = e.name;
                    var counter = 0;
                    while (lastError == "DUP_RCRD") {
                        counter += 1;

                        log.debug("attempt using : ", tranid + "_" + counter);
                        try {
                            projRecObj.setValue({
                                fieldId: "companyname",
                                value: tranid + "_" + counter,
                            });

                            projRecId = projRecObj.save({
                                ignoreMandatoryFields: true,
                                allowSourcing: true,
                            });

                            lastError = "";
                        } catch (e) {
                            log.error("ACCEPTABLE ERROR TRYING to create Process, begin finding next available companyname", e);
                            lastError = e.name;
                        }
                    }
                }

                if (projRecId) {
                    record.submitFields({
                        type: scriptContext.newRecord.type,
                        id: scriptContext.newRecord.id,
                        values: {
                            job: projRecId,
                        },
                    });

                    log.debug("success setting projRecId on the TRANSACTION", {
                        projRecId: projRecId,
                        tranInternalId: scriptContext.newRecord.id,
                    });
                }
            }
        } catch (e) {
            log.error("ERROR in function afterSubmit", e);
        }
    }

    return {
        //        beforeLoad: beforeLoad,
        //        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit,
    };
});
