/**
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
 */

import * as log from 'N/log'
import * as record from 'N/record'
import * as render from 'N/render'

import * as constants from '../../Constants/Constants'

export function printTemplate(pRecID, pTemplate){

    let result = undefined;

    try {

        // Cargar el registro de Sales Order
        let salesOrder = record.load({
            type: record.Type.SALES_ORDER,
            id: pRecID
        });

        log.debug("SO",salesOrder.id);

        // Renderizar el PDF utilizando la plantilla asignada al formulario
        let renderer = render.create();
        renderer.addRecord("record",salesOrder);
        renderer.setTemplateByScriptId({ scriptId : pTemplate }); // Reemplazar con el ID de la plantilla

        // Generar el archivo PDF
        let pdfFile = renderer.renderAsPdf();

        result = pdfFile
        
    } catch (error) {

        handleError(error);

    }

    return result
}

function handleError(pError : Error) {

    log.error({ title : "Error", details : pError.message });
    log.error({ title : "Stack", details : JSON.stringify(pError) });

}