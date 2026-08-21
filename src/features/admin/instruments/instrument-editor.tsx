"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { DETAIL_TABS } from "./constants";
import { AuditCopyEditor } from "./editors/audit-copy-editor";
import { LegalDocumentsEditor } from "./editors/legal-documents-editor";
import { PreAuditEditor } from "./editors/pre-audit-editor";
import { PreambleEditor } from "./editors/preamble-editor";
import { SectionTextEditor } from "./editors/section-text-editor";
import { SpreadsheetView } from "./editors/spreadsheet-view";
import { MetricRow, TabBar, type UpdateDraft } from "./shared-components";
import type { DetailTabKey, StructuredInstrumentContent } from "./types";
import { summarizeInstrument } from "./utils";

type InstrumentEditorProps = Readonly<{
	/** Initial draft content as a pretty-printed JSON string. */
	initialJson: string;
	version: string;
	instrumentKey: string;
	isPending: boolean;
	onSave: (version: string, content: Record<string, unknown>, activate: boolean) => void;
	onCancel: () => void;
}>;

/**
 * Tabbed draft editor. The JSON string is the single source of truth so the
 * light per-tab editors and the advanced JSON editor never drift apart
 * (mirrors the original `updateEditor` flow).
 */
export function InstrumentEditor({
	initialJson,
	version,
	instrumentKey,
	isPending,
	onSave,
	onCancel
}: InstrumentEditorProps) {
	const tabsId = React.useId();
	const [editorValue, setEditorValue] = React.useState(initialJson);
	const [draftVersion, setDraftVersion] = React.useState(version);
	const [activeTab, setActiveTab] = React.useState<DetailTabKey>("preamble");
	const [activateOnCreate, setActivateOnCreate] = React.useState(false);
	const [showAdvancedEditor, setShowAdvancedEditor] = React.useState(false);
	const [confirmingClose, setConfirmingClose] = React.useState(false);

	/**
	 * Parse once and keep the failure reason, so an unparseable draft can say why
	 * it is unparseable. Without the reason the tab editors would drop every
	 * keystroke with no explanation and the admin would type into a dead form.
	 */
	const parseResult = React.useMemo<{ content: StructuredInstrumentContent | null; error: string | null }>(() => {
		if (!editorValue.trim()) return { content: null, error: "The instrument JSON is empty." };
		try {
			return { content: JSON.parse(editorValue) as StructuredInstrumentContent, error: null };
		} catch (error) {
			return { content: null, error: error instanceof Error ? error.message : "The JSON could not be parsed." };
		}
	}, [editorValue]);
	const parsed = parseResult.content;
	const parseError = parseResult.error;

	// Invalid JSON is only fixable in the advanced editor, so force it open
	// rather than leaving the admin to discover a collapsed panel on their own.
	// Derived, not an effect — the panel must already be open on the render that
	// first reports the error.
	const advancedEditorOpen = showAdvancedEditor || Boolean(parseError);

	const isDirty = editorValue !== initialJson || draftVersion !== version;

	// Browser-level guard. In-app closing is handled by ConfirmDialog below.
	React.useEffect(() => {
		if (!isDirty) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [isDirty]);

	const update = React.useCallback<UpdateDraft>(
		mutator => {
			setEditorValue(current => {
				try {
					const draft = JSON.parse(current || "{}") as StructuredInstrumentContent;
					mutator(draft);
					return JSON.stringify(draft, null, 2);
				} catch {
					return current;
				}
			});
		},
		[setEditorValue]
	);

	const summary = summarizeInstrument((parsed as Record<string, unknown> | null) ?? null);

	function handleSave() {
		let content: Record<string, unknown>;
		try {
			content = JSON.parse(editorValue) as Record<string, unknown>;
		} catch {
			return;
		}
		onSave(draftVersion.trim(), content, activateOnCreate);
	}

	function handleRequestClose() {
		if (isDirty) setConfirmingClose(true);
		else onCancel();
	}

	const versionError = draftVersion.trim().length === 0 ? "Give this version a label before saving." : undefined;
	const canSave = !isPending && draftVersion.trim().length > 0 && parsed !== null;
	const saveBlockedReason = parseError
		? "Fix the JSON in the advanced editor before saving."
		: versionError
			? "Give this version a label before saving."
			: null;

	return (
		<Card>
			<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-2">
					<CardTitle>Edit draft version</CardTitle>
					<CardDescription>
						Update wording across the tabs below, then save a new draft or publish it immediately. Changes
						save into the version you create here — nothing is published until you save.
					</CardDescription>
				</div>
				<div className="flex items-center gap-3">
					{isDirty ? (
						<span className="text-sm text-muted-foreground" aria-live="polite">
							Unsaved changes
						</span>
					) : null}
					<Button type="button" variant="outline" onClick={handleRequestClose} disabled={isPending}>
						Close editor
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid gap-4 md:grid-cols-2">
					<Field
						label="Version label"
						htmlFor="instrument-version"
						required
						error={versionError}
						description="A short, human-readable name — e.g. spring-2026 or janet-review-1.">
						<Input
							id="instrument-version"
							value={draftVersion}
							onChange={event => setDraftVersion(event.target.value)}
							placeholder="spring-2026"
						/>
					</Field>
					<Field label="Instrument key" htmlFor="instrument-key" description="Fixed for the YEE instrument.">
						<Input
							id="instrument-key"
							value={instrumentKey}
							readOnly
							className="bg-muted text-muted-foreground"
						/>
					</Field>
				</div>

				<MetricRow summary={summary} />

				<TabBar
					tabs={DETAIL_TABS}
					active={activeTab}
					onChange={setActiveTab}
					idBase={tabsId}
					counts={{
						sections: summary.sections,
						preAudit: summary.preAuditQuestions,
						legalDocuments: summary.legalDocuments
					}}
				/>

				<div
					id={`${tabsId}-panel`}
					role="tabpanel"
					aria-labelledby={`${tabsId}-tab-${activeTab}`}
					className="rounded-md border border-border bg-muted p-4">
					{parsed ? (
						<>
							{activeTab === "preamble" ? <PreambleEditor content={parsed} update={update} /> : null}
							{activeTab === "sections" ? <SectionTextEditor content={parsed} update={update} /> : null}
							{activeTab === "spreadsheet" ? <SpreadsheetView content={parsed} /> : null}
							{activeTab === "preAudit" ? <PreAuditEditor content={parsed} update={update} /> : null}
							{activeTab === "auditCopy" ? <AuditCopyEditor content={parsed} update={update} /> : null}
							{activeTab === "legalDocuments" ? (
								<LegalDocumentsEditor content={parsed} update={update} />
							) : null}
						</>
					) : (
						<div
							role="alert"
							className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
							<p className="font-medium">
								The tab editors are paused because the instrument JSON is not valid.
							</p>
							<p className="mt-1">
								Fix it in the advanced JSON editor below, then editing here resumes automatically.
							</p>
							{parseError ? <p className="mt-2 font-mono text-xs opacity-80">{parseError}</p> : null}
						</div>
					)}
				</div>

				<div className="space-y-2 rounded-md border border-border bg-muted px-4 py-3">
					<div className="flex items-center gap-3">
						<input
							id="activate-on-create"
							type="checkbox"
							checked={activateOnCreate}
							onChange={event => setActivateOnCreate(event.target.checked)}
							className="h-4 w-4 rounded border-input accent-primary"
						/>
						<Label htmlFor="activate-on-create" className="cursor-pointer text-sm font-medium">
							Publish this version immediately after saving
						</Label>
					</div>
					<p className="text-sm text-muted-foreground">
						When checked, saving replaces the live instrument — the public site starts using this version
						right away.
					</p>
				</div>

				<div className="space-y-3">
					{parseError ? (
						<p className="text-sm font-medium text-destructive">
							Advanced JSON editor — open until the JSON parses again.
						</p>
					) : (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="px-0 hover:bg-transparent"
							onClick={() => setShowAdvancedEditor(current => !current)}>
							{advancedEditorOpen ? "Hide advanced JSON editor" : "Show advanced JSON editor"}
						</Button>
					)}
					{advancedEditorOpen ? (
						<div className="space-y-2">
							<div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground">
								<Badge variant="warning">Advanced</Badge>
								<span>
									The raw JSON editor changes the survey definition itself, not ordinary dashboard
									wording.
								</span>
							</div>
							<Label htmlFor="instrument-json">Instrument JSON</Label>
							<Textarea
								id="instrument-json"
								value={editorValue}
								onChange={event => setEditorValue(event.target.value)}
								className="min-h-[28rem] font-mono text-xs"
								placeholder="Paste or edit the full YEE instrument JSON here…"
							/>
						</div>
					) : null}
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Button type="button" isLoading={isPending} onClick={handleSave} disabled={!canSave}>
						{activateOnCreate ? "Save and publish version" : "Save draft version"}
					</Button>
					{saveBlockedReason ? (
						<p className="text-sm text-muted-foreground" aria-live="polite">
							{saveBlockedReason}
						</p>
					) : null}
				</div>
			</CardContent>

			<ConfirmDialog
				open={confirmingClose}
				onOpenChange={setConfirmingClose}
				title="Discard your unsaved changes?"
				description="This draft has edits that were never saved. Closing the editor throws them away — nothing on the live site is affected either way."
				confirmLabel="Discard changes"
				cancelLabel="Keep editing"
				variant="destructive"
				onConfirm={onCancel}
			/>
		</Card>
	);
}
