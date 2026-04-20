/**
 * @author Midware
 * @developer Luis Venegas
 * @contact contact@midware.net
 */
import * as log from "N/log";

//import the views
import * as view from "../Views/TrackedProjectReportView";
//import the models
import * as model from "../Models/TrackedProjectReportModel";

import * as constants from "../Constants/Constants";

export function getMainView() {
    return view.getMainView();
}

export function getResultView(tracked_project_id) {
    //tracked_project_id = "@NONE@";
    if (!tracked_project_id) {
        return view.getResultView(false, false, false);
    }
    const transacData = model.getTransactionData(tracked_project_id);
    const communicationData = model.getCommunicationData(tracked_project_id);

    //log.debug("controller [getResultView] transacData", transacData);
    //log.debug("controller [getResultView] itemsData", communicationData);

    return view.getResultView(tracked_project_id, transacData, communicationData);
}
