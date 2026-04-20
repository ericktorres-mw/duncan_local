/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */

import * as log from "N/log";
import * as search from "N/search";
import * as record from "N/record";
import * as error from "N/error";
import * as file from "N/file";
import * as runtime from "N/runtime";

import * as constants from "../Constants/Constants";
import { email, record } from "N";

export function getCustomers(customerId) {
  const data: { name: string; email: string; role: string }[] = [];

  const contactsSearch = search.create({
    type: search.Type.CONTACT,
    filters: [
      ["company", search.Operator.ANYOF, customerId],
      "AND",
      ["email", search.Operator.ISNOTEMPTY, ""],
    ],
    columns: [
      search.createColumn({ name: "entityid", label: "Name" }),
      search.createColumn({ name: "email", label: "Email" }),
      search.createColumn({ name: "contactrole", label: "Role" }),
    ],
  });

  const customerRecord = record.load({
    type: record.Type.CUSTOMER,
    id: customerId,
  });

  const sendToAp = customerRecord.getValue({
    fieldId: "custentity_mw_send_invoice_to_ap",
  });

  contactsSearch.run().each((result) => {
    data.push({
      name: result.getValue({ name: "entityid" }) as string,
      email: result.getValue({ name: "email" }) as string,
      role: sendToAp
        ? (result.getValue({ name: "contactrole" }) as string)
        : "",
    });
    return true;
  });
  log.debug("data", data);
  return data;
}

export function getSelectedCustomers(pContext) {
  log.debug("start sent data", "start");
  const emails = [];
  const lineCount = pContext.request.getLineCount("custpage_contact_sublist");

  const dontSendEmail = pContext.request.parameters.custpage_do_not_send_email;

  log.debug("dontSendEmail", dontSendEmail);

  for (let i = 0; i < lineCount; i++) {
    const isSelected = pContext.request.getSublistValue({
      group: "custpage_contact_sublist",
      name: "custpage_select",
      line: i,
    });
    log.debug("isSelected", isSelected);
    if (isSelected === "T") {
      emails.push(
        pContext.request.getSublistValue({
          group: "custpage_contact_sublist",
          name: "custpage_contact_email",
          line: i,
        })
      );
    }
  }

  // Send data back to parent window and close
  log.debug("emails sent", emails);
  return `
        <script>
            if (window.opener) {
                window.opener.postMessage({
                    type: "customEmailSelection",
                    emails: ${JSON.stringify(emails)},
                    dontSendEmail: ${JSON.stringify(dontSendEmail)}
                }, "*");
            }
            window.close();
        </script>
            `;
}
