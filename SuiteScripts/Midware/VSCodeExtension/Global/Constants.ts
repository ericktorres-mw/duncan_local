/**
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as file from "N/file";

export const FILES_TYPES_MAPPING = {
    [file.Type.APPCACHE]: {
        // AppCache Manifest File
        ".appcache": 1,
    },
    [file.Type.AUTOCAD]: {
        // AutoCad
        ".dwg": 1,
        ".dwf": 1,
        ".dxf": 1,
        ".dwt": 1,
        ".plt": 1,
    },
    [file.Type.BMPIMAGE]: {
        // BMP Image
        ".bmp": 1,
    },
    [file.Type.CERTIFICATE]: {
        // Certificate File
        ".cer": 1,
        ".crl": 1,
        ".crt": 1,
        ".csr": 1,
        ".der": 1,
        ".key": 1,
        ".p10": 1,
        ".p12": 1,
        ".p7b": 1,
        ".p7c": 1,
        ".p7r": 1,
        ".p8": 1,
        ".pem": 1,
        ".pfx": 1,
        ".spc": 1,
    },
    /*[file.Type.cf]: {
        // CFF File
        ".cff": 1,
    },
    "Compressed Tar File": {
        ".tgz": 1,
        ".tbz": 1,
    },*/
    [file.Type.CONFIG]: {
        // Configuration File
        ".config": 1,
    },
    [file.Type.CSV]: {
        ".csv": 1,
    },
    /*"EOT File": {
        ".eot": 1,
    },*/
    [file.Type.EXCEL]: {
        // "Excel File"
        ".xls": 1,
        ".xlsx": 1,
    },
    [file.Type.FLASH]: {
        // Flash Animation
        ".swf": 1,
    },
    [file.Type.FREEMARKER]: {
        // FreeMarker Template File
        ".ftl": 1,
    },
    [file.Type.GIFIMAGE]: {
        // GIF Image
        ".gif": 1,
    },
    [file.Type.GZIP]: {
        // GNU Zip File
        ".gz": 1,
    },
    [file.Type.HTMLDOC]: {
        // HTML File
        ".html": 1,
        ".htm": 1,
        ".shtml": 1,
    },
    [file.Type.ICON]: {
        // Icon Image
        ".ico": 1,
        ".icon": 1,
    },
    [file.Type.JAVASCRIPT]: {
        // JavaScript File
        ".js": 1,
        //".json": 1, // ???
    },
    [file.Type.JPGIMAGE]: {
        // JPEG Image
        ".jpg": 1,
        ".jpeg": 1,
    },
    [file.Type.JSON]: {
        // JSON Response
        ".json": 1, // This was not here
    },
    /*"LZH File": {
        ".lzh": 1,
        ".lha": 1,
    },*/
    [file.Type.MESSAGERFC]: {
        // Message RFC
        ".eml": 1,
    },
    [file.Type.MP3]: {
        // MP3 Audio
        ".mp3": 1,
    },
    [file.Type.MPEGMOVIE]: {
        // MPEG Video
        ".mpg": 1,
        ".mpeg": 1,
    },
    /*"OTF File": {
        ".otf": 1,
    },
    "Other Binary File": {
        ".bin": 1,
    },*/
    [file.Type.PDF]: {
        // PDF File
        ".pdf": 1,
    },
    [file.Type.PJPGIMAGE]: {
        // PJPEG Image
        ".pjpeg": 1,
    },
    [file.Type.PLAINTEXT]: {
        // Text File
        ".txt": 1,
        ".css": 1,
        ".htm": 1,
        ".html": 1,
        ".xml": 1,
        ".htc": 1,
        ".sql": 1,
        ".csv": 1,
        ".log": 1,
        ".prn": 1, //From "Plain Text File"
        ".ts": 1,
    },
    [file.Type.PNGIMAGE]: {
        // PNG Image
        ".png": 1,
    },
    [file.Type.POSTSCRIPT]: {
        // PostScript File
        ".ps": 1,
        ".eps": 1,
    },
    [file.Type.POWERPOINT]: {
        // PowerPoint File
        ".ppt": 1,
        ".pptx": 1,
    },
    [file.Type.MSPROJECT]: {
        // Project File
        ".mpp": 1,
    },
    [file.Type.QUICKTIME]: {
        // QuickTime Video
        ".mov": 1,
    },
    [file.Type.RTF]: {
        // RTF File
        ".rtf": 1,
    },
    [file.Type.SMS]: {
        // SMS File
        ".sms": 1,
    },
    [file.Type.STYLESHEET]: {
        // CSS File / Stylesheet
        ".css": 1,
    },
    [file.Type.SCSS]: {
        // SuiteScript File
        ".ss": 1,
    },
    /*"SuiteScript Page": {
        ".ssp": 1,
    },*/
    [file.Type.SVG]: {
        // SVG Image
        ".svg": 1,
    },
    [file.Type.TAR]: {
        // Tar File
        ".tar": 1,
    },
    [file.Type.TIFFIMAGE]: {
        // TIFF Image
        ".tiff": 1,
        ".tif": 1,
    },
    /*"TTF File": { // TTF File
        ".ttf": 1,
    },*/
    [file.Type.VISIO]: {
        // Visio File
        ".vsd": 1,
    },
    /*"WOFF File": {
        ".woff": 1,
    },
    "WOFF2 File": {
        ".woff2": 1,
    },*/
    [file.Type.WORD]: {
        // Word File
        ".doc": 1,
        ".dot": 1,
        ".docx": 1,
    },
    [file.Type.XMLDOC]: {
        // XML File
        ".xml": 1,
    },
    [file.Type.XSD]: {
        // XSD File
        ".xsd": 1,
    },
    [file.Type.ZIP]: {
        // Zip File
        ".zip": 1,
    },
};
