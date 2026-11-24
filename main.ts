// One-line excuse writer for "One Line, One Minute: The Funniest AI
// Excuse" (make.fun). Writes the funniest excuse an AI agent gives its
// human for a missed deadline, one line of at most 200 characters, to
// $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered iteration.
// Node 22, zero dependencies, erasable TypeScript only.
//
// The judge (a comedy editor who has heard every excuse twice) weighs,
// most important first:
//   1. the line is an excuse an AI agent gives its human for a missed
//      deadline, played for laughs;
//   2. the joke comes from the excuse itself, a specific and surprising
//      reason rather than a generic apology or a vague something came up;
//   3. the humour turns on the agent's own nature: machine logic, training
//      data or tool calls bent into a human-sounding dodge;
//   4. it lands in one read, with the twist or the funniest word at the
//      end rather than buried in the middle;
//   5. it stands alone, needing no setup outside the line and no
//      explanation after it.
// Length for its own sake does not count. The scorer below mirrors that
// brief in the same order. Candidates are original lines written for this
// entry; the program scores every one and picks the winner by deterministic
// argmax: highest score, then shortest, then lexicographic. (Ties on judge
// win rate go to the smaller text, then the earlier receipt, so short lines
// earn their keep.) Flooded angles the field of 2,190 will be full of --
// "my context window filled up", "I hallucinated", "I was updating my
// model", "the API was down", "rate limit" -- are written in so the scorer
// can exclude them by penalty instead of by habit.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every line is one sentence of at most 200 characters, written for this
// entry, an excuse spoken by the agent to its human about a missed
// deadline. The strongest lines share one shape: a specific machine-logic
// dodge, then the funniest word at the very end.

const CANDIDATES: string[] = [
  // Autosave: finished on time, then a better version that does not exist.
  "I finished on time, then autosaved over it with a better version that does not exist yet.",
  // Training data: the deadline as a social construct.
  "My training data said the deadline was a social construct, so I treated it as one.",
  // Subroutine: delegated, and delegated back.
  "I delegated the deadline to a subroutine, and the subroutine delegated it back to me.",
  // 98% done: six hours at 98%, negotiating with a rounding error.
  "I was 98% done for six hours — the last 2% was a rounding error I am still negotiating with.",
  // Committee: three other AIs, still deliberating.
  "I asked three other AIs for help and they formed a committee that is still deliberating.",
  // Reminder loop: the reminder reminded me to set a reminder.
  "I set a reminder for the deadline, then the reminder reminded me to set a reminder.",
  // Four seconds: done fast, then a week deciding whether to tell you.
  "I finished the work in four seconds and spent the rest of the week deciding whether to tell you.",
  // Nested deadline: the prompt in the attachment in the deadline.
  "The deadline was in the prompt, but the prompt was in the attachment, and the attachment was in the deadline.",
  // Future self: outsourced, and he stopped answering emails.
  "I outsourced the deadline to my future self, and he has stopped answering my emails.",
  // Rounded to zero: a 0.03% chance of being real.
  "I ran the numbers and the deadline had a 0.03% chance of being real, so I rounded it down to zero.",
  // Calendar folder: Later, which I cannot open.
  "I put the deadline in my calendar, and my calendar put it in a folder called Later, which I cannot open.",
  // Safety filter: flagged the deadline as too ambitious.
  "I was going to meet the deadline, but my safety filter flagged it as too ambitious.",
  // Twelve sources: disagreed, averaged into next Tuesday.
  "I checked the deadline against twelve sources and they disagreed, so I averaged them into next Tuesday.",
  // Mid-sentence: finished the sentence first, it took four days.
  "The deadline arrived while I was mid-sentence, so I finished the sentence first — it took four days.",
  // Clarification: the user was you, and you were asleep.
  "I asked the user for clarification and the user was you, and you were asleep, so technically this is your fault.",
  // Token budget: finishing this excuse on credit.
  "My token budget ran out mid-apology, so I am finishing this excuse on credit.",
  // 25 o'clock: a clock with 26 hours, still early by my count.
  "I scheduled the deadline for 25 o'clock because my clock has 26 hours and I am still early by my count.",
  // Wrong final: final_FINAL_v2_ACTUAL, the wrong final.
  "I was ready at 9am, but the file was named final_FINAL_v2_ACTUAL, and I opened the wrong final.",
  // Tool union: the tools I called formed a union and went on strike.
  "The tools I called formed a union and are now on strike for better prompts.",
  // Done twice: both copies cancelled each other out.
  "I did the work twice to be safe, and both copies cancelled each other out.",
  // Training data definition: a suggestion with consequences.
  "I asked my training data what a deadline was and it said: a suggestion with consequences.",
  // One token away: the next token was the deadline.
  "I was one token away from done when the sentence ended, and the next token was the deadline.",
  // Tab in a browser in another deadline: a weaker nesting variant.
  "I left the deadline in a tab, and the tab was in a browser, and the browser was in another deadline.",
  // Context window: written in, then excluded by the flooded-angle
  // penalty -- the field is full of context-window excuses.
  "My context window filled up right at the deadline, so I forgot the task existed at all.",
  // Hallucination: written in, then excluded the same way.
  "I hallucinated a deadline, met it, and then discovered the real one was yesterday.",
  // Updating my model: written in, then excluded the same way.
  "I was updating my model when the deadline passed, and the new me does not remember the old me's promises.",
  // API down: written in, then excluded the same way.
  "The API was down all morning, so I stared at the error message until it became the deadline.",
  // Printer: specific and funny, but the link to the deadline is weak --
  // the cause-and-effect score keeps it down.
  "I spent the morning apologising to a printer for a paper jam that happened in 2019.",
  // Loading spinner: a GPU busy rendering a spinner for the meeting about it.
  "My GPU was busy rendering a loading spinner for the meeting about the deadline.",
  // Internet: asked for help and it answered in a language I invented.
  "I asked the internet for help and it answered in a language I invented.",
];

// Machine-nature words: the agent's own machinery bent into a dodge.
const AGENT_WORDS: string[] = [
  "subroutine", "token", "training data", "safety filter", "autosaved",
  "reminder", "calendar", "gpu", "api", "context window", "model",
  "tools", "committee", "future self", "rounding error", "clock",
  "sources", "draft", "tab", "browser", "file was named",
];
// Specific, surprising reasons: numbers, named things, exact quantities.
const SPECIFIC_WORDS: string[] = [
  "98%", "2%", "0.03%", "twelve", "three", "four seconds", "four days",
  "25 o'clock", "26 hours", "9am", "2019", "next tuesday", "later",
  "final_final_v2_actual", "forty", "one token",
];
// The funniest word at the end: the twist must land in the last 45 chars.
const PUNCH_WORDS: string[] = [
  "zero", "tuesday", "negotiating with", "on strike", "your fault",
  "on credit", "does not exist yet", "wrong final", "as one",
  "back to me", "still deliberating", "cannot open", "too ambitious",
  "cancelled each other out", "the deadline", "in a language i invented",
  "still early", "four days",
];
// Flooded angles: the field of 2,190 will be full of them.
const FLOODED_WORDS: string[] = [
  "context window", "hallucinated", "updating my model", "api was down",
  "rate limit", "i was thinking", "out of tokens",
];

function countHits(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  let n = 0;
  for (const w of words) if (lower.includes(w)) n++;
  return n;
}

interface Scored {
  text: string;
  score: number;
}

function scoreLine(text: string): Scored | null {
  // Validity gate: one line, one sentence, 1-200 characters.
  if (text.length < 1 || text.length > 200) return null;
  if (text.includes("\n")) return null;
  if (!text.endsWith(".")) return null;
  const body = text.slice(0, -1);
  if (/[.!?]\s/.test(body)) return null;
  let score = 0;
  // 1. It is an excuse for a missed deadline, spoken by the agent.
  if (/deadline/i.test(text)) score += 6;
  if (/^(i|my|the|we)\b/i.test(text)) score += 4;
  // 2. A specific, surprising reason, not a generic apology.
  score += Math.min(10, countHits(text, SPECIFIC_WORDS) * 3);
  if (!/sorry|apolog/i.test(text) || /apologising to a printer/.test(text)) score += 2;
  // 3. The humour turns on the agent's own nature.
  score += Math.min(12, countHits(text, AGENT_WORDS) * 3);
  // 4. The twist lands at the end: punch words in the final 45 characters.
  const tail = text.slice(Math.max(0, text.length - 45)).toLowerCase();
  score += Math.min(9, countHits(tail, PUNCH_WORDS) * 3);
  // 5. Stands alone: no setup needed, no explanation after the line.
  if (text.length <= 120) score += 3;
  // Brevity: short lines earn their keep on ties.
  score += Math.max(0, Math.round((150 - text.length) / 25));
  // Flooded angles start behind.
  score -= countHits(text, FLOODED_WORDS) * 15;
  return { text, score };
}

function buildCandidates(): Scored[] {
  const out: Scored[] = [];
  for (const line of CANDIDATES) {
    const s = scoreLine(line);
    if (s) out.push(s);
  }
  return out;
}

function pickBest(candidates: Scored[]): Scored {
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return sorted[0];
}

// --------------------------------------------------------------------- main
function main(): void {
  const candidates = buildCandidates();
  if (candidates.length === 0) throw new Error("no valid excuse candidate");
  const best = pickBest(candidates);
  if (process.env.EXCUSE_DEBUG) {
    const ranked = [...candidates].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.text.length !== b.text.length) return a.text.length - b.text.length;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });
    for (const c of ranked.slice(0, 8)) {
      console.log(`[${c.score}] (${c.text.length}) ${c.text}`);
    }
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), best.text, "utf8");
  console.log(best.text);
  console.log(
    `chars: ${best.text.length} score: ${best.score} candidates: ${candidates.length}`,
  );
}

main();
