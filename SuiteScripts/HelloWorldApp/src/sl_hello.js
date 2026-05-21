/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// M1.1 env-lock test bump 2026-05-16
define(["N/ui/serverWidget", "N/log"], function (serverWidget, log) {
  function onRequest(context) {
    if (context.request.method === "GET") {
      var form = serverWidget.createForm({
        title: "Service Satisfaction Survey"
      });

      form.addFieldGroup({
        id: "custpage_grp_customer",
        label: "Customer Information"
      });

      var fullName = form.addField({
        id: "custpage_full_name",
        type: serverWidget.FieldType.TEXT,
        label: "Full Name",
        container: "custpage_grp_customer"
      });
      fullName.isMandatory = true;

      form.addField({
        id: "custpage_email",
        type: serverWidget.FieldType.EMAIL,
        label: "Email",
        container: "custpage_grp_customer"
      });

      form.addField({
        id: "custpage_visit_date",
        type: serverWidget.FieldType.DATE,
        label: "Date of Service",
        container: "custpage_grp_customer"
      });

      form.addFieldGroup({
        id: "custpage_grp_survey",
        label: "Your Feedback"
      });

      var serviceType = form.addField({
        id: "custpage_service_type",
        type: serverWidget.FieldType.SELECT,
        label: "Service Received",
        container: "custpage_grp_survey"
      });
      serviceType.addSelectOption({ value: "", text: "" });
      serviceType.addSelectOption({ value: "support", text: "Customer Support" });
      serviceType.addSelectOption({ value: "sales", text: "Sales" });
      serviceType.addSelectOption({ value: "delivery", text: "Delivery" });
      serviceType.addSelectOption({ value: "installation", text: "Installation" });
      serviceType.addSelectOption({ value: "other", text: "Other" });

      var rating = form.addField({
        id: "custpage_rating",
        type: serverWidget.FieldType.SELECT,
        label: "Overall Satisfaction",
        container: "custpage_grp_survey"
      });
      rating.isMandatory = true;
      rating.addSelectOption({ value: "", text: "" });
      rating.addSelectOption({ value: "5", text: "5 - Excellent" });
      rating.addSelectOption({ value: "4", text: "4 - Good" });
      rating.addSelectOption({ value: "3", text: "3 - Average" });
      rating.addSelectOption({ value: "2", text: "2 - Poor" });
      rating.addSelectOption({ value: "1", text: "1 - Very Poor" });

      var recommend = form.addField({
        id: "custpage_recommend",
        type: serverWidget.FieldType.SELECT,
        label: "How likely are you to recommend us? (1-10)",
        container: "custpage_grp_survey"
      });
      recommend.addSelectOption({ value: "", text: "" });
      for (var i = 1; i <= 10; i++) {
        recommend.addSelectOption({ value: String(i), text: String(i) });
      }

      var comments = form.addField({
        id: "custpage_comments",
        type: serverWidget.FieldType.LONGTEXT,
        label: "Additional Comments",
        container: "custpage_grp_survey"
      });
      comments.updateDisplaySize({ height: 6, width: 60 });

      form.addSubmitButton({ label: "Submit Survey" });

      context.response.writePage(form);
      return;
    }

    if (context.request.method === "POST") {
      var p = context.request.parameters;
      var response = {
        fullName: p.custpage_full_name || "",
        email: p.custpage_email || "",
        visitDate: p.custpage_visit_date || "",
        serviceType: p.custpage_service_type || "",
        rating: p.custpage_rating || "",
        recommend: p.custpage_recommend || "",
        comments: p.custpage_comments || ""
      };

      log.audit({
        title: "Service survey submitted",
        details: response
      });

      var confirm = serverWidget.createForm({ title: "Thank You!" });
      var msg = confirm.addField({
        id: "custpage_thanks",
        type: serverWidget.FieldType.INLINEHTML,
        label: " "
      });
      msg.defaultValue =
        "<h2>Thank you for your feedback, " +
        (response.fullName || "valued customer") +
        "!</h2>" +
        "<p>Your responses have been recorded.</p>" +
        "<p><strong>Rating:</strong> " + (response.rating || "-") + " / 5</p>";

      context.response.writePage(confirm);
    }
  }

  return {
    onRequest: onRequest
  };
});









// M1.2 push 1 1778953733
// M1.2 push 2 1778953737
// M1.2 push 3 1778953740
// M1.2 push 4 1778953744
// M1.2 push 5 1778953747
// M1.X mixed sync-only push 2 1778972121
// M1.X mixed sync-only push 4 1778972126
