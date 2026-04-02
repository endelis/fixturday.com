# Fixturday Skill — Autonomous Improvement Loop

Paste this prompt into Claude Code to kick off overnight self-improvement.
Replace the paths if your skill folder is in a different location.

---

## Prompt to paste into Claude Code

```
Use the skill-creator skill. Run a self-improvement loop on the Fixturday dev skill.

Skill location: /path/to/your/skills/user/fixturday-dev/SKILL.md
Eval file: /path/to/your/skills/user/fixturday-dev/eval/eval.json

Process:
1. Read the current SKILL.md
2. For each of the 5 test cases in eval.json, use the skill to generate the requested output
3. Grade each output against its 5 binary assertions (true/false only — no partial credit)
4. Calculate pass rate: total assertions passed / 25
5. Log the result: iteration number, pass rate, which assertions failed
6. If pass rate < 100%:
   - Identify the most commonly failing assertion
   - Make ONE targeted change to SKILL.md to address it
   - git commit the change with message: "skill: improve [assertion description]"
   - Re-run all 5 test cases and regrade
   - If new pass rate > previous pass rate: keep the commit
   - If new pass rate <= previous pass rate: git reset HEAD~1 (revert) and try a different change
7. Repeat from step 2
8. Stop only when pass rate = 100% or you have made 20 iterations with no improvement

Rules:
- Do not ask for permission to continue between iterations
- Do not pause to summarize progress unless pass rate hits 100%
- Do not make more than one change to SKILL.md per iteration
- Log every iteration to /path/to/your/skills/user/fixturday-dev/eval/improvement-log.md
- If you revert a change, note what was tried and why it failed in the log
- You are autonomous. The human may be asleep. Keep working until you hit 100% or exhaust iterations.
```

---

## What to expect

**Iteration 1–3:** Most failures will be structural — missing error handling, hardcoded strings, no auth check. The skill will add more explicit rules.

**Iteration 4–8:** Subtler failures — wrong sort order in standings, missing cleanup in Realtime subscriptions. The skill will add code examples.

**Iteration 9+:** Edge cases — odd team counts in round-robin, registration_open checks. The skill will add edge case callouts.

**Signs it's working well:**
- Each iteration log shows a different assertion being targeted
- Pass rate trends upward (occasional dips after a bad change that gets reverted are normal)
- SKILL.md grows by 5–20 lines per iteration with specific, actionable rules

**Signs something is wrong:**
- Pass rate oscillates without improving (same assertion failing repeatedly) → manually add an explicit code example for that assertion to SKILL.md and restart
- Pass rate stuck at 0% → eval.json assertions may be too strict; review and soften one

---

## After the loop completes

1. Review `/eval/improvement-log.md` — read what changed and why
2. Open the final `SKILL.md` — scan for any rules that feel redundant or contradictory
3. Clean up manually if needed (merge duplicate rules, trim verbose examples)
4. Run the skill-creator description optimizer to also improve trigger accuracy:
   ```
   Use the skill-creator skill. Run the description optimization loop on the fixturday-dev skill.
   ```
5. Install the updated skill in your Claude Code workspace

---

## Layer 1 vs Layer 2 (from the video)

| Layer | What it improves | Tool |
|---|---|---|
| Layer 1 — Trigger accuracy | Does Claude activate the skill at the right time? | Built-in skill-creator description loop |
| Layer 2 — Output quality | Does the skill produce correct Fixturday-compliant code? | This loop (eval.json + Karpathy pattern) |

Run Layer 2 (this file) first during active development.
Run Layer 1 after the skill is stable and you notice it not triggering.
