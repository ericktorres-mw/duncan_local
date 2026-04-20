define(["require", "exports", "../Models/PrintTemplateSTModel"], function (require, exports, model) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function printTemplate(pRecID, pTemplate) {
        return model.printTemplate(pRecID, pTemplate);
    }
    exports.printTemplate = printTemplate;
});
