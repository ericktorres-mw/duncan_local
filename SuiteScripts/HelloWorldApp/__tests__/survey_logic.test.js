// Jest unit tests for HelloWorldApp's survey logic. Run by `suitecloud
// project:deploy` via the beforeExecuting hook in suitecloud.config.js, so a
// failure aborts the deploy (and Cycle shows the "Running tests…" state).
// survey_logic.js is a SuiteScript AMD module (define([], …)); the SuiteCloud
// jest transformer turns it into a requireable module.
const surveyLogic = require("../src/lib/survey_logic");

describe("survey_logic.ratingLabel", () => {
  test("maps 5 to Excellent", () => {
    expect(surveyLogic.ratingLabel("5")).toBe("Excellent");
  });
  test("maps 1 to Very Poor", () => {
    expect(surveyLogic.ratingLabel("1")).toBe("Very Poor");
  });
  test("handles numeric input", () => {
    expect(surveyLogic.ratingLabel(3)).toBe("Average");
  });
  test("defaults unknown values to a dash", () => {
    expect(surveyLogic.ratingLabel("")).toBe("-");
  });
});

describe("survey_logic.thankYouMessage", () => {
  test("greets the customer by name", () => {
    expect(surveyLogic.thankYouMessage("Ada", "5")).toContain(
      "Thank you for your feedback, Ada!",
    );
  });
  test("shows the rating out of 5", () => {
    expect(surveyLogic.thankYouMessage("Ada", "5")).toContain(
      "<strong>Rating:</strong> 5 / 5",
    );
  });
  test("falls back to 'valued customer' when no name", () => {
    expect(surveyLogic.thankYouMessage("", "")).toContain("valued customer");
  });
});
