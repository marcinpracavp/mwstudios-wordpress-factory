# Autopilot v2 verification ? 2026-09-19

Branch: autopilot-v2-optimized. Backup autopilot-v1 is preserved. Changes are local; no Git push was performed.

## Automated checks

21 regression tests pass: router/classes, task budgets, source-bound content batching, scoped prompts,
custom instructions, native record verification, output/evidence invalidation, responsive global/local/state
diagnostics, image-source attribution and raster-noise negative controls. The real host state machine is
exercised with controlled worker/browser/WP boundaries, including Luna -> Terra, a capacity interruption,
retained over-budget component output, and retained over-budget Sol output. The latter resumes to complete
without a second Sol invocation. Evidence: .factory-cache/v2-tests-final.log.

Real project preflight prepared 248 capsules: 53 shared, 75 page/state components, 120 native batches.
No input-size failure; largest prompt + capsule was 21,321 bytes including the prompt after final budget-reservation fix.
Evidence: .factory-cache/autopilot/v2-preflight-1789850855706/REPORT.json.

## Live isolated smoke

Fixture: .factory-cache/v2-smoke/2026-09-19T19-27-54-606Z/REPORT.json.
This is an explicitly synthetic three-view project, not WordPress or RudnikAgro acceptance.
Luna medium corrected the assigned CSS height and recorded CUSTOM_SMOKE_OBSERVED.
All three views at 1920px have 0% reference/render difference and no overflow. The deliberate
before defect measured 8.8889%. Sol high inspected the actual reference/render image pairs and
returned passed; the retained report also documents its live panel-toggle verification.
The actual model image-view calls were verified in its local session trace; exec JSONL does not
expose those nested view_image calls as separate items.

A real production Webpack build and independent browser re-capture of its emitted CSS bundle
also passed on all three views. Evidence: webpack-build.log, webpack-validation.json and *-webpack.png
inside the fixture. The recovery invokes no model. final-sol.json now records complete.

Luna: input 212,564; cached 167,936; uncached 44,628; output 3,507.
Sol: input 1,470,147; cached 1,379,328; uncached 90,819; output 15,226.
Sol exceeded the smoke's 600k total input / 6k output / 60k uncached-input limits. Its original execution
remains TASK_REPORTED_TOKEN_BUDGET. The completed review was retained and independently revalidated;
usage.jsonl marks pass-with-budget-overrun. No second Sol session was launched.

The final packet now explicitly includes applicable interaction evidence to avoid repeating host QA or
rebuilding a browser harness. CSS/PHP prompts are narrower. These text reductions are real, but this
run does NOT prove lower billed tokens: there was no controlled paid v1 A/B baseline. The earlier Luna
smoke used fewer tokens than this sample; do not advertise a measured billing reduction.

## Acceptance boundary

The synthetic smoke and controlled pipeline reached complete / READY FOR HUMAN REVIEW.
The ongoing RudnikAgro run is intentionally paused after one verified native batch; this report does
not mark that site complete. Its worker generated the scoped native-batch.verifyBatch adapter and
the host independently verified the three assigned products. Additional content/listing kinds remain
worker tasks; unsupported adapter scope becomes a failed probe rather than a false checkpoint. Root work changed Autopilot infrastructure,
not site implementation or source Figma assets. Existing worker project edits remain preserved.

Token limits use observed-byte guards plus actual CLI usage; hidden reasoning can still overshoot before
the final usage event. Overruns are retained, not erased. Numeric costs are Standard short-context API
estimates from https://developers.openai.com/api/docs/pricing (checked 2026-09-19), not Codex subscription
billing. Missing usage remains unknown.

## Real native batch and restart proof

Autopilot worker 006 imported three source card products and reported idempotent re-import.
The host independently verified native IDs 143, 155 and 167 against their source keys, titles, prices
and media ownership. Durable proof: .factory-cache/autopilot/runs/2026-09-19T14-48-07-799Z-7588/
native-probe-4f97afc9df7b0768-1789850613766.json. The task checkpoint is passed.

Resume with --native-batch-limit 1 retained six total model attempts (no new invocation), validated
the real data, then paused with NATIVE_BATCH_LIMIT_REACHED before the next batch. This flag provides
a bounded runtime sanity check. The full project continues with ordinary resume when wanted.

The first batch includes adapter construction and exceeded its budget: 2,062,085 input, 1,958,656 cached,
103,429 uncached input and 24,175 output. This is retained as TASK_REPORTED_TOKEN_BUDGET.
Earlier attempts 004/005 were stopped by exposed-context guards; 005 exposed a bytes-versus-tokens
implementation bug, now fixed and regression-tested. Byte guards are separate (400KB aggregate,
64KB single tool result); token limits still use actual reported usage. No claim of reduced real-session
tokens is made from these samples.
