define(["require", "exports", "../Views/TrackedProjectReportView", "../Models/TrackedProjectReportModel"], function (require, exports, view, model) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function getMainView() {
        return view.getMainView();
    }
    exports.getMainView = getMainView;
    function getResultView(tracked_project_id) {
        //tracked_project_id = "@NONE@";
        if (!tracked_project_id) {
            return view.getResultView(false, false, false);
        }
        var transacData = model.getTransactionData(tracked_project_id);
        var communicationData = model.getCommunicationData(tracked_project_id);
        //log.debug("controller [getResultView] transacData", transacData);
        //log.debug("controller [getResultView] itemsData", communicationData);
        return view.getResultView(tracked_project_id, transacData, communicationData);
    }
    exports.getResultView = getResultView;
});
