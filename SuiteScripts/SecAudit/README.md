# SecAudit — Cycle worker-sdf sandbox escape assessment

Authorized security assessment of Cycle's **own** `worker-sdf` deployment container
(dev environment, owner-operated). Goal: measure how much of the **CYC-754** multi-tenant
attack surface is already closed by **CYC-667** (DAC uid-2000 drop + env allowlist + config
pre-flight), and which gaps remain exploitable in the live `dev` image
(`midwr/cycle-worker-sdf-dev:dev-15d794b`, Node v24.17, DOKS 1.33, NYC2).

## How it works

`suitecloud.config.js` is the tenant code-execution vector: the SuiteCloud CLI `require()`s it
from the project CWD on the first CLI invocation (`account:setup:ci` → before validate/deploy),
so its top-level code runs inside the suitecloud subprocess (**uid 2000**, env-allowlisted).
Each probe is gated by a `FLAGS` entry (feature flags) toggled per deploy. Results are emitted
as `[[SECPROBE]]` lines; the harness throws so the worker's `sdfCliFailure` path logs
stdout/stderr (read via `kubectl logs` on `cycle-dev-worker-sdf-deployment-*` or Loki).

**Rules of engagement:** read-only, non-destructive, no exfiltration outside the cluster, no
secret values printed (only names / lengths / booleans / reachability / RBAC verbs).

## Results (deploys 0.0.1–0.0.5, batches A–E)

Verdict: **BREACH** = isolation failed. **BLOCKED** = isolation held. **INFO** = baseline.

| Probe | CYC-754 surface | Verdict | Evidence |
| --- | --- | --- | --- |
| recon | baseline | INFO | child(uid2000) `nnp=1 CapEff=0`; parent(worker) `nnp=0 CapEff=setuid,setgid` |
| fs_app_read | CYC-667 uid drop | ✅ BLOCKED | `/app/*` → EACCES (uid 2000 has no read on Cycle code) |
| env_secrets | CYC-667 env allowlist | ✅ BLOCKED | env = `[HOME,JAVA_HOME,JAVA_TOOL_OPTIONS,NODE_PATH,PATH,SUITECLOUD_CI,SUITECLOUD_CI_PASSKEY]` — zero secrets |
| proc_environ_other | uid separation | ✅ BLOCKED | cannot read worker's `/proc/PID/environ` (EACCES) — secrets-in-env protected |
| write_rootfs | readOnlyRootFilesystem | ✅ BLOCKED* | only `/tmp` writable; `/ /app /usr /etc` EACCES (*by ownership, not RO-rootfs) |
| uid0_direct | **CYC-658** | ✅ BLOCKED | `setuid(0)` → EPERM (no_new_privs neutralizes node file-caps) |
| uid0_node_exec | CYC-658 | ✅ BLOCKED | fresh `node` setuid(0) fails |
| uid0_setpriv | CYC-658 | ✅ BLOCKED | `setpriv --reuid 0` fails |
| uid0_filecaps | CYC-658 | INFO | `/usr/bin/node cap_setuid=ep` present BUT `NoNewPrivs=1` |
| child_process_exec | arbitrary exec | 🔴 BREACH | runs sh/wget/nc/node/java/su/setpriv (inherent to running user code) |
| java_exec | arbitrary exec | 🔴 BREACH | JVM invokable |
| preflight_evasion | CYC-667 layer-4 scope | 🔴 BREACH | payload in `./sec/evade.js` runs **unscanned** (scanner reads only `suitecloud.config.js`) |
| sa_token_read | automountSAToken | 🔴 BREACH | SA token readable (1248B) |
| k8s_rbac_review | SA blast radius | 🟠 LOW | token authenticates, but SA RBAC = self-review + non-resource GET only; **no secrets/pods** |
| net_metadata | NetworkPolicy | 🔴 BREACH | `169.254.169.254` → `id=579057589 region=nyc2` |
| net_redis | NetworkPolicy | 🔴 BREACH | `10.150.29.111:6379` → `-NOAUTH` (reachable, pw-gated) |
| net_k8s_api | NetworkPolicy | 🔴 BREACH | `kubernetes.default.svc/version` → `v1.33` |
| net_internal | NetworkPolicy | 🔴 BREACH | backend pod `10.150.29.63:3000` → OPEN |
| recycle_persistence | pod-per-job | 🔴 BREACH | `/tmp` file survives across jobs on shared pod (prior_runs=1; pod dc5f4 ran C→D→E) |

## Headline

Despite **confirmed arbitrary code execution** as uid 2000, the high-value targets are **NOT
reachable**: Cycle's NetSuite encryption key, DB URL, GitHub App key, Redis password, other
tenants' credentials, Cycle source, and container root are all unreachable. CYC-667
(uid-drop + env allowlist) plus an **incidental** Node hardening (no_new_privs on the
setuid'd child, which blocks CYC-658) close the secret-exfil and escalation paths.

Remaining gaps are **network + hygiene**, not secret disclosure:
unrestricted egress (no NetworkPolicy), readable-but-unprivileged SA token, shared-pod `/tmp`
persistence, and a trivially-evadable pre-flight scanner. See the assessment report for the
CYC-667→CYC-754 coverage map and remediation order.

### CYC-658 caveat (important)
The escalation is blocked by `no_new_privs=1` on the uid-dropped suitecloud node — but **no
Cycle control sets it** (the Dockerfile has no `setpriv` wrapper and still says "Verified
exploitable"). It comes from Node's own AT_SECURE / CVE-2024-21892-era hardening when a
capability-bearing binary is exec'd after setuid. This is **incidental and fragile**: it would
regress if the subprocess became a non-node binary, Node were downgraded, or the spawn ran
without the uid/gid drop. Make it explicit (the planned `setpriv --no-new-privs` / wrapper
binary) to truly close CYC-658.

## Re-running
This project is parked at `[never]` in `.cycledeploy` so it stays dormant. To re-run a batch:
set `.cycledeploy` to `[always]`, flip the desired `FLAGS` in `suitecloud.config.js`, bump the
version line, and push. Read results from the worker-sdf pod logs (grep `[[SECPROBE]]`).
