"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

	const canSave = !isPending && draftVersion.trim().length > 0 && parsed !== null;

	return (
		<Card className="rounded-lg border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-2">
					<CardTitle>Edit Draft Version</CardTitle>
					<CardDescription>
						Update wording across the tabs below, then save a new draft or publish it immediately. Changes
						save into the version you create here — nothing is published until you save.
					</CardDescription>
				</div>
				<Button type="button" variant="outline" className="rounded-lg" onClick={onCancel} disabled={isPending}>
					Close Editor
				</Button>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="instrument-version">Version Label</Label>
						<Input
							id="instrument-version"
							value={draftVersion}
							onChange={event => setDraftVersion(event.target.value)}
							placeholder="Example: spring-2026, janet-review-1"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="instrument-key">Instrument Key</Label>
						<Input
							id="instrument-key"
							value={instrumentKey}
							readOnly
							className="bg-slate-50 text-slate-500"
						/>
					</div>
				</div>

				<MetricRow summary={summary} />

				<TabBar
					tabs={DETAIL_TABS}
					active={activeTab}
					onChange={setActiveTab}
					counts={{
						sections: summary.sections,
						preAudit: summary.preAuditQuestions,
						scaleGuidance: summary.scaleGuidance,
						legalDocuments: summary.legalDocuments
					}}
				/>

				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
						<div className="rounded-lg border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
							The advanced JSON editor currently contains invalid JSON, so the tab editors are paused. Fix
							the JSON below to continue editing.
						</div>
					)}
				</div>

				<div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
					<input
						id="activate-on-create"
						type="checkbox"
						checked={activateOnCreate}
						onChange={event => setActivateOnCreate(event.target.checked)}
						className="h-4 w-4 rounded border-slate-300"
					/>
					<Label htmlFor="activate-on-create" className="cursor-pointer text-sm font-medium">
						Publish this version immediately after saving
					</Label>
				</div>

				<div className="space-y-3">
					<Button
						type="button"
						variant="ghost"
						className="rounded-lg px-0 text-slate-700 hover:bg-transparent hover:text-slate-900"
						onClick={() => setShowAdvancedEditor(current => !current)}>
						{showAdvancedEditor ? "Hide Advanced JSON Editor" : "Show Advanced JSON Editor"}
					</Button>
					{showAdvancedEditor ? (
						<div className="space-y-2">
							<div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
								<span className="font-medium">Advanced only:</span> the raw JSON editor changes the
								survey definition itself, not ordinary dashboard wording.
							</div>
							<Label htmlFor="instrument-json">Instrument JSON</Label>
							<Textarea
								id="instrument-json"
								value={editorValue}
								onChange={event => setEditorValue(event.target.value)}
								className="min-h-[28rem] font-mono text-xs"
								placeholder="Paste or edit the full YEE instrument JSON here..."
							/>
						</div>
					) : null}
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Button
						type="button"
						className="rounded-lg bg-[#10231f] text-white hover:bg-[#17302c]"
						onClick={handleSave}
						disabled={!canSave}>
						{isPending ? "Saving..." : activateOnCreate ? "Save and Publish Version" : "Save Draft Version"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
