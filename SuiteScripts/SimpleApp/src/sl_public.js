/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 * Publicly-accessible companion to sl_simple. Deployed with `isonline=T`
 * (Available Without Login) so an external client — including Cycle's MCP
 * server — can GET the URL without OAuth/TBA. NEVER read sensitive records
 * here; the response is world-readable to anyone with the URL.
 */
define(["N/ui/serverWidget", "N/log"], function (serverWidget, log) {
  function onRequest(context) {
    if (context.request.method !== "GET") return;

    var name = context.request.parameters.name || "world";

    log.audit({
      title: "sl_public hit",
      details: { method: context.request.method, name: name }
    });

    var form = serverWidget.createForm({
      title: "Cycle Collaboration (Public)"
    });

    var nameField = form.addField({
      id: "custpage_name",
      type: serverWidget.FieldType.TEXT,
      label: "Your name"
    });
    nameField.layoutType = serverWidget.FieldLayoutType.NORMAL;
    nameField.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
    nameField.defaultValue = name;

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
    greeting.defaultValue = "Hello, " + name;
    greeting.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

    form.addSubmitButton({ label: "Greet" });

    context.response.writePage(form);
  }

  return {
    onRequest: onRequest
  };
});
