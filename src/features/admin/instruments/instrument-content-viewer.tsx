import { useId } from "react";

import { Badge } from "@/components/ui/badge";

import { DETAIL_TABS } from "./constants";
import { IdTag, MetricRow, TabBar } from "./shared-components";
import type {
	DetailTabKey,
	EditableItem,
	InstrumentLegalDocument,
	InstrumentPreAuditQuestion,
	InstrumentScaleGuidance,
	QuestionGroup,
	SpreadsheetGroup,
	StructuredInstrumentContent
} from "./types";
import {
	buildSpreadsheetGroups,
	cleanInstrumentText,
	describeAnswerType,
	formatCreatedAt,
	getDisplayQuestionText,
	getQuestionGroups,
	isPlaceholderQuestionText,
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
	const tabsId = useId();
	const summary = summarizeInstrument((content as Record<string, unknown> | null) ?? null);
	const questionGroups = getQuestionGroups(content);
	const spreadsheetGroups = buildSpreadsheetGroups(content);

	return (
		<div className="space-y-5 border-t border-border pt-5">
			<MetricRow summary={summary} />

			<TabBar
				tabs={DETAIL_TABS}
				active={tab}
				onChange={onTabChange}
				idBase={tabsId}
				counts={{
					sections: summary.sections,
					preAudit: summary.preAuditQuestions,
					scaleGuidance: summary.scaleGuidance,
					legalDocuments: summary.legalDocuments
				}}
			/>

			<div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${tab}`}>
				{tab === "preamble" ? <PreamblePanel paragraphs={content?.preamble ?? []} /> : null}
				{tab === "sections" ? <SectionsPanel groups={questionGroups} /> : null}
				{tab === "spreadsheet" ? <SpreadsheetPanel groups={spreadsheetGroups} /> : null}
				{tab === "preAudit" ? <PreAuditPanel questions={content?.pre_audit_questions ?? []} /> : null}
				{tab === "scaleGuidance" ? <ScaleGuidancePanel scales={content?.scale_guidance ?? []} /> : null}
				{tab === "legalDocuments" ? <LegalDocumentsPanel documents={content?.legal_documents ?? []} /> : null}
			</div>
		</div>
	);
}

function PanelEmpty({ message }: { message: string }) {
	return (
		<div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
			{message}
		</div>
	);
}

function PreamblePanel({ paragraphs }: { paragraphs: string[] }) {
	if (paragraphs.length === 0) return <PanelEmpty message="This version has no introduction text." />;
	return (
		<div className="rounded-md border border-border bg-card p-5">
			<div className="max-w-[65ch] space-y-4">
				{paragraphs.map((paragraph, index) => (
					<p
						key={`preamble-${index}`}
						className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
						{cleanInstrumentText(paragraph)}
					</p>
				))}
			</div>
		</div>
	);
}

function SectionsPanel({ groups }: { groups: QuestionGroup[] }) {
	if (groups.length === 0) return <PanelEmpty message="This version has no sections." />;
	return (
		<div className="space-y-4">
			{groups.map((group, index) => (
				<div key={group.blockKey} className="rounded-md border border-border bg-card p-5">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary" className="tabular-nums">
							{index + 1}
						</Badge>
						<p className="break-words text-xl font-semibold text-foreground">
							{cleanInstrumentText(group.section?.title || group.items[0]?.block_title || group.blockKey)}
						</p>
					</div>
					<p className="mt-2 text-sm text-muted-foreground tabular-nums">
						{group.items.length} {group.items.length === 1 ? "question" : "questions"}
					</p>
					{group.section?.intro_text ? (
						<div className="mt-4 rounded-md border border-border bg-muted p-3 text-sm text-foreground">
							<span className="font-medium">Instruction:</span>{" "}
							<span className="whitespace-pre-wrap break-words">
								{cleanInstrumentText(group.section.intro_text)}
							</span>
						</div>
					) : null}
					{group.section?.comment_prompt ? (
						<div className="mt-3 rounded-md border border-border bg-accent p-3 text-sm text-accent-foreground">
							<span className="font-medium">Notes prompt:</span>{" "}
							<span className="whitespace-pre-wrap break-words">
								{cleanInstrumentText(group.section.comment_prompt)}
							</span>
						</div>
					) : null}
					{group.items.length > 0 ? (
						<div className="mt-4 space-y-3">
							<p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
								Questions ({group.items.length})
							</p>
							{group.items.map(item => (
								<QuestionPreview key={item.item_id} item={item} />
							))}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}

function QuestionPreview({ item }: { item: EditableItem }) {
	const realText = cleanInstrumentText(item.question_text || "");
	const hasRealText = Boolean(realText) && !isPlaceholderQuestionText(realText);
	const choices = Object.entries(item.choices ?? {});
	return (
		<div className="rounded-md border border-border bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				<IdTag>{item.item_id}</IdTag>
				{item.item_kind ? <IdTag>{item.item_kind}</IdTag> : null}
				<Badge variant="secondary">{describeAnswerType(item)}</Badge>
			</div>
			<p className="mt-3 whitespace-pre-wrap break-words text-base font-medium text-foreground">
				{getDisplayQuestionText(item)}
			</p>
			{hasRealText && choices.length > 0 ? (
				<div className="mt-4 flex flex-wrap gap-2">
					{choices.map(([choiceId, choice]) => (
						<span
							key={`${item.item_id}-${choiceId}`}
							className="max-w-full whitespace-normal break-words rounded-full border border-border bg-muted px-3 py-1 text-sm text-foreground">
							{cleanInstrumentText(choice.Display || choiceId)}
						</span>
					))}
				</div>
			) : null}
		</div>
	);
}

export function SpreadsheetPanel({ groups }: { groups: SpreadsheetGroup[] }) {
	if (groups.length === 0) return <PanelEmpty message="This version has no sections or questions." />;
	return (
		<div className="overflow-hidden rounded-md border border-border bg-card">
			<div className="max-h-[42rem] overflow-y-auto">
				{groups.map(group => (
					<section key={group.blockKey} aria-label={group.sectionTitle}>
						<div className="sticky top-0 z-10 border-b border-border bg-muted px-5 py-3">
							<p className="break-words text-sm font-semibold text-foreground">{group.sectionTitle}</p>
						</div>
						{group.items.length === 0 ? (
							<p className="px-5 py-4 text-sm text-muted-foreground">No questions in this section.</p>
						) : (
							group.items.map(item => (
								<div
									key={item.id}
									className="flex flex-col gap-1.5 border-b border-border px-5 py-3 last:border-b-0 sm:flex-row sm:gap-4">
									<IdTag className="w-fit shrink-0">{item.id}</IdTag>
									<p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
										{item.prompt}
									</p>
								</div>
							))
						)}
					</section>
				))}
			</div>
		</div>
	);
}

function PreAuditPanel({ questions }: { questions: InstrumentPreAuditQuestion[] }) {
	if (questions.length === 0) return <PanelEmpty message="This version has no pre-audit questions." />;
	return (
		<div className="space-y-4">
			{questions.map(question => (
				<div key={question.id} className="rounded-md border border-border bg-card p-5">
					<div className="flex flex-wrap items-center gap-2">
						<IdTag>{question.id}</IdTag>
						{question.auto_generated ? <Badge variant="secondary">Auto-generated</Badge> : null}
						<Badge variant="secondary">{question.multi_select ? "Multi select" : "Single select"}</Badge>
					</div>
					<p className="mt-4 break-words text-lg font-semibold text-foreground">
						{cleanInstrumentText(question.title)}
					</p>
					<p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium text-foreground">
						{cleanInstrumentText(question.prompt)}
					</p>
					{question.description ? (
						<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
							{cleanInstrumentText(question.description)}
						</p>
					) : null}
					{question.options?.length ? (
						<div className="mt-4 flex flex-wrap gap-2">
							{question.options.map(option => (
								<span
									key={`${question.id}-${option.value}`}
									className="max-w-full whitespace-normal break-words rounded-full border border-border bg-muted px-3 py-1 text-sm text-foreground">
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
	if (scales.length === 0) return <PanelEmpty message="This version has no scale guidance." />;
	return (
		<div className="grid gap-4 md:grid-cols-2">
			{scales.map(scale => (
				<div key={scale.id} className="rounded-md border border-border bg-card p-5">
					<div className="flex flex-wrap items-center gap-2">
						<p className="break-words text-lg font-semibold text-foreground">
							{cleanInstrumentText(scale.title)}
						</p>
						<IdTag>{scale.id}</IdTag>
					</div>
					<p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium text-foreground">
						{cleanInstrumentText(scale.prompt)}
					</p>
					{scale.description ? (
						<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
							{cleanInstrumentText(scale.description)}
						</p>
					) : null}
					{(scale.rules ?? []).length > 0 ? (
						<div className="mt-4 space-y-2">
							{(scale.rules ?? []).map(rule => (
								<div
									key={`${scale.id}-${rule.value}`}
									className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
									<div className="flex flex-wrap items-center gap-2">
										<span className="break-words font-medium">
											{cleanInstrumentText(rule.label)}
										</span>
										{rule.tag ? <IdTag>{rule.tag}</IdTag> : null}
									</div>
									<div className="flex flex-wrap items-center gap-1.5">
										{typeof rule.add === "number" ? <IdTag>Add {rule.add}</IdTag> : null}
										{typeof rule.boost === "number" ? <IdTag>Boost {rule.boost}</IdTag> : null}
										{rule.follow_up_behavior ? (
											<IdTag>{cleanInstrumentText(rule.follow_up_behavior)}</IdTag>
										) : null}
									</div>
								</div>
							))}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}

function LegalDocumentsPanel({ documents }: { documents: InstrumentLegalDocument[] }) {
	if (documents.length === 0) return <PanelEmpty message="This version has no legal documents." />;
	return (
		<div className="space-y-4">
			{documents.map(doc => (
				<div key={doc.id} className="rounded-md border border-border bg-card p-5">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="space-y-1">
							<p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
								{cleanInstrumentText(doc.document_type?.replaceAll("_", " ") || "Document")}
							</p>
							<p className="break-words text-lg font-semibold text-foreground">
								{cleanInstrumentText(doc.title)}
							</p>
							{doc.last_updated ? (
								<p className="text-sm text-muted-foreground">
									Last updated {formatCreatedAt(doc.last_updated)}
								</p>
							) : null}
						</div>
						<IdTag>{doc.id}</IdTag>
					</div>
					<p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
						{cleanInstrumentText(doc.content)}
					</p>
				</div>
			))}
		</div>
	);
}
