/**
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "N/record", "N/render"], function (require, exports, log, record, render) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function printTemplate(pRecID, pTemplate) {
        var result = undefined;
        try {
            // Cargar el registro de Sales Order
            var salesOrder = record.load({
                type: record.Type.SALES_ORDER,
                id: pRecID
            });
            log.debug("SO", salesOrder.id);
            // Renderizar el PDF utilizando la plantilla asignada al formulario
            var renderer = render.create();
            renderer.addRecord("record", salesOrder);
            renderer.setTemplateByScriptId({ scriptId: pTemplate }); // Reemplazar con el ID de la plantilla
            // Generar el archivo PDF
            var pdfFile = renderer.renderAsPdf();
            result = pdfFile;
        }
        catch (error) {
            handleError(error);
        }
        return result;
    }
    exports.printTemplate = printTemplate;
    function handleError(pError) {
        log.error({ title: "Error", details: pError.message });
        log.error({ title: "Stack", details: JSON.stringify(pError) });
    }
});
