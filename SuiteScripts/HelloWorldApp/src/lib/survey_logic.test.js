/**
 * @NApiVersion 2.1
 * Small self-contained tests for HelloWorldApp's survey logic. Require it and
 * call run() to assert ratingLabel / thankYouMessage and get a pass/fail
 * summary back. Dependency-free so it runs anywhere the library does.
 */
define(["./survey_logic"], function (surveyLogic) {
  function assertEqual(results, name, actual, expected) {
    results.push({ name: name, passed: actual === expected, expected: expected, actual: actual });
  }

  function assertContains(results, name, haystack, needle) {
    var ok = typeof haystack === "string" && haystack.indexOf(needle) !== -1;
    results.push({ name: name, passed: ok, expected: "contains: " + needle, actual: haystack });
  }

  function run() {
    var results = [];

    // ratingLabel
    assertEqual(results, "ratingLabel maps 5 to Excellent", surveyLogic.ratingLabel("5"), "Excellent");
    assertEqual(results, "ratingLabel maps 1 to Very Poor", surveyLogic.ratingLabel("1"), "Very Poor");
    assertEqual(results, "ratingLabel handles numeric input", surveyLogic.ratingLabel(3), "Average");
    assertEqual(results, "ratingLabel defaults unknown to dash", surveyLogic.ratingLabel(""), "-");

    // thankYouMessage
    assertContains(results, "thankYouMessage greets the customer", surveyLogic.thankYouMessage("Ada", "5"), "Thank you for your feedback, Ada!");
    assertContains(results, "thankYouMessage shows the rating", surveyLogic.thankYouMessage("Ada", "5"), "<strong>Rating:</strong> 5 / 5");
    assertContains(results, "thankYouMessage falls back to valued customer", surveyLogic.thankYouMessage("", ""), "valued customer");

    var passed = results.filter(function (r) { return r.passed; }).length;
    return { total: results.length, passed: passed, failed: results.length - passed, results: results };
  }

  return { run: run };
});
