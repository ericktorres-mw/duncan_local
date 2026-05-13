/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([], function() {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            context.response.write('<html><body><h1>Hello World!</h1><p>This is a simple Suitelet.</p></body></html>');
        }
    }

    return {
        onRequest: onRequest
    };
});
