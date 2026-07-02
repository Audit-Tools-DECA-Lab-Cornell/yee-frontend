import { Badge } from "@/components/ui/badge";

import { DETAIL_TABS } from "./constants";
import { MetricRow, TabBar } from "./shared-components";
import type {
	DetailTabKey,
	EditableItem,
	InstrumentLegalDocument,
	InstrumentPreAuditQuestion,
	InstrumentScaleGuidance,
	QuestionGroup,
	SpreadsheetRow,
	StructuredInstrumentContent
} from "./types";
import {
	buildSpreadsheetRows,
	cleanInstrumentText,
	getDisplayQuestionText,
	getQuestionGroups,
	summarizeInstrument
} from "./utils";

/**
 * Read-only inspection of a single instrument version. Tabs mirror the editor
 * (Overview / Sections / Spreadsheet / Pre-Audit / Scale Guidance / Legal),
 * adapted to the flat YEE schema.
 */
export function InstrumentContentViewer({
	content,
	tab,
	onTabChange
}: {
	content: StructuredInstrumentContent | null;
	tab: DetailTabKey;
	onTabChange: (tab: DetailTabKey) => void;
}) {
	const summary = summarizeInstrument((content as Record<string, unknown> | null) ?? null);
	const questionGroups = getQuestionGroups(content);
	const spreadsheetRows = buildSpreadsheetRows(content);

	return (
		<div className="space-y-5 border-t border-slate-200 pt-5">
			<MetricRow summary={summary} />

			<TabBar
				tabs={DETAIL_TABS}
				active={tab}
				onChange={onTabChange}
				counts={{
					sections: summary.sections,
					preAudit: summary.preAuditQuestions,
					scaleGuidance: summary.scaleGuidance,
					legalDocuments: summary.legalDocuments
				}}
			/>

			{tab === "preamble" ? <PreamblePanel paragraphs={content?.preamble ?? []} /> : null}
			{tab === "sections" ? <SectionsPanel groups={questionGroups} /> : null}
			{tab === "spreadsheet" ? <SpreadsheetPanel rows={spreadsheetRows} /> : null}
			{tab === "preAudit" ? <PreAuditPanel questions={content?.pre_audit_questions ?? []} /> : null}
			{tab === "scaleGuidance" ? <ScaleGuidancePanel scales={content?.scale_guidance ?? []} /> : null}
			{tab === "legalDocuments" ? <LegalDocumentsPanel documents={content?.legal_documents ?? []} /> : null}
		</div>
	);
}

function PreamblePanel({ paragraphs }: { paragraphs: string[] }) {
	return (
		<div className="space-y-4">
			{paragraphs.map((paragraph, index) => (
				<div key={`preamble-${index}`} className="rounded-lg border border-slate-200 bg-white p-5">
					<p className="text-lg font-semibold text-slate-900">
						{index === 0 ? "How the tool is structured" : `Preamble note ${index + 1}`}
					</p>
					<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
						{cleanInstrumentText(paragraph)}
					</p>
				</div>
			))}
		</div>
	);
}

function SectionsPanel({ groups }: { groups: QuestionGroup[] }) {
	return (
		<div className="space-y-4">
			{groups.map((group, index) => (
				<div key={group.blockKey} className="rounded-lg border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-center gap-2">
						<Badge className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-100">{index + 1}</Badge>
						<p className="break-words text-2xl font-semibold text-slate-900">
							{cleanInstrumentText(group.section?.title || group.items[0]?.block_title || group.blockKey)}
						</p>
					</div>
					<p className="mt-2 text-sm text-slate-600">
						{group.items.length} questions across{" "}
						{new Set(group.items.map(item => item.item_kind || "scored")).size} unique modes
					</p>
					{group.section?.intro_text ? (
						<div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
							<span className="font-medium text-slate-900">Instruction:</span>{" "}
							<span className="whitespace-pre-wrap break-words">
								{cleanInstrumentText(group.section.intro_text)}
							</span>
						</div>
					) : null}
					{group.section?.comment_prompt ? (
						<div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-sm text-slate-700">
							<span className="font-medium text-slate-900">Notes Prompt:</span>{" "}
							<span className="whitespace-pre-wrap break-words">
								{cleanInstrumentText(group.section.comment_prompt)}
							</span>
						</div>
					) : null}
					<div className="mt-4 space-y-3">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
							Questions ({group.items.length})
						</p>
						{group.items.map(item => (
							<QuestionPreview key={item.item_id} item={item} />
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function QuestionPreview({ item }: { item: EditableItem }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4">
			<div className="flex flex-wrap items-center gap-2">
				<Badge className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-100">{item.item_id}</Badge>
				{item.item_kind ? (
					<Badge className="rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
						{item.item_kind}
					</Badge>
				) : null}
				<Badge className="rounded-md bg-slate-900 text-white hover:bg-slate-900">
					{item.answers && Object.keys(item.answers).length > 0 ? "Matrix" : "Single select"}
				</Badge>
			</div>
			<p className="mt-3 whitespace-pre-wrap break-words text-lg font-medium text-slate-900">
				{getDisplayQuestionText(item)}
			</p>
			{item.choices && Object.keys(item.choices).length > 0 ? (
				<div className="mt-4 flex flex-wrap gap-2">
					{Object.entries(item.choices).map(([choiceId, choice]) => (
						<span
							key={`${item.item_id}-${choiceId}`}
							className="max-w-full whitespace-normal break-words rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
							{cleanInstrumentText(choice.Display || choiceId)}
						</span>
					))}
				</div>
			) : null}
		</div>
	);
}

export function SpreadsheetPanel({ rows }: { rows: SpreadsheetRow[] }) {
	return (
		<div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
			<div className="grid grid-cols-[180px_240px_minmax(0,1fr)] border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-700">
				<p>#</p>
				<p>Section</p>
				<p>Prompt</p>
			</div>
			<div className="max-h-[42rem] overflow-y-auto">
				{rows.map(row => (
					<div
						key={row.id}
						className="grid grid-cols-[180px_240px_minmax(0,1fr)] gap-4 border-b border-slate-100 px-6 py-4 text-sm text-slate-700 last:border-b-0">
						<p className="whitespace-pre-wrap break-words font-medium text-slate-900">{row.number}</p>
						<p className="whitespace-pre-wrap break-words">{row.section}</p>
						<p className="whitespace-pre-wrap break-words leading-6">{row.prompt}</p>
					</div>
				))}
			</div>
		</div>
	);
}

function PreAuditPanel({ questions }: { questions: InstrumentPreAuditQuestion[] }) {
	return (
		<div className="space-y-4">
			{questions.map(question => (
				<div key={question.id} className="rounded-lg border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-center gap-2">
						<Badge className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-100">
							{question.id}
						</Badge>
						{question.auto_generated ? (
							<Badge className="rounded-md bg-slate-900 text-white hover:bg-slate-900">
								Auto generated
							</Badge>
						) : null}
						<Badge className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-100">
							{question.multi_select ? "Multi select" : "Single select"}
						</Badge>
					</div>
					<p className="mt-4 break-words text-2xl font-semibold text-slate-900">
						{cleanInstrumentText(question.title)}
					</p>
					<p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium text-slate-900">
						{cleanInstrumentText(question.prompt)}
					</p>
					{question.description ? (
						<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
							{cleanInstrumentText(question.description)}
						</p>
					) : null}
					{question.options?.length ? (
						<div className="mt-4 flex flex-wrap gap-2">
							{question.options.map(option => (
								<span
									key={`${question.id}-${option.value}`}
									className="max-w-full whitespace-normal break-words rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
									{cleanInstrumentText(option.label)}
								</span>
							))}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}

function ScaleGuidancePanel({ scales }: { scales: InstrumentScaleGuidance[] }) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			{scales.map(scale => (
				<div key={scale.id} className="rounded-lg border border-slate-200 bg-white p-5">
					<Badge className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-100">
						{cleanInstrumentText(scale.title)}
					</Badge>
					<p className="mt-4 break-words text-2xl font-semibold text-slate-900">
						{cleanInstrumentText(scale.title)}
					</p>
					<p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium text-slate-900">
						{cleanInstrumentText(scale.prompt)}
					</p>
					{scale.description ? (
						<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
							{cleanInstrumentText(scale.description)}
						</p>
					) : null}
					<div className="mt-4 space-y-2">
						{(scale.rules ?? []).map(rule => (
							<div
								key={`${scale.id}-${rule.value}`}
								className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700">
								<div className="flex flex-wrap items-center gap-2">
									<span className="break-words font-medium text-slate-900">
										{cleanInstrumentText(rule.label)}
									</span>
									{rule.tag ? (
										<Badge className="rounded-full bg-white text-slate-600 hover:bg-white">
											{rule.tag}
										</Badge>
									) : null}
								</div>
								<div className="flex flex-wrap gap-2 text-xs">
									{typeof rule.add === "number" ? <span>Add: {rule.add}</span> : null}
									{typeof rule.boost === "number" ? <span>Boost: {rule.boost}</span> : null}
									{rule.follow_up_behavior ? (
										<span>{cleanInstrumentText(rule.follow_up_behavior)}</span>
									) : null}
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function LegalDocumentsPanel({ documents }: { documents: InstrumentLegalDocument[] }) {
	return (
		<div className="space-y-4">
			{documents.map(document => (
				<div key={document.id} className="rounded-lg border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
								{cleanInstrumentText(document.document_type?.replaceAll("_", " ") || "Document")}
							</p>
							<p className="break-words text-2xl font-semibold text-slate-900">
								{cleanInstrumentText(document.title)}
							</p>
							{document.last_updated ? (
								<p className="text-sm text-slate-500">Last Updated: {document.last_updated}</p>
							) : null}
						</div>
						<Badge className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-100">
							{document.id}
						</Badge>
					</div>
					<p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
						{cleanInstrumentText(document.content)}
					</p>
				</div>
			))}
		</div>
	);
}
