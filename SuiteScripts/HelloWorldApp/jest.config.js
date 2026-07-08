const SuiteCloudJestConfiguration = require("@oracle/suitecloud-unit-testing/jest-configuration/SuiteCloudJestConfiguration");
const cliConfig = require("./suitecloud.config");

module.exports = {
  ...SuiteCloudJestConfiguration.build({
    projectFolder: cliConfig.defaultProjectFolder,
    projectType: SuiteCloudJestConfiguration.ProjectType.ACP,
  }),
  // Only the Jest specs under __tests__ are jest tests. src/lib/survey_logic.test.js
  // is a SuiteScript (AMD) module that runs INSIDE NetSuite, not a jest spec, so we
  // must not let jest pick it up.
  testMatch: ["**/__tests__/**/*.test.js"],
};
