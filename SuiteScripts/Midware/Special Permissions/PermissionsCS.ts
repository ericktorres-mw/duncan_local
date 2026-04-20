/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as currentRecord from "N/currentRecord";

import { EntryPoints } from "N/types";
import { getPermissions, handleError, validateVendorPermissions } from "./Global/Functions";

const PERMISSION_ERROR_MESSAGE = "You do not have permission for this vendor category";

export function fieldChanged(pContext: EntryPoints.Client.fieldChangedContext) {
    try {
        const { currentRecord, fieldId } = pContext;

        if (fieldId == "entity") {
            const permissions = getPermissions();

            if (!permissions) {
                alertUser();

                return;
            }

            const vendorId = currentRecord.getValue({ fieldId }) as number;

            validateVendorPermissions(permissions, vendorId, alertUser);
        }
    } catch (error) {
        handleError(error);
    }
}

const alertUser = () => {
    alert(PERMISSION_ERROR_MESSAGE);
    const cr = currentRecord.get();

    cr.setValue({ fieldId: "entity", value: null, ignoreFieldChange: true, fireSlavingSync: true });
};
