/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define([], function () {
  function cancelSelection() {
    window.close();
  }

  function saveRecord(context) {
    // Allow form submission to POST method
    return true;
  }

  function fieldChanged(context) {
    if (context.fieldId === "custpage_do_not_send_email") {
      var currentRecord = context.currentRecord;
      var doNotSend = currentRecord.getValue("custpage_do_not_send_email");

      var lineCount = currentRecord.getLineCount({
        sublistId: "custpage_contact_sublist",
      });

      for (var i = 0; i < lineCount; i++) {
        // disable/enable checkbox
        currentRecord.getSublistField({
          sublistId: "custpage_contact_sublist",
          fieldId: "custpage_select",
          line: i,
        }).isDisabled = doNotSend;
      }
    }
  }

  return {
    fieldChanged: fieldChanged,
    saveRecord: saveRecord,
    cancelSelection: cancelSelection,
  };
});
