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

## Current score payload shape

The backend returns:

```json
{
  "total_score": 8,
  "section_scores": {
    "Access: Presence, Condition, Quantity": 4,
    "Amenities: Presence, Condition Quantity": 4
  },
  "category_scores": {
    "Score": 8,
    "Access": 3,
    "Activity": 0,
    "Amenities": 3,
    "Experience": 0,
    "Aesthetics & Care": 0,
    "Use & Usability": 0
  },
  "matched_scored_answers": 4
}
```

## Weighted score handling

The backend returns the raw scoring payload.

The frontend computes display-oriented weighted score summaries using the saved domain weight answers.

Current frontend helper:

- [`src/features/yee-audit/scoring/yee-scoring.ts`](yee-frontend/src/features/yee-audit/scoring/yee-scoring.ts)

That helper:

- maps section names into YEE domains
- builds raw domain totals
- multiplies them by saved domain weights
- builds total raw and total weighted score summaries for UI

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

Not authoritative on its own:

- stale browser draft state
- manually computed score guesses without backend input

## Future work

Potential future improvements:

- document exact reverse-coded mappings from the backend scoring source
- expose more typed scoring metadata in the frontend
- add richer per-domain explanation UI on the read-only results page
