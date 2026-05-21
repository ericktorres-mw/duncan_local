/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 * Public Support Page for users external to NetSuite. Deployed with
 * `isonline=T` (Available Without Login) so anyone with the URL can reach
 * it without OAuth/TBA — no login required.
 *
 * GET  -> renders the support page (form + FAQ).
 *         GET ?view=tickets -> renders all submitted tickets.
 * POST -> accepts a support request and re-renders the page with a
 *         confirmation banner.
 *
 * SECURITY: this endpoint is world-readable. NEVER read or expose sensitive
 * records here. Treat all incoming parameters as untrusted; the shared
 * library HTML-escapes everything before rendering.
 */
define(["N/log", "N/record", "N/search", "./lib/support_logic"], function (log, record, search, support) {
  function makeTicketId() {
    var rand = Math.floor(Math.random() * 1e6);
    return "SUP-" + Date.now().toString(36).toUpperCase() + "-" + rand;
  }

  function saveRequest(ticketId, params) {
    try {
      var rec = record.create({ type: "customrecord_sup_request" });
      rec.setValue({ fieldId: "name", value: ticketId });
      rec.setValue({ fieldId: "custrecord_sup_req_name", value: params.name || "" });
      rec.setValue({ fieldId: "custrecord_sup_req_email", value: params.email || "" });
      rec.setValue({ fieldId: "custrecord_sup_req_topic", value: params.category || "" });
      rec.setValue({ fieldId: "custrecord_sup_req_urgency", value: params.urgency || "low" });
      rec.setValue({ fieldId: "custrecord_sup_req_message", value: params.message || "" });
      var recordId = rec.save({ ignoreMandatoryFields: true });
      log.audit({
        title: "Support request created",
        details: { ticketId: ticketId, recordId: recordId }
      });
      return recordId;
    } catch (e) {
      log.error({ title: "Support request save failed", details: { ticketId: ticketId, error: e } });
      return null;
    }
  }

  function loadAllTickets() {
    var tickets = [];
    try {
      var s = search.create({
        type: "customrecord_sup_request",
        columns: [
          search.createColumn({ name: "name" }),
          search.createColumn({ name: "custrecord_sup_req_name" }),
          search.createColumn({ name: "custrecord_sup_req_email" }),
          search.createColumn({ name: "custrecord_sup_req_topic" }),
          search.createColumn({ name: "created", sort: search.Sort.DESC })
        ]
      });

      s.run().each(function (result) {
        tickets.push({
          ticketId: result.getValue("name"),
          name:     result.getValue("custrecord_sup_req_name"),
          email:    result.getValue("custrecord_sup_req_email"),
          topic:    result.getValue("custrecord_sup_req_topic"),
          date:     result.getValue("created")
        });
        return true;
      });
    } catch (e) {
      log.error({ title: "Ticket search failed", details: e });
    }
    return tickets;
  }

  function baseUrl(request) {
    // Strip query string so links can append their own params while keeping
    // the required `script` and `deploy` parameters that NetSuite needs.
    var url = request.url;
    var q = url.indexOf("?");
    var path = q === -1 ? url : url.substring(0, q);
    var script = request.parameters.script || "";
    var deploy = request.parameters.deploy || "";
    return path + "?script=" + script + "&deploy=" + deploy;
  }

  function onRequest(context) {
    var response = context.response;
    response.setHeader({ name: "Content-Type", value: "text/html; charset=utf-8" });

    var params = context.request.parameters || {};
    var base = baseUrl(context.request);

    if (context.request.method === "GET" && params.view === "tickets") {
      response.write(support.renderTicketsPage({ tickets: loadAllTickets(), baseUrl: base }));
      return;
    }

    if (context.request.method === "POST") {
      var ticketId = makeTicketId();

      log.audit({
        title: "Support request received",
        details: {
          ticketId: ticketId,
          name: params.name,
          email: params.email,
          category: params.category,
          urgency: params.urgency
        }
      });

      saveRequest(ticketId, params);

      response.write(
        support.renderPage({
          submitted: true,
          name: params.name,
          email: params.email,
          ticketId: ticketId,
          baseUrl: base
        })
      );
      return;
    }

    // Default: GET — support form
    response.write(support.renderPage({ baseUrl: base }));
  }

  return {
    onRequest: onRequest
  };
});
