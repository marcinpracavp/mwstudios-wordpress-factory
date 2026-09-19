# V2 verification — 2026-09-19

Backup: `autopilot-v1` and `autopilot-do-wgladu` both point to
`310d4d45aa0cbba3bbb554c0ca7368fbb7242d7e`. Implementation branch: `autopilot-v2-optimized`.

The automated suite passed 13 tests, including the real host state machine with controlled worker,
browser and WordPress boundaries: a failed shared gate escalates Luna → Terra; a later capacity
interruption prevents page work; resume skips completed source/global/header tasks and continues
the missing footer on Luna; the final-polish tasks reach Sol.
Evidence: `.factory-cache/v2-tests.log`.

The live worker smoke test passed on an explicitly synthetic three-view project. This is not a Figma
or WordPress production acceptance. Luna medium changed the specified CSS height; the host then
measured all three views at 1920px. Each had 0% screenshot difference and zero overflow. The panel
interaction passed. The negative control before correction differed by 8.8889%, proving the comparator
detected the deliberate defect. `CUSTOM_SMOKE_OBSERVED` in the worker's proof confirms custom instructions
were consumed, rather than merely read by the host.

Evidence: `.factory-cache/v2-smoke/2026-09-19T14-31-19-005Z/REPORT.json`,
`run/001-hero-height/launch.json`, `execution.json`, `usage.json`, and `proof.md` within that fixture.

Actual successful Luna usage: 141,904 input tokens, of which 116,224 were cached; 25,680 uncached input
and 2,331 output tokens. Cost remains unknown because no verified model billing rates are configured.
The common CSS prompt decreased from 10,123 to 1,886 characters (81.37%). This is a prompt-size comparison,
not an A/B proof of the same percentage decrease in billed tokens or credits. There was no paid v1 baseline run.

Earlier smoke attempts exposed restricted network access and a budget that counted repeated cached input
against an excessively small total-input cap. They are preserved as failed attempts. The successful test
used separate total-input and uncached-input limits. Result evidence now has a file-path schema; citation
suffixes can be normalized only when an exact existing file is found. Commands/missing files still fail.

Real RudnikAgro preflight prepared 128 component capsules (31 shared, 97 page/state components), with
no context-budget errors; the largest was 13,398 bytes including its prompt.
Evidence: `.factory-cache/autopilot/v2-preflight-1789828698322/REPORT.json`.

A read-only real component capture verified source viewport 1920px and the topbar's actual pixels and
geometry: 1.6966% difference, within the configured 8.5% threshold. It reused the frozen local reference.
Evidence: `.factory-cache/autopilot/v2-real-readonly-check/comparison.json`.
This does not certify the entire RudnikAgro website. The factory configuration and LocalWP identity
checks also passed. No site implementation files were manually edited for these tests.
