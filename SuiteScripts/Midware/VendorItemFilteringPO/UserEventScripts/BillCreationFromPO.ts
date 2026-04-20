/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import { EntryPoints } from "N/types";

import * as log from "N/log";

export function beforeLoad(pContext: EntryPoints.UserEvent.beforeLoadContext) {
  try {
    if (pContext.type === pContext.UserEventType.CREATE) {
      const newVendorBill = pContext.newRecord;

      // Check if there are item lines with PO references
      const itemLineCount = newVendorBill.getLineCount({
        sublistId: "item",
      });

      log.debug({
        title: "beforeLoad - Bill Creation",
        details: JSON.stringify({ itemLineCount: itemLineCount }),
      });

      if (itemLineCount > 0) {
        log.audit({
          title: "beforeLoad - Bill from PO Detected",
          details: `updating ${itemLineCount} item lines`,
        });

        // Remove all item lines in reverse order to avoid index shifting issues
        for (let i = itemLineCount - 1; i >= 0; i--) {
          log.debug(
            "line orderdoc",
            newVendorBill.getSublistValue({
              sublistId: "item",
              fieldId: "orderdoc",
              line: i,
            })
          );
          if (
            newVendorBill.getSublistValue({
              sublistId: "item",
              fieldId: "orderdoc",
              line: i,
            })
          ) {
            newVendorBill.setSublistValue({
              sublistId: "item",
              fieldId: "amount",
              line: i,
              value: "0",
            });
          }
        }

        log.audit({
          title: "beforeLoad - Items Updated",
          details: `Removed ${itemLineCount} item lines`,
        });
      }
    }
  } catch (error) {
    handleError(error);
  }
}

/* export function beforeSubmit(
  pContext: EntryPoints.UserEvent.beforeSubmitContext
) {
  try {
  } catch (error) {
    handleError(error);
  }
} */

function handleError(pError: Error) {
  log.error({ title: "Error", details: pError.message });

  log.error({ title: "Stack", details: JSON.stringify(pError) });
}
