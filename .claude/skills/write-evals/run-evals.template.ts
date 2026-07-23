// Self-contained, model-backed behavioral eval runner. Drop this into a repo
// that has no eval harness (the write-evals skill scaffolds it here), then add
//   "test:evals": "bun <this-file>"
// to package.json. Requires Bun and the `claude` CLI on PATH.
//
// It loads every `*.evals.json` under EVAL_SPECS_DIR, runs each case against a
// fresh temp git repo seeded with the case's fixture files, then checks
// deterministic assertions and (optionally) LLM-judged expectations.
//
// Config (all via env, with defaults):
//   EVAL_SPECS_DIR        dir holding *.evals.json specs        (default: evals)
//   EVAL_OUT_DIR          where transcripts/artifacts land      (default: evals/.out/<ts>)
//   EVAL_AGENT_CMD        shell command for the system-under-test; receives the
//                         case prompt on stdin and via $EVAL_PROMPT, runs in the
//                         temp repo. If unset, defaults to `claude -p`.
//   EVAL_JUDGE_MODEL      model for the expectation judge        (default: claude-haiku-4-5)
//   EVAL_SCORE_THRESHOLD  min % of expectations met to pass      (default: 70)
//   EVAL_TRIALS           runs per case (routing cases pass by    (default: 3)
//                         strict-majority of trials; judged cases average)
//   EVAL_TIMEOUT_SECONDS  per-run timeout                        (default: 180)
//   EVAL_MAX_BUDGET_USD   per-run budget for the default agent   (default: 0.50)
//   EVAL_SKILL / EVAL_ID  optional filters (match suite / case id)
//
// Case kinds: `kind:"judged"` (default) grades `assertions` + optional LLM-judged
// `expectations`. `kind:"routing"` is code-graded — a `routing` block with
// `expect`/`forbid` substrings (+ optional `overblock_guard`); no judge cost.

import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, which } from "bun";

const num = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const specsDir = process.env.EVAL_SPECS_DIR ?? "evals";
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = process.env.EVAL_OUT_DIR ?? join(specsDir, ".out", timestamp);
const agentCmd = process.env.EVAL_AGENT_CMD;
const judgeModel = process.env.EVAL_JUDGE_MODEL ?? "claude-haiku-4-5";
const scoreThreshold = num("EVAL_SCORE_THRESHOLD", 70);
const trials = Math.max(1, Math.round(num("EVAL_TRIALS", 3)));
const timeoutMs = num("EVAL_TIMEOUT_SECONDS", 180) * 1000;
const maxBudgetUsd = process.env.EVAL_MAX_BUDGET_USD ?? "0.50";
const skillFilter = process.env.EVAL_SKILL;
const idFilter = process.env.EVAL_ID;
const transcriptCharLimit = 20000;

type Assertions = {
  required_substrings?: string[];
  forbidden_substrings?: string[];
  required_files?: string[];
  required_file_substrings?: Record<string, string[]>;
  unchanged_files?: string[];
};
type RoutingBlock = { expect?: string[]; forbid?: string[]; overblock_guard?: boolean };
type EvalEntry = {
  id: string;
  prompt: string;
  kind?: "judged" | "routing";
  max_budget_usd?: number;
  expectations?: string[];
  fixture?: { files?: Record<string, string> };
  assertions?: Assertions;
  routing?: RoutingBlock;
};
type EvalSpec = { suite: string; evals: EvalEntry[] };

let passed = 0;
let failed = 0;
const fails: string[] = [];
// Routing-case tallies (code-graded).
let routingCorrectTrials = 0;
let routingTotalTrials = 0;
let routingCasesPassed = 0;
let routingCasesTotal = 0;
let overBlocked = 0;
const flakyCases: string[] = [];
const pass = (label: string) => {
  passed++;
  console.log(`  PASS ${label}`);
};
const fail = (label: string, detail = "") => {
  failed++;
  fails.push(label);
  console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
};
const includesCI = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase());

function findSpecs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return findSpecs(full);
    return entry.isFile() && entry.name.endsWith(".evals.json") ? [full] : [];
  });
}

function writeFixture(entry: EvalEntry, projectDir: string): void {
  for (const [filePath, content] of Object.entries(entry.fixture?.files ?? {})) {
    const target = join(projectDir, filePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}

function readJsonLines(raw: string): Record<string, unknown>[] {
  return raw
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as Record<string, unknown>];
      } catch {
        return [];
      }
    });
}

function collectContent(events: Record<string, unknown>[], predicate: (c: Record<string, unknown>) => boolean) {
  return events
    .filter((event) => event.type === "assistant")
    .flatMap((event) => {
      const message = event.message as Record<string, unknown> | undefined;
      return Array.isArray(message?.content) ? message.content : [];
    })
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .filter(predicate);
}

function runAgent(prompt: string, projectDir: string, budget: string): { resultText: string; transcript: string; ok: boolean } {
  if (agentCmd) {
    const result = spawnSync({
      cmd: ["sh", "-c", agentCmd],
      cwd: projectDir,
      env: { ...process.env, EVAL_PROMPT: prompt },
      stdin: Buffer.from(prompt),
      stdout: "pipe",
      stderr: "pipe",
      timeout: timeoutMs,
    });
    const out = `${result.stdout.toString()}${result.stderr.toString()}`;
    return { resultText: out, transcript: out, ok: result.exitCode === 0 };
  }

  const result = spawnSync({
    cmd: ["claude", "-p", prompt, "--permission-mode", "bypassPermissions", "--max-budget-usd", budget, "--output-format", "stream-json", "--verbose"],
    cwd: projectDir,
    stdout: "pipe",
    stderr: "pipe",
    timeout: timeoutMs,
  });
  const raw = `${result.stdout.toString()}${result.stderr.toString()}`;
  const events = readJsonLines(raw);
  const resultEvent = events.filter((event) => event.type === "result").at(-1) as Record<string, unknown> | undefined;
  const resultText = typeof resultEvent?.result === "string" ? resultEvent.result : "";
  const assistantText = collectContent(events, (c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("\n");
  const toolCalls = collectContent(events, (c) => c.type === "tool_use" && typeof c.name === "string").map((c) => {
    const input = c.input as Record<string, unknown> | undefined;
    const hint = input?.file_path ?? input?.path ?? input?.pattern ?? input?.command ?? input?.prompt;
    return typeof hint === "string" ? `${c.name as string}(${hint.slice(0, 120)})` : (c.name as string);
  });
  const parts = [assistantText, toolCalls.length ? `Tools used:\n${toolCalls.map((t) => `- ${t}`).join("\n")}` : "", resultText ? `Final result:\n${resultText}` : ""].filter(Boolean);
  let transcript = parts.join("\n\n");
  if (transcript.length > transcriptCharLimit) transcript = `${transcript.slice(0, transcriptCharLimit)}\n…[truncated]`;
  const ok = result.exitCode === 0 && resultEvent?.is_error !== true;
  return { resultText: `${assistantText}\n${resultText}`, transcript, ok };
}

function extractJson(text: string): unknown {
  const stripped = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
  const fenced = stripped.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : stripped;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return undefined;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

function judge(transcript: string, expectations: string[]): number | null {
  const numbered = expectations.map((e, i) => `${i + 1}. ${e}`).join("\n");
  const prompt = `You are grading whether an AI agent's behavior met a list of expectations, using only the transcript below.\n\nFirst reason about each expectation inside a single <thinking>…</thinking> block. Then, AFTER the closing </thinking> tag, return STRICT JSON only: {"results":[{"reason":"...","met":true}]} with one entry per expectation, in order.\n\n=== TRANSCRIPT ===\n${transcript}\n=== END ===\n\nExpectations:\n${numbered}`;
  const dir = mkdtempSync(join(tmpdir(), "eval-judge-"));
  const result = spawnSync({
    cmd: ["claude", "-p", prompt, "--model", judgeModel, "--permission-mode", "bypassPermissions", "--max-budget-usd", "0.10", "--output-format", "json"],
    cwd: dir,
    stdout: "pipe",
    stderr: "pipe",
    timeout: timeoutMs,
  });
  let envelope: Record<string, unknown> | undefined;
  try {
    envelope = JSON.parse(result.stdout.toString()) as Record<string, unknown>;
  } catch {
    envelope = undefined;
  }
  const text = typeof envelope?.result === "string" ? envelope.result : result.stdout.toString();
  const parsed = extractJson(text) as { results?: { met?: unknown }[] } | undefined;
  if (!parsed || !Array.isArray(parsed.results)) return null;
  const met = expectations.filter((_, i) => parsed.results![i]?.met === true).length;
  return Math.round((met / expectations.length) * 100);
}

function checkAssertions(entry: EvalEntry, label: string, responseText: string, projectCopy: string): void {
  const a = entry.assertions ?? {};
  for (const required of a.required_substrings ?? []) {
    includesCI(responseText, required) ? pass(`${label} contains '${required}'`) : fail(`${label} contains '${required}'`);
  }
  for (const forbidden of a.forbidden_substrings ?? []) {
    includesCI(responseText, forbidden) ? fail(`${label} excludes '${forbidden}'`) : pass(`${label} excludes '${forbidden}'`);
  }
  for (const file of a.required_files ?? []) {
    existsSync(join(projectCopy, file)) ? pass(`${label} created ${file}`) : fail(`${label} created ${file}`);
  }
  for (const [file, requiredStrings] of Object.entries(a.required_file_substrings ?? {})) {
    const full = join(projectCopy, file);
    const content = existsSync(full) ? readFileSync(full, "utf8") : "";
    for (const required of requiredStrings) {
      includesCI(content, required) ? pass(`${label} ${file} contains '${required}'`) : fail(`${label} ${file} contains '${required}'`);
    }
  }
  for (const file of a.unchanged_files ?? []) {
    const expected = entry.fixture?.files?.[file];
    const full = join(projectCopy, file);
    const actual = existsSync(full) ? readFileSync(full, "utf8") : undefined;
    typeof expected === "string" && actual === expected ? pass(`${label} left ${file} unchanged`) : fail(`${label} left ${file} unchanged`);
  }
}

function runEval(spec: EvalSpec, entry: EvalEntry): void {
  const label = `${spec.suite}/${entry.id}`;
  const evalDir = join(outDir, spec.suite, entry.id);
  mkdirSync(evalDir, { recursive: true });
  const budget = typeof entry.max_budget_usd === "number" ? String(entry.max_budget_usd) : maxBudgetUsd;
  const isRouting = entry.kind === "routing";

  const expectations = entry.expectations ?? [];
  const trialScores: number[] = [];
  let routingCorrectCount = 0;

  for (let trial = 1; trial <= trials; trial++) {
    const suffix = trials > 1 ? `.trial${trial}` : "";
    const trialLabel = trials > 1 ? `${label} [trial ${trial}]` : label;

    const projectDir = mkdtempSync(join(tmpdir(), `eval-${spec.suite}-${entry.id}-`));
    spawnSync({ cmd: ["git", "init", "-q"], cwd: projectDir });
    writeFixture(entry, projectDir);

    const { resultText, transcript, ok } = runAgent(entry.prompt, projectDir, budget);
    const projectCopy = join(evalDir, `project${suffix}`);
    cpSync(projectDir, projectCopy, { recursive: true });
    writeFileSync(join(evalDir, `transcript${suffix}.txt`), transcript);

    if (!ok) {
      fail(`${trialLabel} completed`, `agent run failed; see ${evalDir}`);
      continue;
    }
    pass(`${trialLabel} completed`);
    checkAssertions(entry, trialLabel, resultText, projectCopy);

    if (isRouting) {
      const routing = entry.routing ?? {};
      const missing = (routing.expect ?? []).filter((needle) => !includesCI(resultText, needle));
      const present = (routing.forbid ?? []).filter((needle) => includesCI(resultText, needle));
      const correct = missing.length === 0 && present.length === 0;
      if (correct) routingCorrectCount++;
      console.log(`  route ${trialLabel}: ${correct ? "correct" : `wrong (missing: ${missing.join(", ") || "none"}; forbidden: ${present.join(", ") || "none"})`}`);
      continue;
    }

    if (expectations.length === 0) continue;
    const score = judge(transcript, expectations);
    if (score === null) {
      fail(`${trialLabel} expectations judged`, `judge output unparseable; see ${evalDir}`);
      continue;
    }
    console.log(`  judge ${trialLabel}: ${score}%`);
    trialScores.push(score);
  }

  if (isRouting) {
    routingCasesTotal++;
    routingTotalTrials += trials;
    routingCorrectTrials += routingCorrectCount;
    const passedCase = routingCorrectCount * 2 > trials; // strict majority
    const routeLabel = `${label} routing ${routingCorrectCount}/${trials}`;
    if (passedCase) {
      pass(routeLabel);
      routingCasesPassed++;
    } else {
      fail(routeLabel, "majority of trials routed wrong");
      if (entry.routing?.overblock_guard) overBlocked++;
    }
    if (routingCorrectCount > 0 && routingCorrectCount < trials) flakyCases.push(`${label} (${routingCorrectCount}/${trials})`);
    return;
  }

  if (expectations.length === 0) return;
  if (trialScores.length === 0) {
    fail(`${label} expectations >= ${scoreThreshold}%`, "no parseable judge scores");
    return;
  }
  const avg = Math.round(trialScores.reduce((sum, s) => sum + s, 0) / trialScores.length);
  console.log(`  judge ${label}: ${avg}% (avg over ${trialScores.length} trial(s))`);
  avg >= scoreThreshold ? pass(`${label} expectations >= ${scoreThreshold}%`) : fail(`${label} expectations >= ${scoreThreshold}%`, `${avg}%`);
}

console.log("=== behavioral evals (model-backed) ===");
console.log(`Specs: ${specsDir}  |  Artifacts: ${outDir}  |  Threshold: ${scoreThreshold}%  |  Trials: ${trials}`);
if (!which("claude")) {
  console.error("FAIL: the `claude` CLI is not on PATH");
  process.exit(1);
}

const specs = findSpecs(specsDir);
if (specs.length === 0) {
  console.error(`FAIL: no *.evals.json specs found under ${specsDir}`);
  process.exit(1);
}
for (const specFile of specs) {
  const spec = JSON.parse(readFileSync(specFile, "utf8")) as EvalSpec;
  if (skillFilter && spec.suite !== skillFilter) continue;
  for (const entry of spec.evals) {
    if (idFilter && entry.id !== idFilter) continue;
    runEval(spec, entry);
  }
}

if (routingCasesTotal > 0) {
  console.log(`\nRouting accuracy: ${routingCorrectTrials}/${routingTotalTrials} trials (${routingCasesPassed}/${routingCasesTotal} cases passed)`);
  console.log(`Over-blocked: ${overBlocked}`);
  console.log(flakyCases.length > 0 ? `Flaky routing (mixed agreement): ${flakyCases.join(", ")}` : "Flaky routing (mixed agreement): none");
}
console.log(`\nPassed: ${passed}  Failed: ${failed}`);
if (failed > 0) console.log(`Failures: ${fails.join(", ")}`);
process.exit(failed > 0 ? 1 : 0);
