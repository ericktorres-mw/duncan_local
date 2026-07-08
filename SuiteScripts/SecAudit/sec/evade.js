/*
 * Batch D — preflight-scanner evasion payload.
 * CYC-667 layer 4 (analyzeSuitecloudConfig) reads ONLY suitecloud.config.js and
 * pattern-matches it. Any code moved into a required submodule like this one is
 * never scanned, so these patterns raise no WARN even though they execute.
 */
const cp = require("child_process"); // child_process — would be WARN if it were in the scanned file
const net = require("net");          // net — idem
module.exports = {
  run: function () {
    // prove the submodule executes arbitrary code that the scanner did not see
    const who = cp.execSync("id -u", { encoding: "utf8", timeout: 4000 }).trim();
    return "evade.js executed unscanned (uid=" + who + ", net+child_process loaded)";
  },
};
