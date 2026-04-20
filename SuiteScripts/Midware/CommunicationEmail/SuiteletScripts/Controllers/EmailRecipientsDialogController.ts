/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
import * as log from "N/log";

//import the views
import * as view from "../Views/EmailRecipientsDialogView";
//import the models
import * as model from "../Models/EmailRecipientsDialogModel";

import * as constants from "../Constants/Constants";
import { EntryPoints } from "N/types";

export function getMainView(customerId) {
  const customerList = model.getCustomers(customerId);
  return view.getMainView(customerList);
}

export function getSelectectedCustomers(
  pContext: EntryPoints.Suitelet.onRequestContext
) {
  return model.getSelectedCustomers(pContext);
}
