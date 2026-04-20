/**
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as log from "N/log";
import * as search from "N/search";
import * as record from "N/record";
import * as runtime from "N/runtime";

export interface Permissions {
    user: runtime.User;
    role: string;
    is_vendor_enabled: boolean;
    vendor_categories: string[];
    override_vendor_cats: boolean;
}

export const getPermissions = (): Permissions | null => {
    try {
        const user = runtime.getCurrentUser();

        const permissionsSearch = search.create({
            type: "customrecord_mw_spec_rec_perms",
            filters: [["custrecord_mw_spec_perm_role", search.Operator.ANYOF, user.role]],
            columns: [
                "custrecord_mw_spec_perm_role",
                "custrecord_mw_spec_perm_cats",
                "custrecord_mw_spec_perm_vend_ena",
                "custrecord_mw_spec_perm_vend_over",
            ],
        });

        const results = permissionsSearch.run().getRange({ start: 0, end: 1 });

        if (results && results.length) {
            const result = results[0];

            return {
                user,
                role: result.getValue("custrecord_mw_spec_perm_role") as string,
                is_vendor_enabled: result.getValue("custrecord_mw_spec_perm_vend_ena") as boolean,
                override_vendor_cats: result.getValue("custrecord_mw_spec_perm_vend_over") as boolean,
                vendor_categories: ((result.getValue("custrecord_mw_spec_perm_cats") as string) || "")
                    ?.split(",")
                    .map((cat) => cat.trim()) as string[],
            };
        }
    } catch (error) {
        handleError(error);
    }

    return null;
};

export const isValidRecord = (recordType: string): boolean => {
    const validRecordTypes = {
        [record.Type.VENDOR]: true,
        [record.Type.VENDOR_BILL]: true,
        [record.Type.VENDOR_PAYMENT]: true,
        [record.Type.PURCHASE_ORDER]: true,
    };

    return recordType in validRecordTypes;
};

// Vendor

export const getVendorInformation = (vendorId: number): { category: string | null } | null => {
    try {
        const vendorLookup = search.lookupFields({
            type: search.Type.VENDOR,
            id: vendorId,
            columns: ["category"],
        });

        if (vendorLookup) {
            const categoryValue = (vendorLookup.category as search.LookupValueObject[])?.[0]?.value || null;

            return {
                category: categoryValue,
            };
        }
    } catch (error) {
        handleError(error);
    }

    return null;
};

export const validateVendorPermissions = (permissions: Permissions, vendorId: number | null, vendorFunction: () => void) => {
    if (!vendorId) {
        return;
    }

    const vendorInformation = getVendorInformation(vendorId);

    if (vendorInformation) {
        const { category } = vendorInformation;

        if (!permissions.override_vendor_cats && category && permissions.vendor_categories.indexOf(category) < 0) {
            vendorFunction();
        } else if (!category) {
            return;
        }
    } else {
        vendorFunction();
    }
};

export const handleError = (pError: Error) => {
    log.error({ title: "Error", details: pError.message });
    log.error({ title: "Stack", details: JSON.stringify(pError) });
};
