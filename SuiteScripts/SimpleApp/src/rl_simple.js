/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 * RESTlet bridge for SimpleApp. Dispatches `action` → handler. Declared in
 * netsuite-tools.yaml so Cycle's MCP server exposes these handlers as tools.
 *
 * NOTE: NetSuite 2.1 rejects cross-script-type requires (a @NScriptType
 * Restlet can't `define()` a file marked @NScriptType Suitelet). That's
 * why the HTML render lives in simple_logic.js — a plain library — and
 * both scripts consume it identically.
 */
define(["./lib/simple_logic", "N/search"], function (simpleLogic, search) {
  function recentSalesOrders(args) {
    var limit = Math.min(Math.max(parseInt((args && args.limit) || 10, 10) || 10, 1), 50);
    var soSearch = search.create({
      type: search.Type.SALES_ORDER,
      filters: [["mainline", "is", "T"]],
      columns: [
        search.createColumn({ name: "tranid" }),
        search.createColumn({ name: "trandate", sort: search.Sort.DESC }),
        search.createColumn({ name: "entity" }),
        search.createColumn({ name: "statusref" }),
        search.createColumn({ name: "total" }),
        search.createColumn({ name: "currency" })
      ]
    });
    var rows = soSearch.run().getRange({ start: 0, end: limit });
    var orders = rows.map(function (row) {
      return {
        tranid: row.getValue("tranid") || null,
        trandate: row.getValue("trandate") || null,
        customer: row.getText("entity") || row.getValue("entity") || null,
        status: row.getText("statusref") || row.getValue("statusref") || null,
        total: parseFloat(row.getValue("total") || "0"),
        currency: row.getText("currency") || row.getValue("currency") || null
      };
    });
    var totalAmount = orders.reduce(function (acc, o) {
      return acc + (isNaN(o.total) ? 0 : o.total);
    }, 0);
    return { count: orders.length, totalAmount: totalAmount, orders: orders };
  }

  var handlers = {
    get_greeting: simpleLogic.getGreeting,
    reverse_text: simpleLogic.reverseText,
    get_suitelet: function (args) {
      return { html: simpleLogic.renderPage(args || {}) };
    },
    recent_sales_orders: recentSalesOrders
  };

  function dispatch(body) {
    var action = body && body.action;
    var handler = handlers[action];
    if (!handler) {
      return { error: "Unknown action: " + action, statusCode: 404 };
    }
    try {
      return handler(body.args || {});
    } catch (e) {
      return { error: String((e && e.message) || e), statusCode: 500 };
    }
  }

  return {
    post: dispatch
  };
});
