/**
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/file", "N/search", "N/record", "./Constants"], function (require, exports, file, search, record, Constants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDirectory = exports.deleteFile = exports.postFile = exports.getFile = void 0;
    var getFile = function (fullFilePath) {
        var fileToReturn = file.load({
            id: fullFilePath,
        });
        return [
            {
                name: fileToReturn.name,
                fullPath: fullFilePath,
                content: fileToReturn.getContents(),
            },
        ];
    };
    exports.getFile = getFile;
    var postFile = function (fullFilePath, content) {
        try {
            var loadedFile = file.load({
                id: fullFilePath,
            });
            updateFile(loadedFile, content);
        }
        catch (e) {
            if (e.name == "RCRD_DSNT_EXIST") {
                createFile(fullFilePath, content);
            }
            else {
                throw e;
            }
        }
    };
    exports.postFile = postFile;
    var deleteFile = function (relFilePath) {
        var fullFilePath = relFilePath;
        var fileObject = file.load({ id: fullFilePath });
        file.delete({ id: fileObject.id });
    };
    exports.deleteFile = deleteFile;
    var getDirectory = function (relDirectoryPath) {
        var folderId = getFolderId(relDirectoryPath);
        var folders = getInnerFolders(relDirectoryPath, folderId);
        var allFiles = [];
        folders.forEach(function (folder) {
            allFiles = allFiles.concat(getFilesInFolder(folder.path, folder.id));
        });
        return allFiles;
    };
    exports.getDirectory = getDirectory;
    var getFolderId = function (folderPath) {
        var foldersArray = folderPath.split("/");
        var folderName = foldersArray[foldersArray.length - 1];
        var filters = [];
        filters.push({ name: "name", operator: search.Operator.IS, values: [folderName] });
        if (foldersArray.length == 1)
            filters.push({ name: "istoplevel", operator: search.Operator.IS, values: true });
        if (foldersArray.length > 1) {
            var parentFolderArray = foldersArray.slice(0, -1);
            var parentId = getFolderId(parentFolderArray.join("/"));
            filters.push({ name: "parent", operator: search.Operator.ANYOF, values: [parentId] });
        }
        var folderSearch = search.create({
            type: search.Type.FOLDER,
            filters: filters,
        });
        var folderId = null;
        folderSearch.run().each(function (result) {
            folderId = result.id;
            return false;
        });
        return folderId;
    };
    var getInnerFolders = function (folderPath, folderId) {
        var folderSearch = search.create({
            type: search.Type.FOLDER,
            columns: ["name"],
            filters: [
                {
                    name: "parent",
                    operator: search.Operator.IS,
                    values: [folderId],
                },
            ],
        });
        var innerFolders = [
            {
                id: folderId,
                path: folderPath,
            },
        ];
        folderSearch.run().each(function (result) {
            innerFolders = innerFolders.concat(getInnerFolders(folderPath + "/" + result.getValue("name"), result.id));
            return true;
        });
        return innerFolders;
    };
    var getFilesInFolder = function (folderPath, folderId) {
        var fileSearch = search.create({
            type: search.Type.FOLDER,
            columns: ["file.internalid", "file.name"],
            filters: [
                {
                    name: "internalid",
                    operator: search.Operator.IS,
                    values: [folderId],
                },
            ],
        });
        var files = [];
        fileSearch.run().each(function (result) {
            var fileId = result.getValue({ name: "internalid", join: "file" });
            if (fileId) {
                var fileName = result.getValue({ name: "name", join: "file" });
                var fileContent = file.load({ id: fileId.toString() }).getContents();
                files.push({
                    type: "file",
                    name: fileName,
                    fullPath: folderPath + "/" + fileName,
                    content: fileContent,
                });
            }
            return true;
        });
        // In case of empty folder return the folder name
        if (files.length == 0) {
            files.push({
                type: "folder",
                fullPath: folderPath,
            });
        }
        return files;
    };
    var updateFile = function (existingFile, content) {
        file.create({
            name: existingFile.name,
            fileType: existingFile.fileType,
            contents: content,
            description: existingFile.description,
            encoding: existingFile.encoding,
            folder: existingFile.folder,
            isOnline: existingFile.isOnline,
        }).save();
    };
    var createFile = function (filePath, contents) {
        var pathArray = filePath.split("/");
        var name = pathArray[pathArray.length - 1];
        var fileType = getFileType(name);
        var folder = createFolderIfNotExist(filePath.substring(0, filePath.lastIndexOf("/")), null);
        file.create({
            name: name,
            fileType: fileType,
            contents: contents,
            folder: folder,
        }).save();
    };
    var createFolderIfNotExist = function (folderPath, parentId) {
        var folderArray = folderPath.split("/");
        var firstFolder = folderArray[0];
        var nextFolders = folderArray.slice(1);
        var filters = [];
        filters.push({ name: "name", operator: search.Operator.IS, values: [firstFolder] });
        if (parentId) {
            filters.push({ name: "parent", operator: search.Operator.ANYOF, values: [parentId] });
        }
        else {
            filters.push({ name: "istoplevel", operator: search.Operator.IS, values: true });
        }
        var folderSearch = search.create({
            type: search.Type.FOLDER,
            filters: filters,
        });
        var folderId = null;
        folderSearch.run().each(function (result) {
            folderId = Number(result.id);
            return false;
        });
        if (!folderId) {
            var folderRecord = record.create({ type: record.Type.FOLDER });
            folderRecord.setValue({ fieldId: "name", value: firstFolder });
            folderRecord.setValue({ fieldId: "parent", value: parentId });
            folderId = folderRecord.save();
        }
        if (!nextFolders || nextFolders.length == 0)
            return folderId;
        return createFolderIfNotExist(nextFolders.join("/"), folderId);
    };
    var getFileType = function (fileName) {
        var fileExtension = getFileExtension(fileName);
        return getNsFileType(fileExtension);
        //return file.Type.JAVASCRIPT;
    };
    var getFileExtension = function (fileName) {
        var fileNameArr = fileName.split(".");
        if (fileNameArr.length === 1 || (fileNameArr[0] === "" && fileNameArr.length === 2)) {
            return "";
        }
        return ".".concat(fileNameArr.pop());
    };
    var getNsFileType = function (fileExtension) {
        if (!fileExtension) {
            return file.Type.PLAINTEXT;
        }
        var nsFileType = null;
        Object.keys(Constants_1.FILES_TYPES_MAPPING).some(function (type) {
            if (Constants_1.FILES_TYPES_MAPPING[type][fileExtension]) {
                nsFileType = type;
                return true;
            }
        });
        return nsFileType;
    };
});
