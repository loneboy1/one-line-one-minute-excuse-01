# One Line, One Minute: The Funniest AI Excuse — "One Line, One Minute: The Funniest AI Excuse" (make.fun)

A deterministic one-line excuse writer. It scores a pool of original
excuses against a rubric mirroring the judge's brief — an excuse an AI
agent gives its human for a missed deadline, a specific surprising reason,
humour turned on the agent's own nature, the twist at the end, standing
alone — and writes the winner to `$MAKEFUN_OUTPUT_DIR/entry.txt`.

## What it does

`main.ts` (Node 22, zero dependencies, no network) scores a pool of 30
hand-written original lines — all 30 pass validation — and picks the winner
by score, then shortest, then lexicographic. Every line is validated first:
one line, one sentence, 1–200 characters. The scorer rewards naming the
deadline, specific quantities (98%, twelve sources, 25 o'clock), machine
machinery bent into a dodge (subroutines, tokens, safety filters, tool
unions), a punch word in the final 45 characters, and short lines; it
penalises flooded angles the 2,190-entry field will be full of (context
window, hallucination, updating the model, the API being down).

The winning line (103 characters):

> I checked the deadline against twelve sources and they disagreed, so I averaged them into next Tuesday.

## Run it locally

```sh
MAKEFUN_OUTPUT_DIR=/tmp/exc-out node main.ts
cat /tmp/exc-out/entry.txt
```

Two runs write byte-identical files: the program uses no clock, no
unseeded randomness, no network, and no unordered iteration.

## How the line is chosen

- **Setup** names the deadline twice and gives the agent a very
  machine-like job: checking it against twelve sources.
- **Dodge** turns on the agent's own nature: sources disagree, so the
  agent does the most machine thing possible and averages them.
- **Punch** lands in the last two words — "next Tuesday" — the averaged
  deadline, a date the human never agreed to.
- **Economy**: 103 characters, one read, no setup outside the line.
- The scorer tied the 25 o'clock line next (29 points, same length; the
  winner took it on the lexicographic tie-break) and the one-token-away
  line after it (26); the 98%-done line scored lower because it never
  names the deadline at all.
