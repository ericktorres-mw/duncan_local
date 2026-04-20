/**
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */
define(["require", "exports", "N/file"], function (require, exports, file) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FILES_TYPES_MAPPING = void 0;
    exports.FILES_TYPES_MAPPING = (_a = {},
        _a[file.Type.APPCACHE] = {
            // AppCache Manifest File
            ".appcache": 1,
        },
        _a[file.Type.AUTOCAD] = {
            // AutoCad
            ".dwg": 1,
            ".dwf": 1,
            ".dxf": 1,
            ".dwt": 1,
            ".plt": 1,
        },
        _a[file.Type.BMPIMAGE] = {
            // BMP Image
            ".bmp": 1,
        },
        _a[file.Type.CERTIFICATE] = {
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
        _a[file.Type.CONFIG] = {
            // Configuration File
            ".config": 1,
        },
        _a[file.Type.CSV] = {
            ".csv": 1,
        },
        /*"EOT File": {
            ".eot": 1,
        },*/
        _a[file.Type.EXCEL] = {
            // "Excel File"
            ".xls": 1,
            ".xlsx": 1,
        },
        _a[file.Type.FLASH] = {
            // Flash Animation
            ".swf": 1,
        },
        _a[file.Type.FREEMARKER] = {
            // FreeMarker Template File
            ".ftl": 1,
        },
        _a[file.Type.GIFIMAGE] = {
            // GIF Image
            ".gif": 1,
        },
        _a[file.Type.GZIP] = {
            // GNU Zip File
            ".gz": 1,
        },
        _a[file.Type.HTMLDOC] = {
            // HTML File
            ".html": 1,
            ".htm": 1,
            ".shtml": 1,
        },
        _a[file.Type.ICON] = {
            // Icon Image
            ".ico": 1,
            ".icon": 1,
        },
        _a[file.Type.JAVASCRIPT] = {
            // JavaScript File
            ".js": 1,
            //".json": 1, // ???
        },
        _a[file.Type.JPGIMAGE] = {
            // JPEG Image
            ".jpg": 1,
            ".jpeg": 1,
        },
        _a[file.Type.JSON] = {
            // JSON Response
            ".json": 1, // This was not here
        },
        /*"LZH File": {
            ".lzh": 1,
            ".lha": 1,
        },*/
        _a[file.Type.MESSAGERFC] = {
            // Message RFC
            ".eml": 1,
        },
        _a[file.Type.MP3] = {
            // MP3 Audio
            ".mp3": 1,
        },
        _a[file.Type.MPEGMOVIE] = {
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
        _a[file.Type.PDF] = {
            // PDF File
            ".pdf": 1,
        },
        _a[file.Type.PJPGIMAGE] = {
            // PJPEG Image
            ".pjpeg": 1,
        },
        _a[file.Type.PLAINTEXT] = {
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
        _a[file.Type.PNGIMAGE] = {
            // PNG Image
            ".png": 1,
        },
        _a[file.Type.POSTSCRIPT] = {
            // PostScript File
            ".ps": 1,
            ".eps": 1,
        },
        _a[file.Type.POWERPOINT] = {
            // PowerPoint File
            ".ppt": 1,
            ".pptx": 1,
        },
        _a[file.Type.MSPROJECT] = {
            // Project File
            ".mpp": 1,
        },
        _a[file.Type.QUICKTIME] = {
            // QuickTime Video
            ".mov": 1,
        },
        _a[file.Type.RTF] = {
            // RTF File
            ".rtf": 1,
        },
        _a[file.Type.SMS] = {
            // SMS File
            ".sms": 1,
        },
        _a[file.Type.STYLESHEET] = {
            // CSS File / Stylesheet
            ".css": 1,
        },
        _a[file.Type.SCSS] = {
            // SuiteScript File
            ".ss": 1,
        },
        /*"SuiteScript Page": {
            ".ssp": 1,
        },*/
        _a[file.Type.SVG] = {
            // SVG Image
            ".svg": 1,
        },
        _a[file.Type.TAR] = {
            // Tar File
            ".tar": 1,
        },
        _a[file.Type.TIFFIMAGE] = {
            // TIFF Image
            ".tiff": 1,
            ".tif": 1,
        },
        /*"TTF File": { // TTF File
            ".ttf": 1,
        },*/
        _a[file.Type.VISIO] = {
            // Visio File
            ".vsd": 1,
        },
        /*"WOFF File": {
            ".woff": 1,
        },
        "WOFF2 File": {
            ".woff2": 1,
        },*/
        _a[file.Type.WORD] = {
            // Word File
            ".doc": 1,
            ".dot": 1,
            ".docx": 1,
        },
        _a[file.Type.XMLDOC] = {
            // XML File
            ".xml": 1,
        },
        _a[file.Type.XSD] = {
            // XSD File
            ".xsd": 1,
        },
        _a[file.Type.ZIP] = {
            // Zip File
            ".zip": 1,
        },
        _a);
});
