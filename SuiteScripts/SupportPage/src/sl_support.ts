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

import * as log    from "N/log";
import * as record from "N/record";
import * as search from "N/search";
import { EntryPoints } from "N/types";
import * as support from "./lib/support_logic";

function makeTicketId(): string {
  const rand = Math.floor(Math.random() * 1e6);
  return `SUP-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

function saveRequest(ticketId: string, params: Record<string, string>): number | null {
  try {
    const rec = record.create({ type: "customrecord_sup_request" });
    rec.setValue({ fieldId: "name",                     value: ticketId });
    rec.setValue({ fieldId: "custrecord_sup_req_name",    value: params.name     ?? "" });
    rec.setValue({ fieldId: "custrecord_sup_req_email",   value: params.email    ?? "" });
    rec.setValue({ fieldId: "custrecord_sup_req_topic",   value: params.category ?? "" });
    rec.setValue({ fieldId: "custrecord_sup_req_urgency", value: params.urgency  ?? "low" });
    rec.setValue({ fieldId: "custrecord_sup_req_message", value: params.message  ?? "" });
    return rec.save({ ignoreMandatoryFields: true }) as number;
  } catch (e) {
    log.error({ title: "Support request save failed", details: { ticketId, error: e } });
    return null;
  }
}

function loadTickets(limit?: number): support.Ticket[] {
  const tickets: support.Ticket[] = [];
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

    s.run().each((result: search.Result) => {
      tickets.push({
        ticketId: result.getValue("name")                    as string | null,
        name:     result.getValue("custrecord_sup_req_name")  as string | null,
        email:    result.getValue("custrecord_sup_req_email") as string | null,
        topic:    result.getValue("custrecord_sup_req_topic") as string | null,
        date:     result.getValue("created")                 as string | null
      });
      // Stop early once we have enough; `each` keeps iterating while we return true.
      return limit === undefined || tickets.length < limit;
    });
  } catch (e) {
    log.error({ title: "Ticket search failed", details: e });
  }
  return tickets;
}

// Number of most-recent tickets previewed on the landing page.
const RECENT_TICKETS_LIMIT = 3;

function buildBaseUrl(request: EntryPoints.Suitelet.onRequestContext["request"]): string {
  // Strip query string; re-attach only the `script` and `deploy` params
  // that NetSuite requires on all Suitelet URLs.
  const url    = request.url;
  const qIndex = url.indexOf("?");
  const path   = qIndex === -1 ? url : url.substring(0, qIndex);
  const script = (request.parameters as Record<string, string>).script ?? "";
  const deploy = (request.parameters as Record<string, string>).deploy ?? "";
  return `${path}?script=${script}&deploy=${deploy}`;
}

export function onRequest(context: EntryPoints.Suitelet.onRequestContext): void {
  const { request, response } = context;
  response.setHeader({ name: "Content-Type", value: "text/html; charset=utf-8" });

  const params  = (request.parameters ?? {}) as Record<string, string>;
  const base    = buildBaseUrl(request);

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

// SDF isolation Batch 1 verification - 2026-05-28T20:35:52Z
