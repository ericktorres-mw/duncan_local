/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([], function () {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            context.response.write('<html><body><h1>Test Suitelet</h1><p>It works!</p></body></html>');
        }
    }

    return {
        onRequest: onRequest
    };
});
