# YEE Admin - Instrument Management Fix Plan

**Owner:** `yee-frontend`
**Route:** `/admin/instruments`
**Blast radius:** single client; no backend, migration, scoring, or mobile changes in this pass
**Priority:** Phase A fixes the three client-reported defects. Phase B completes the editor safety and hierarchy work.

**Status (2026-08-21):** Phase A and Phase B are both implemented and uncommitted.
`tsc --noEmit` clean, `eslint` 0 errors (one pre-existing unrelated warning in
`analytics-provider.tsx`), 37/37 unit tests pass, and both Playwright specs
compile (`--list`). **`pnpm build` could not be verified in this sandbox** -
Turbopack fails with `binding to a port / Operation not permitted`, and the
`--webpack` fallback does not finish; run it on a normal machine. Live browser
QA and screenshot capture also still need the local backend.

## Goal

Make the YEE instrument editor safe and understandable: normal typing must preserve what the admin enters, matrix questions and answer options must be represented correctly, and COPA-only scale guidance must disappear from every admin surface.

## Acceptance criteria

- Multi-word text, repeated spaces, line breaks, and existing markup survive edit → render → save without silent normalization.
- Each scoring item shows its shared prompt, `choices` as question rows, and `answers` as answer options; blank display strings remain editable.
- The editor never exposes controls that add, remove, or rename `choices`/`answers` keys or modify `score_entries`.
- No Scale Guidance tab, metric, hero stat, editor, or read-only panel remains in the YEE admin UI.
- Sections have an obvious section → item → field hierarchy, with empty sections explained rather than rendered as bare headings.
- Invalid JSON, unsaved changes, duplicate draft labels, and structured publish failures all produce actionable feedback.

## Evidence reviewed on 2026-08-21

The deployed page at `https://yee-frontend.vercel.app/admin/instruments` was exercised with the supplied demo admin account. No version was saved, published, activated, or deleted.

- The live version list contains active and inactive versions both labelled `1-draft`.
- “Open current version” and “Create new draft” open the same content with the same label.
- The Sections tab renders actual questions as `Choice N` and has no answer-option fields.
- `QID1#1` shows the transport-stop and sidewalk prompts as choices, but its Yes/No answers are absent.
- The Scale Guidance tab and counts are present and contain Provision / Variety / Challenge-style copy.
- Pressing Space and then the next character in a controlled section-title field produces `...InfoX`, confirming that the trailing space was removed during re-render.
- Closing the editor after a local edit discards the edit immediately, with no confirmation.

## Confirmed root causes

### 1. Controlled inputs sanitize on every render

`src/features/admin/instruments/utils.tsx` defines `cleanInstrumentText()` with whitespace collapsing and a final `.trim()`. The light editors pass that transformed string back to controlled `value` props while their `onChange` handlers store raw text. A trailing space is therefore removed before the next character arrives.

The same helper strips HTML. Running it while editing creates an asymmetric round trip: untouched fields retain raw markup in JSON, while a touched field can be replaced with presentation-only plain text.

**Decision:** sanitization is for read-only presentation only. Do not normalize the draft on load or on save. The earlier normalize-on-load proposal is rejected because it would rewrite every untouched field when an admin saves one unrelated change.

### 2. Qualtrics matrix fields are interpreted backwards

For YEE scoring items:

- `question_text` is the shared stem/instruction.
- `choices` contains the matrix rows - the questions an auditor answers.
- `answers` contains the selectable answer labels.

The mobile normalizer already implements this contract in `yee-mobile/lib/yee-mobile-instrument.ts`: it maps `choices` to questions and `answers` to answers. The admin helper currently labels `choices` as `Choice N`, omits `answers`, and sometimes drops the shared prompt or blank displays.

### 3. Scale Guidance is a dead COPA/Playspace carry-over

The backend instrument snapshot contains `scale_guidance` with Provision / Variety / Challenge rules. No YEE auditor flow reads it. Current readers are limited to the frontend admin feature plus the backend response schema and committed JSON snapshot.

**Decision:** remove it from the frontend admin UI only. Preserve the raw key in the JSON payload for this pass; backend/schema/active-instrument cleanup is a separate contract change.

### 4. Publish error detail is discarded below the toast layer

The backend returns a 409 with `detail.message` and `detail.scoring_compatibility`. `proxyRequest()` forwards that JSON, but `authedFetch()` converts object-shaped `detail` into the generic `Error("Request failed.")`. The mutation callback cannot recover data that has already been discarded.

**Decision:** retain the response status and parsed payload in a typed client error before formatting the toast. Do not attempt to parse the body only in `createMutation.onError`.

## Files expected to change

```text
src/lib/api/client.ts
src/features/workspaces/api/live-api.ts
src/features/yee-audit/config/yee-domain-theme.ts
src/features/admin/instruments/
  constants.ts
  types.ts
  utils.tsx
  shared-components.tsx
  instrument-editor.tsx
  instruments-admin-client.tsx
  instrument-content-viewer.tsx
  editors/section-text-editor.tsx
  editors/preamble-editor.tsx
  editors/pre-audit-editor.tsx
  editors/legal-documents-editor.tsx
  editors/scale-guidance-editor.tsx        # delete
  editors/audit-copy-editor.tsx            # add in Phase B
tests/unit/instrument-editor-utils.spec.ts
tests/e2e/admin-management.spec.ts
tests/visual/catalog/admin.ts
```

## Implementation plan

### Phase A - client-reported defects

### 1. Preserve draft text exactly

1. Remove `cleanInstrumentText(...)` from every controlled `value` in the light editors and from editable-entry values.
2. Bind inputs to the raw draft string, using only `?? ""` for missing optional fields.
3. Keep `cleanInstrumentText()` in read-only summaries, spreadsheet previews, headings, and the version viewer where no value is written back.
4. Do **not** add `normalizeInstrumentContent()`. Opening and saving an otherwise untouched instrument must preserve a deep-equal payload.
5. Give every question textarea a real accessible label association; the current bare `<Label>` beside an unlabeled `<Textarea>` is not sufficient.

### 2. Model shared prompts, questions, and answer options explicitly

Replace the ambiguous `getEditablePromptEntries()` contract with grouped entries whose target is explicit:

```text
Item: QID1#1 · presence · Matrix
├─ Shared prompt        → question_text
├─ Questions (2)        → choices[choiceId].Display
└─ Answer options (2)   → answers[answerId].Display
```

Implementation rules:

1. Return a discriminated target such as `sharedPrompt | question | answerOption`, plus the existing map key and display ordinal.
2. Always render the shared prompt field, even when empty. Treat the known authoring placeholder as an empty UI value without mutating the stored value until the admin edits it.
3. Render every existing `choices` and `answers` entry, including an empty `Display`; use placeholders for guidance instead of filtering the entry out.
4. Update only the selected `Display` string. Never expose key add/delete/reorder controls and never modify `score_entries`.
5. Apply the same vocabulary to `QuestionPreview`: “Questions” for `choices`, “Answer options” for `answers`.

### 3. Remove Scale Guidance from admin surfaces

Delete the Scale Guidance editor and viewer panel, then remove its tab key, TypeScript view types, summary count, metric card, hero stat, and tab counts.

Do not delete or normalize `content.scale_guidance`. The JSON editor must continue to round-trip unknown keys unchanged.

### Phase B - complete the editor safely

### 4. Rebuild the Sections tab around the real hierarchy

The current page renders all section-copy cards first and all question cards again below them, making each section appear twice. Replace those two passes with one card per section:

```text
Section card
├─ title / instructions / comment prompt
├─ scoring item
│  ├─ shared prompt
│  ├─ questions
│  └─ answer options
└─ next scoring item
```

Use the existing `yeeDomainThemes` literal classes; do not create a second color palette or dynamically construct Tailwind class names.

1. Add a pure block-to-theme lookup beside the existing domain-theme mapping, reusing the `getBlockMatch()` semantics for “Experience of Space”.
2. Use a recessed tab panel, raised section cards, a domain-colored left rail/header tint, inset field groups, and `focus-within` on the active item.
3. Make sections collapsible with the first section expanded by default. Toggles require `aria-expanded` and `aria-controls`.
4. Add an `xl` section index using anchor links; keep it sticky to the page, not inside a new nested scroll container.
5. Render a neutral, dashed empty state for sections with no scoring items, explaining that the section contains copy/context but no scored questions.

### 5. Add the missing Audit Copy tab

Add typed frontend views for `weighting`, `condition_prompt`, and `final_comments_prompt`, matching the existing backend schema.

The tab edits only:

- weighting title and description;
- existing weighting option labels;
- the six existing domain prompts, preserving their keys and order;
- `condition_prompt` and `final_comments_prompt`.

Do not add/remove weighting options or domains. These fields are consumed by the auditor experience, so the same key-preservation rule applies.

### 6. Fix state, validation, and version flow

1. Extend the existing `ApiError` (or introduce an equivalent typed error) to retain `status` and parsed response payload. Make `authedFetch()` throw it for all non-2xx responses.
2. For the instrument-create 409, format `detail.message` plus the missing item IDs/labels from `detail.scoring_compatibility`. Keep a safe fallback for other errors.
3. Derive a JSON parse error from `editorValue`; when invalid, open the advanced editor automatically, keep the existing inline banner, and place a visible reason beside the disabled Save button.
4. Track dirtiness across JSON content and version label. Guard Close and `beforeunload`; do not warn after a successful save.
5. Replace the duplicate top-level actions with one “Create new draft” action. Version-history “Edit” remains.
6. Replace `toDraftLabel()` with a collision-aware helper using the loaded version labels (`1-draft`, `1-draft-2`, ...). Existing duplicate rows remain unchanged.

## Test obligation

The repo uses Playwright Test for both unit and browser tests; there is no Vitest dependency.

### Unit - `tests/unit/instrument-editor-utils.spec.ts`

- Editable entry construction maps `choices` to questions and `answers` to answer options for presence and condition items.
- Shared prompts and empty `Display` values remain represented.
- Updating each entry changes only its `Display`/`question_text`; keys and `score_entries` remain deep-equal.
- Draft opening/saving helpers preserve an untouched payload, including HTML, repeated spaces, and line breaks.
- Collision-aware draft labels skip every existing label.
- Instrument summaries no longer expose Scale Guidance.
- Structured API errors preserve the 409 payload and format scoring-compatibility detail.

Run:

```bash
cd /Users/praty/Desktop/StudentJob.nosync/yee/yee-frontend
pnpm exec playwright test tests/unit/instrument-editor-utils.spec.ts --project=unit --workers=1
```

### E2E - extend `tests/e2e/admin-management.spec.ts`

- Open a draft and press keys one at a time in a section title; assert spaces, double spaces, and line breaks persist after React re-renders.
- Assert `QID1#1` shows Questions containing the two matrix rows and Answer options containing Yes/No.
- Assert `QID1#2` shows its shared prompt, question rows, and Poor/Acceptable/Great answers.
- Assert Scale Guidance is absent from the page and viewer.
- Change a field and close; assert the confirmation appears, then cancel and confirm both paths.
- Feed invalid JSON and assert the advanced editor opens with an actionable Save explanation.
- Mock the create request to return the real 409 shape; assert the UI names the incompatible items without publishing anything.

These browser cases require the normal local YEE backend used by the existing admin suite. They must not create or publish a production instrument.

### Visual catalog - `tests/visual/catalog/admin.ts`

Add editor states for Sections expanded, Sections collapsed, and Audit Copy. `catalog.spec.ts` runs under `screenshots-chromium`, not `visual-chromium`.

Compile/list check:

```bash
pnpm exec playwright test tests/visual/catalog.spec.ts --project=screenshots-chromium --list
```

Write local captures only when the local backend is available:

```bash
pnpm screenshots:web
```

### Final verification

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm exec playwright test tests/e2e/admin-management.spec.ts --project=admin-chromium --workers=1
pnpm exec playwright test tests/visual/catalog.spec.ts --project=screenshots-chromium --list
```

Manual QA must cover the acceptance criteria on `/admin/instruments` with a disposable local draft. Saving, publishing, activating, or deleting a deployed version requires a separate explicit approval.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Scoring shape changes | Edit `Display`/prompt strings only; assert keys and `score_entries` are unchanged. |
| Whole-document content loss | Never normalize draft content on load or save; add deep-equality regression coverage. |
| Tailwind omits domain classes | Reuse literal class strings already present in `yeeDomainThemes`. |
| Error UI depends on lost payload | Preserve parsed payload in the fetch layer before toast formatting. |
| E2E mutates shared data | Type without saving and mock the 409 create response. |
| Existing duplicate version labels | Generate unique labels prospectively; do not rename historical rows. |

## Out of scope

- Removing `scale_guidance` from the backend schema, committed instrument JSON, or live database.
- Publishing, activating, deleting, or force-publishing any deployed instrument version.
- Database uniqueness constraints for instrument-version labels.
- Adding/removing/reordering matrix rows, answer keys, scoring entries, weighting domains, or weighting options.
- Mobile code changes, scoring changes, and copy-editing the instrument’s research content.

## Documentation handoff

This file already lives at `yee-frontend/docs/instruments-admin-fixes-PLAN.md`; do not copy it elsewhere.

`yee/WORKSTATE.md` currently describes the frontend Scale Guidance removal as already shipped even though the code is unchanged. The implementing pass must correct that status before work begins, then mark the UI removal complete only after the code and required checks pass. Keep the backend cleanup as a separate future task and treat it as a cross-repo contract change.
