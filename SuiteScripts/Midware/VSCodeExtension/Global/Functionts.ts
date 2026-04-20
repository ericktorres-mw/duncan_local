/**
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as file from "N/file";
import * as search from "N/search";
import * as record from "N/record";

import { FILES_TYPES_MAPPING } from "./Constants";

export const getFile = (fullFilePath: string) => {
    const fileToReturn = file.load({
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

export const postFile = (fullFilePath: string, content) => {
    try {
        const loadedFile = file.load({
            id: fullFilePath,
        });

        updateFile(loadedFile, content);
    } catch (e) {
        if (e.name == "RCRD_DSNT_EXIST") {
            createFile(fullFilePath, content);
        } else {
            throw e;
        }
    }
};

export const deleteFile = (relFilePath: string) => {
    const fullFilePath = relFilePath;

    const fileObject = file.load({ id: fullFilePath });

    file.delete({ id: fileObject.id });
};

export const getDirectory = (relDirectoryPath: string) => {
    const folderId = getFolderId(relDirectoryPath);
    const folders = getInnerFolders(relDirectoryPath, folderId);

    let allFiles = [];

    folders.forEach((folder) => {
        allFiles = allFiles.concat(getFilesInFolder(folder.path, folder.id));
    });

    return allFiles;
};

const getFolderId = (folderPath: string) => {
    const foldersArray = folderPath.split("/");
    const folderName = foldersArray[foldersArray.length - 1];

    const filters = [];

    filters.push({ name: "name", operator: search.Operator.IS, values: [folderName] });

    if (foldersArray.length == 1) filters.push({ name: "istoplevel", operator: search.Operator.IS, values: true });

    if (foldersArray.length > 1) {
        const parentFolderArray = foldersArray.slice(0, -1);
        const parentId = getFolderId(parentFolderArray.join("/"));
        filters.push({ name: "parent", operator: search.Operator.ANYOF, values: [parentId] });
    }

    const folderSearch = search.create({
        type: search.Type.FOLDER,
        filters: filters,
    });

    let folderId: string = null;

    folderSearch.run().each((result) => {
        folderId = result.id;
        return false;
    });

    return folderId;
};

const getInnerFolders = (folderPath: string, folderId: string) => {
    const folderSearch = search.create({
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

    let innerFolders = [
        {
            id: folderId,
            path: folderPath,
        },
    ];

    folderSearch.run().each((result) => {
        innerFolders = innerFolders.concat(getInnerFolders(folderPath + "/" + result.getValue("name"), result.id));
        return true;
    });

    return innerFolders;
};

const getFilesInFolder = (folderPath, folderId: string) => {
    const fileSearch = search.create({
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

    const files = [];
    fileSearch.run().each(function (result) {
        const fileId = result.getValue({ name: "internalid", join: "file" });

        if (fileId) {
            const fileName = result.getValue({ name: "name", join: "file" });
            const fileContent = file.load({ id: fileId.toString() }).getContents();

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

const updateFile = (existingFile, content) => {
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

const createFile = (filePath: string, contents) => {
    const pathArray = filePath.split("/");
    const name = pathArray[pathArray.length - 1];

    const fileType = getFileType(name);

    const folder = createFolderIfNotExist(filePath.substring(0, filePath.lastIndexOf("/")), null);

    file.create({
        name,
        fileType,
        contents,
        folder,
    }).save();
};

const createFolderIfNotExist = (folderPath: string, parentId: number) => {
    const folderArray = folderPath.split("/");
    const firstFolder = folderArray[0];
    const nextFolders = folderArray.slice(1);

    const filters = [];

    filters.push({ name: "name", operator: search.Operator.IS, values: [firstFolder] });

    if (parentId) {
        filters.push({ name: "parent", operator: search.Operator.ANYOF, values: [parentId] });
    } else {
        filters.push({ name: "istoplevel", operator: search.Operator.IS, values: true });
    }

    const folderSearch = search.create({
        type: search.Type.FOLDER,
        filters: filters,
    });

    let folderId: number = null;

    folderSearch.run().each((result) => {
        folderId = Number(result.id);
        return false;
    });

    if (!folderId) {
        const folderRecord = record.create({ type: record.Type.FOLDER });
        folderRecord.setValue({ fieldId: "name", value: firstFolder });
        folderRecord.setValue({ fieldId: "parent", value: parentId });
        folderId = folderRecord.save();
    }

    if (!nextFolders || nextFolders.length == 0) return folderId;

    return createFolderIfNotExist(nextFolders.join("/"), folderId);
};

const getFileType = (fileName: string) => {
    const fileExtension = getFileExtension(fileName);

    return getNsFileType(fileExtension);
    //return file.Type.JAVASCRIPT;
};

const getFileExtension = (fileName: string) => {
    const fileNameArr = fileName.split(".");

    if (fileNameArr.length === 1 || (fileNameArr[0] === "" && fileNameArr.length === 2)) {
        return "";
    }

    return `.${fileNameArr.pop()}`;
};

const getNsFileType = (fileExtension: string): file.Type => {
    if (!fileExtension) {
        return file.Type.PLAINTEXT;
    }

    let nsFileType = null;

    Object.keys(FILES_TYPES_MAPPING).some((type) => {
        if (FILES_TYPES_MAPPING[type][fileExtension]) {
            nsFileType = type;

            return true;
        }
    });

    return nsFileType;
};
