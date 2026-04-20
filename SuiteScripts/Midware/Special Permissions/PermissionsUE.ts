/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as log from "N/log";
import * as record from "N/record";

import { EntryPoints } from "N/types";
import { getPermissions, isValidRecord, Permissions, validateVendorPermissions } from "./Global/Functions";

const PERMISSION_ERROR_MESSAGE = "User does not have permissions to perform this action due to vendor category restrictions. Please contact your administrator.";

export const beforeLoad = (pContext: EntryPoints.UserEvent.beforeLoadContext) => {
    const { newRecord, type, UserEventType } = pContext;

    const { type: recordType } = newRecord;

    const isViewMode = type === UserEventType.VIEW;
    const isEditMode = type === UserEventType.EDIT;
    const isCreateMode = type === UserEventType.CREATE;

    log.debug("[beforeLoad] recordType - mode", `${recordType} - ${type}`);

    if (!isValidRecord(recordType)) {
        return;
    }

    const permissions = getPermissions();

    log.debug("[beforeLoad] permissions", permissions);

    if (!isValidRecord(recordType) || (permissions && !permissions.is_vendor_enabled)) {
        return;
    }

    if (!permissions) {
        throw PERMISSION_ERROR_MESSAGE;
    }

    vendorValidations(newRecord, recordType, isViewMode, isEditMode, isCreateMode, permissions);

    return;
};

export const beforeSubmit = (pContext: EntryPoints.UserEvent.beforeSubmitContext) => {
    const { newRecord, type, UserEventType } = pContext;

    const { type: recordType } = newRecord;

    const isEditMode = type === UserEventType.EDIT;
    const isCreateMode = type === UserEventType.CREATE;

    log.debug("[beforeSubmit] recordType - isCreateMode - isEditMode", `${recordType} - ${isCreateMode} - ${isEditMode}`);

    const permissions = getPermissions();

    log.debug("[beforeSubmit] permissions", permissions);

    if (!isValidRecord(recordType) || (permissions && !permissions.is_vendor_enabled)) {
        return;
    }

    if (!permissions) {
        throwError();
        return;
    }

    if (
        (recordType === record.Type.VENDOR_BILL ||
            recordType === record.Type.VENDOR_PAYMENT ||
            recordType === record.Type.PURCHASE_ORDER) &&
        (isEditMode || isCreateMode)
    ) {
        const vendorId = newRecord.getValue({ fieldId: "entity" }) as number;

        validateVendorPermissions(permissions, vendorId || null, throwError);
    }

    return;
};

const vendorValidations = (
    pRecord: record.Record,
    recordType: string,
    isViewMode: boolean,
    isEditMode: boolean,
    isCreateMode: boolean,
    permissions: Permissions
) => {
    if (recordType === record.Type.VENDOR && (isViewMode || isEditMode)) {
        validateVendorPermissions(permissions, pRecord.id || null, throwError);
    } else if (
        (recordType === record.Type.VENDOR_BILL ||
            recordType === record.Type.VENDOR_PAYMENT ||
            recordType === record.Type.PURCHASE_ORDER) &&
        (isViewMode || isEditMode || isCreateMode)
    ) {
        const vendorId = pRecord.getValue({ fieldId: "entity" }) as number;

        validateVendorPermissions(permissions, vendorId || null, throwError);
    }
};

const throwError = () => {
    throw PERMISSION_ERROR_MESSAGE;
};
