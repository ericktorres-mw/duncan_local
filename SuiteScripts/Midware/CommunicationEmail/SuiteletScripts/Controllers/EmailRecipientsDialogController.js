define(["require", "exports", "../Views/EmailRecipientsDialogView", "../Models/EmailRecipientsDialogModel"], function (require, exports, view, model) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function getMainView(customerId) {
        var customerList = model.getCustomers(customerId);
        return view.getMainView(customerList);
    }
    exports.getMainView = getMainView;
    function getSelectectedCustomers(pContext) {
        return model.getSelectedCustomers(pContext);
    }
    exports.getSelectectedCustomers = getSelectectedCustomers;
});
