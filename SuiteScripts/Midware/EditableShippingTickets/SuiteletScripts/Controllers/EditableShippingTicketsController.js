/**
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
*/
define(["require", "exports", "N/render", "../Views/EditableShippingTicketsView", "../Models/EditableShippingTicketsModel"], function (require, exports, render, view, model) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function getPage(pSalesOrder) {
        var data = model.getOrderData(pSalesOrder);
        return view.getPage(data);
    }
    exports.getPage = getPage;
    function getPDF(pData) {
        var pdfTemplate = view.getPDFtemplate(pData);
        var newFile = render.xmlToPdf({ xmlString: pdfTemplate });
        return newFile;
    }
    exports.getPDF = getPDF;
});
