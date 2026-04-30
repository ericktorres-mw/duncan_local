/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([], function() {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            context.response.write('<html><body><h1>Hello World!</h1><p>This is a simple Suitelet.</p><p>Deploy test - 2026-04-30</p></body></html>');
        }
    }

    return {
        onRequest: onRequest
    };
});
