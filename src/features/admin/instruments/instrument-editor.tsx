"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { DETAIL_TABS } from "./constants";
import { LegalDocumentsEditor } from "./editors/legal-documents-editor";
import { PreAuditEditor } from "./editors/pre-audit-editor";
import { PreambleEditor } from "./editors/preamble-editor";
import { ScaleGuidanceEditor } from "./editors/scale-guidance-editor";
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

	const parsed = React.useMemo<StructuredInstrumentContent | null>(() => {
		if (!editorValue.trim()) return null;
		try {
			return JSON.parse(editorValue) as StructuredInstrumentContent;
		} catch {
			return null;
		}
	}, [editorValue]);

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

	const versionError = draftVersion.trim().length === 0 ? "Give this version a label before saving." : undefined;
	const canSave = !isPending && draftVersion.trim().length > 0 && parsed !== null;

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
				<Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
					Close editor
				</Button>
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
						scaleGuidance: summary.scaleGuidance,
						legalDocuments: summary.legalDocuments
					}}
				/>

				<div
					id={`${tabsId}-panel`}
					role="tabpanel"
					aria-labelledby={`${tabsId}-tab-${activeTab}`}
					className="rounded-md border border-border bg-card p-4">
					{parsed ? (
						<>
							{activeTab === "preamble" ? <PreambleEditor content={parsed} update={update} /> : null}
							{activeTab === "sections" ? <SectionTextEditor content={parsed} update={update} /> : null}
							{activeTab === "spreadsheet" ? <SpreadsheetView content={parsed} /> : null}
							{activeTab === "preAudit" ? <PreAuditEditor content={parsed} update={update} /> : null}
							{activeTab === "scaleGuidance" ? (
								<ScaleGuidanceEditor content={parsed} update={update} />
							) : null}
							{activeTab === "legalDocuments" ? (
								<LegalDocumentsEditor content={parsed} update={update} />
							) : null}
						</>
					) : (
						<div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
							The advanced JSON editor currently contains invalid JSON, so the tab editors are paused. Fix
							the JSON below to continue editing.
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
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="px-0 hover:bg-transparent"
						onClick={() => setShowAdvancedEditor(current => !current)}>
						{showAdvancedEditor ? "Hide advanced JSON editor" : "Show advanced JSON editor"}
					</Button>
					{showAdvancedEditor ? (
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
				</div>
			</CardContent>
		</Card>
	);
}
