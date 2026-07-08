const SuiteCloudJestUnitTestRunner = require("@oracle/suitecloud-unit-testing/services/SuiteCloudJestUnitTestRunner");

module.exports = {
  defaultProjectFolder: "src",
  commands: {
    // Run the Jest unit tests BEFORE the SDF deploy uploads anything. The
    // SuiteCloud CLI invokes this hook, so a failing test aborts the deploy.
    // (Cycle's deploy pod surfaces this as the "Running tests…" UI state.)
    "project:deploy": {
      beforeExecuting: async (args) => {
        await SuiteCloudJestUnitTestRunner.run({});
        return args;
      },
    },
  },
};
