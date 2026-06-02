/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 * Public Support Page for users external to NetSuite. Deployed with
 * `isonline=T` (Available Without Login) so anyone with the URL can reach
 * it without OAuth/TBA - no login required.
 *
 * GET              -> renders the support page (form).
 * GET ?view=tickets -> renders all submitted tickets.
 * POST             -> accepts a support request and re-renders with confirmation.
 *
 * SECURITY: this endpoint is world-readable. NEVER read or expose sensitive
 * records here. Treat all incoming parameters as untrusted; the shared
 * library HTML-escapes everything before rendering.
 */
define(["require", "exports", "N/log", "N/record", "N/search", "./lib/support_logic"], function (require, exports, log, record, search, support) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = onRequest;
    function makeTicketId() {
        const rand = Math.floor(Math.random() * 1e6);
        return `SUP-${Date.now().toString(36).toUpperCase()}-${rand}`;
    }
    function saveRequest(ticketId, params) {
        var _a, _b, _c, _d, _e;
        try {
            const rec = record.create({ type: "customrecord_sup_request" });
            rec.setValue({ fieldId: "name", value: ticketId });
            rec.setValue({ fieldId: "custrecord_sup_req_name", value: (_a = params.name) !== null && _a !== void 0 ? _a : "" });
            rec.setValue({ fieldId: "custrecord_sup_req_email", value: (_b = params.email) !== null && _b !== void 0 ? _b : "" });
            rec.setValue({ fieldId: "custrecord_sup_req_topic", value: (_c = params.category) !== null && _c !== void 0 ? _c : "" });
            rec.setValue({ fieldId: "custrecord_sup_req_urgency", value: (_d = params.urgency) !== null && _d !== void 0 ? _d : "low" });
            rec.setValue({ fieldId: "custrecord_sup_req_message", value: (_e = params.message) !== null && _e !== void 0 ? _e : "" });
            return rec.save({ ignoreMandatoryFields: true });
        }
        catch (e) {
            log.error({ title: "Support request save failed", details: { ticketId, error: e } });
            return null;
        }
    }
    function loadTickets(limit) {
        const tickets = [];
        try {
            const s = search.create({
                type: "customrecord_sup_request",
                columns: [
                    search.createColumn({ name: "name" }),
                    search.createColumn({ name: "custrecord_sup_req_name" }),
                    search.createColumn({ name: "custrecord_sup_req_email" }),
                    search.createColumn({ name: "custrecord_sup_req_topic" }),
                    search.createColumn({ name: "created", sort: search.Sort.DESC })
                ]
            });
            s.run().each((result) => {
                tickets.push({
                    ticketId: result.getValue("name"),
                    name: result.getValue("custrecord_sup_req_name"),
                    email: result.getValue("custrecord_sup_req_email"),
                    topic: result.getValue("custrecord_sup_req_topic"),
                    date: result.getValue("created")
                });
                // Stop early once we have enough; `each` keeps iterating while we return true.
                return limit === undefined || tickets.length < limit;
            });
        }
        catch (e) {
            log.error({ title: "Ticket search failed", details: e });
        }
        return tickets;
    }
    // Number of most-recent tickets previewed on the landing page.
    const RECENT_TICKETS_LIMIT = 3;
    function buildBaseUrl(request) {
        var _a, _b;
        // Strip query string; re-attach only the `script` and `deploy` params
        // that NetSuite requires on all Suitelet URLs.
        const url = request.url;
        const qIndex = url.indexOf("?");
        const path = qIndex === -1 ? url : url.substring(0, qIndex);
        const script = (_a = request.parameters.script) !== null && _a !== void 0 ? _a : "";
        const deploy = (_b = request.parameters.deploy) !== null && _b !== void 0 ? _b : "";
        return `${path}?script=${script}&deploy=${deploy}`;
    }
    function onRequest(context) {
        var _a;
        const { request, response } = context;
        response.setHeader({ name: "Content-Type", value: "text/html; charset=utf-8" });
        const params = ((_a = request.parameters) !== null && _a !== void 0 ? _a : {});
        const base = buildBaseUrl(request);
        if (request.method === "GET" && params.view === "tickets") {
            response.write(support.renderTicketsPage({ tickets: loadTickets(), baseUrl: base }));
            return;
        }
        if (request.method === "POST") {
            const ticketId = makeTicketId();
            log.audit({
                title: "Support request received",
                details: { ticketId, name: params.name, email: params.email, category: params.category, urgency: params.urgency }
            });
            const recordId = saveRequest(ticketId, params);
            log.audit({ title: "Support request created", details: { ticketId, recordId } });
            response.write(support.renderPage({
                submitted: true,
                name: params.name,
                email: params.email,
                ticketId,
                baseUrl: base,
                recentTickets: loadTickets(RECENT_TICKETS_LIMIT)
            }));
            return;
        }
        // Default: GET - support form
        response.write(support.renderPage({ baseUrl: base, recentTickets: loadTickets(RECENT_TICKETS_LIMIT) }));
    }
});
// SDF isolation Batch 1 verification - 2026-05-28T20:35:52Z
