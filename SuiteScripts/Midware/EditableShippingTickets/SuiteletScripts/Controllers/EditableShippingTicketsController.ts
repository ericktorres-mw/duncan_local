/**
 * @author Midware
 * @developer Walter Bonilla
 * @contact contact@midware.net
*/

import * as log from "N/log"
import * as render from "N/render"

import * as view from '../Views/EditableShippingTicketsView'
import * as model from '../Models/EditableShippingTicketsModel'

export function getPage(pSalesOrder){

    const data = model.getOrderData(pSalesOrder);

    return view.getPage(data);

}

export function getPDF(pData){

    const pdfTemplate = view.getPDFtemplate(pData);
    const newFile = render.xmlToPdf({ xmlString: pdfTemplate });

    return newFile;

}