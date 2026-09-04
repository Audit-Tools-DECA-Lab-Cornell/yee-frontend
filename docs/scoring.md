# YEE Scoring

## Purpose

This document explains how YEE scoring is currently wired through the frontend and backend.

The backend is the scoring authority. The frontend does not invent or persist final score logic on its own.

## Scoring flow

### 1. Instrument data

The backend exposes YEE instrument metadata and scoring information through:

- `GET /yee/instrument`

The frontend accesses that through:

- `/api/yee/instrument`

### 2. Score preview

Before submission, the frontend can request score preview through:

- `/api/yee/audits/score`

The backend contract requires:

- `place_id`
- `participant_info`
- `responses`

Current frontend helper:

- [`src/features/yee-audit/scoring/yee-scoring.ts`](yee-frontend/src/features/yee-audit/scoring/yee-scoring.ts)

### 3. Final submission

Submission uses:

- `/api/yee/audits`

The backend computes and stores:

- total score
- section scores
- category scores
- matched scored answer count

### 4. Read-only results

Submitted results are fetched by submission id and rendered on the locked results page.

## Current score payload

The backend returns raw and youth-weighted totals, domain values, and their
canonical maxima. It also returns the stored canonical snapshot used to derive
those flattened fields.

Important flattened fields include:

- `total_raw_score` and `total_raw_maximum`
- `raw_domain_scores` and `raw_domain_maximums`
- `total_weighted_score` and `total_weighted_maximum`
- `weighted_domain_scores` and `weighted_domain_maximums`

The maxima belong to the audit's stamped scoring contract. The frontend must
not substitute a fixed denominator or recompute a historical maximum from the
currently active instrument.

## Percentage-first display

Human-readable score surfaces use the percentage as the primary value and the
raw fraction as secondary context:

- `74%`
- `90 / 122`

`src/lib/score-format.ts` owns percentage validation, clamping, rounding, and
plain-text formatting. A missing, non-finite, zero, or negative maximum renders
as unavailable (`—`), never as a fabricated `0%`.

For a group of audits:

- average each valid audit's own percentage
- show an average fraction only when every included audit shares the same positive maximum
- exclude audits with unavailable maxima from the percentage mean

This keeps comparisons honest when selected audits use different instrument
versions.

## YEE domain order in the frontend

Current domain keys:

- `access`
- `activitySpaces`
- `amenities`
- `experienceOfSpace`
- `aestheticsAndCare`
- `useAndUsability`

## Draft vs submitted score usage

### Draft / review

The review page uses score preview against the backend-backed draft responses.

### Submitted

The submitted read-only report uses the saved submission payload returned by:

- `/api/yee/audits/[submissionId]`

## Important implementation detail

The frontend should never call the score preview endpoint with only `responses`.

The current correct request shape includes `place_id`, because the backend preview endpoint uses the same request model as submission.

## What is and is not authoritative

Authoritative:

- backend response from score preview
- backend response from final submission
- backend response from submitted audit fetch
- backend canonical maxima returned by dashboard, comparison, and auditor-list endpoints

Not authoritative on its own:

- stale browser draft state
- manually computed score guesses without backend input
- fixed client-side maximum constants
- maxima derived from the currently active instrument for a historical audit

## Future work

Potential future improvements:

- document exact reverse-coded mappings from the backend scoring source
- add richer per-domain explanation UI on the read-only results page
