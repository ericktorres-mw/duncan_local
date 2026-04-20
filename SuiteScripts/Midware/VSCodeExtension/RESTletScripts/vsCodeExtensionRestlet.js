/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/log", "../Global/Functionts"], function (require, exports, log, Functionts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.delete = exports.post = exports.get = void 0;
    var get = function (requestParams) {
        var type = requestParams.type, name = requestParams.name;
        var relPath = name.split("\\").join("/");
        // TODO: fix request.name == EMPTY STRING
        log.debug("[get] requestParams", requestParams);
        var typeMapping = {
            file: Functionts_1.getFile,
            directory: Functionts_1.getDirectory,
        };
        if (typeMapping[type]) {
            return typeMapping[type](relPath);
        }
    };
    exports.get = get;
    var post = function (requestBody) {
        var name = requestBody["name"];
        log.debug("[post] requestBody", requestBody);
        var relPath = name.split("\\").join("/");
        (0, Functionts_1.postFile)(relPath, requestBody["content"]);
        return "";
    };
    exports.post = post;
    var deleteFunc = function (requestParams) {
        var name = requestParams.name;
        log.debug("[delete] requestParams", requestParams);
        var relPath = name.split("\\").join("/");
        (0, Functionts_1.deleteFile)(relPath);
        return "";
    };
    exports.delete = deleteFunc;
});
