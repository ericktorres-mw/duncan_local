/**
 * @NApiVersion 2.1
 * Shared pure logic for HelloWorldApp's satisfaction survey. No @NScriptType,
 * so it's a plain library any script type can require. Kept side-effect free
 * so it's trivially unit-testable (see survey_logic.test.js).
 */
define([], function () {
  var RATING_LABELS = {
    "5": "Excellent",
    "4": "Good",
    "3": "Average",
    "2": "Poor",
    "1": "Very Poor"
  };

  function ratingLabel(value) {
    var key = value === undefined || value === null ? "" : String(value);
    return RATING_LABELS[key] || "-";
  }

  function thankYouMessage(fullName, rating) {
    var name = fullName ? String(fullName) : "valued customer";
    var ratingValue = rating ? String(rating) : "-";
    return (
      "<h2>Thank you for your feedback, " + name + "!</h2>" +
      "<p>Your responses have been recorded.</p>" +
      "<p><strong>Rating:</strong> " + ratingValue + " / 5</p>"
    );
  }

  return {
    ratingLabel: ratingLabel,
    thankYouMessage: thankYouMessage
  };
});
