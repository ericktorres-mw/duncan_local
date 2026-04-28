/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/search", "N/log"], function (serverWidget, search, log) {
  function onRequest(context) {
    if (context.request.method !== "GET") return;

    var form = serverWidget.createForm({
      title: "Cycle Collaboration"
    });

    var nameField = form.addField({
      id: "custpage_name",
      type: serverWidget.FieldType.TEXT,
      label: "Your name"
    });
    nameField.layoutType = serverWidget.FieldLayoutType.NORMAL;
    nameField.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
    nameField.defaultValue = context.request.parameters.name || "world";

    form.addField({
      id: "custpage_when",
      type: serverWidget.FieldType.DATE,
      label: "When"
    });

    var greeting = form.addField({
      id: "custpage_greeting",
      type: serverWidget.FieldType.TEXT,
      label: "Greeting"
    });
    greeting.defaultValue = "Hello, " + (context.request.parameters.name || "world");
    greeting.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

    var sublist = form.addSublist({
      id: "custpage_recent_so",
      type: serverWidget.SublistType.LIST,
      label: "Recent Sales Orders"
    });
    sublist.addField({ id: "custpage_so_tranid", type: serverWidget.FieldType.TEXT, label: "Document #" });
    sublist.addField({ id: "custpage_so_trandate", type: serverWidget.FieldType.TEXT, label: "Date" });
    sublist.addField({ id: "custpage_so_customer", type: serverWidget.FieldType.TEXT, label: "Customer" });
    sublist.addField({ id: "custpage_so_status", type: serverWidget.FieldType.TEXT, label: "Status" });
    sublist.addField({ id: "custpage_so_total", type: serverWidget.FieldType.CURRENCY, label: "Total" });

    try {
      var soSearch = search.create({
        type: search.Type.SALES_ORDER,
        filters: [["mainline", "is", "T"]],
        columns: [
          search.createColumn({ name: "tranid" }),
          search.createColumn({ name: "trandate", sort: search.Sort.DESC }),
          search.createColumn({ name: "entity" }),
          search.createColumn({ name: "statusref" }),
          search.createColumn({ name: "total" })
        ]
      });

      var rows = soSearch.run().getRange({ start: 0, end: 10 });
      rows.forEach(function (row, idx) {
        sublist.setSublistValue({ id: "custpage_so_tranid", line: idx, value: row.getValue("tranid") || "-" });
        sublist.setSublistValue({ id: "custpage_so_trandate", line: idx, value: row.getValue("trandate") || "-" });
        sublist.setSublistValue({
          id: "custpage_so_customer",
          line: idx,
          value: row.getText("entity") || row.getValue("entity") || "-"
        });
        sublist.setSublistValue({
          id: "custpage_so_status",
          line: idx,
          value: row.getText("statusref") || row.getValue("statusref") || "-"
        });
        sublist.setSublistValue({ id: "custpage_so_total", line: idx, value: row.getValue("total") || "0" });
      });

      log.audit({ title: "sl_simple recent SO loaded", details: { count: rows.length } });
    } catch (e) {
      log.error({ title: "sl_simple recent SO failed", details: e });
    }

    form.addSubmitButton({ label: "Greet" });

    context.response.writePage(form);
  }

  return {
    onRequest: onRequest
  };
});
