"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuth } from "@/features/auth/components/auth-provider";
import type { FrontendSession } from "@/features/auth/session";
import type { UpdateDraft } from "@/features/admin/instruments/shared-components";
import {
	fetchInstrumentVersion,
	publishInstrumentDraft,
	updateInstrumentDraft,
	validateInstrumentDraft,
	type InstrumentDraftValidation
} from "@/features/workspaces/api/live-api";

import { INSTRUMENTS_LIST_QUERY_KEY } from "../constants";
import { instrumentErrorMessage } from "./errors";
import { instrumentVersionDetailSchema, type AuthoringSection, type InstrumentContent } from "./schema";
import { SectionNavigation } from "./section-navigation";
import { authoringReducer, createAuthoringState, isAuthoringDirty } from "./state";
import { validateAuthoring } from "./validation";
import { ValidationDrawer } from "./validation-drawer";
import { WorkbenchContent, WorkbenchModePicker, type WorkbenchMode } from "./workbench-content";
import { WorkbenchToolbar } from "./workbench-toolbar";

function requireSession(session: FrontendSession | null): FrontendSession {
	if (!session) throw new Error("An admin session is required.");
	return session;
}

export function InstrumentAuthoringWorkbench({ instrumentId }: { instrumentId: string }) {
	const { session } = useAuth();
	const detailQuery = useQuery({
		queryKey: ["yee", "admin", "instruments", instrumentId],
		queryFn: async () =>
			instrumentVersionDetailSchema.parse(await fetchInstrumentVersion(requireSession(session), instrumentId)),
		enabled: Boolean(session)
	});
	if (!session) return null;
	if (detailQuery.isPending) return <LoadingScreen message="Opening instrument draft" />;
	if (detailQuery.error || !detailQuery.data) {
		return (
			<Card className="border-destructive/30">
				<CardHeader>
					<CardTitle>Draft could not be opened</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					{detailQuery.error instanceof Error ? detailQuery.error.message : "Instrument not found."}
				</CardContent>
			</Card>
		);
	}
	return <LoadedWorkbench key={detailQuery.data.id} detail={detailQuery.data} session={session} />;
}

function LoadedWorkbench({
	detail,
	session
}: {
	detail: ReturnType<typeof instrumentVersionDetailSchema.parse>;
	session: FrontendSession;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [state, dispatch] = useReducer(authoringReducer, detail, createAuthoringState);
	const [selectedSectionId, setSelectedSectionId] = useState(detail.content.authoring.sections[0]?.id ?? "");
	const [mode, setMode] = useState<WorkbenchMode>("questions");
	const [serverValidation, setServerValidation] = useState<InstrumentDraftValidation | null>(null);
	const [busy, setBusy] = useState(false);
	const [confirmPublish, setConfirmPublish] = useState(false);
	const dirty = isAuthoringDirty(state);
	const localFindings = useMemo(() => validateAuthoring(state.content.authoring), [state.content.authoring]);
	const selectedSection =
		state.content.authoring.sections.find(section => section.id === selectedSectionId) ??
		state.content.authoring.sections[0];

	useEffect(() => {
		const protect = (event: BeforeUnloadEvent) => {
			if (!dirty) return;
			event.preventDefault();
		};
		window.addEventListener("beforeunload", protect);
		return () => window.removeEventListener("beforeunload", protect);
	}, [dirty]);

	function edit(update: (draft: { content: InstrumentContent; versionLabel: string }) => void) {
		dispatch({ type: "edit", update });
		setServerValidation(null);
	}

	async function saveCurrent() {
		const saved = instrumentVersionDetailSchema.parse(
			await updateInstrumentDraft(session, state.instrumentId, {
				expected_updated_at: state.updatedAt,
				instrument_version: state.versionLabel,
				content: state.content
			})
		);
		dispatch({ type: "saved", detail: saved });
		await queryClient.invalidateQueries({ queryKey: INSTRUMENTS_LIST_QUERY_KEY });
		toast.success("Draft saved", { description: `Version ${saved.instrument_version} is still private.` });
		return saved;
	}

	async function run(task: () => Promise<void>) {
		setBusy(true);
		try {
			await task();
		} catch (error) {
			toast.error("Instrument update failed", { description: instrumentErrorMessage(error) });
		} finally {
			setBusy(false);
		}
	}

	async function validateCurrent() {
		if (dirty) await saveCurrent();
		const result = await validateInstrumentDraft(session, state.instrumentId);
		setServerValidation(result);
		toast[result.activation_ready ? "success" : "warning"](
			result.activation_ready ? "Draft can be published" : "Draft needs review",
			{
				description: result.activation_ready
					? "Scoring behavior is unchanged."
					: "The validation panel lists what blocks publishing."
			}
		);
	}

	async function publishCurrent() {
		if (localFindings.length) {
			toast.warning("Fix editor validation first", { description: localFindings[0].message });
			return;
		}
		const saved = dirty ? await saveCurrent() : null;
		const result = await validateInstrumentDraft(session, state.instrumentId);
		setServerValidation(result);
		if (!result.activation_ready) {
			toast.warning("Publishing blocked", {
				description: "This draft requires a scoring migration or has validation errors."
			});
			return;
		}
		await publishInstrumentDraft(session, state.instrumentId, saved?.updated_at ?? state.updatedAt);
		await queryClient.invalidateQueries({ queryKey: INSTRUMENTS_LIST_QUERY_KEY });
		toast.success("Instrument published", { description: `Version ${state.versionLabel} is now active.` });
		router.push("/admin/instruments");
	}

	const updateLegacy: UpdateDraft = mutator => edit(draft => mutator(draft.content as never));
	if (detail.lifecycle !== "draft" || !selectedSection) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>This version is read-only</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					Fork it from version history to create an editable draft.
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="-mx-4 -mt-6 min-h-screen bg-muted/20 sm:-mx-6 lg:-mx-8">
			<WorkbenchToolbar
				versionLabel={state.versionLabel}
				dirty={dirty}
				canUndo={Boolean(state.undo)}
				busy={busy}
				onVersionChange={versionLabel =>
					edit(draft => {
						draft.versionLabel = versionLabel;
					})
				}
				onUndo={() => dispatch({ type: "undo" })}
				onSave={() =>
					void run(async () => {
						await saveCurrent();
					})
				}
				onValidate={() => void run(validateCurrent)}
				onPublish={() => setConfirmPublish(true)}
			/>
			<WorkbenchModePicker mode={mode} onChange={setMode} />
			<div className="p-4 lg:p-6">
				{mode === "questions" ? (
					<select
						className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm xl:hidden"
						value={selectedSection.id}
						onChange={event => setSelectedSectionId(event.target.value)}
						aria-label="Instrument section">
						{state.content.authoring.sections.map(section => (
							<option key={section.id} value={section.id}>
								{section.title} ({section.questions.length})
							</option>
						))}
					</select>
				) : null}
				<div
					className={
						mode === "questions"
							? "grid gap-6 xl:grid-cols-[14rem_minmax(0,1fr)_18rem]"
							: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]"
					}>
					{mode === "questions" ? (
						<div className="hidden xl:block">
							<SectionNavigation
								sections={state.content.authoring.sections}
								selectedId={selectedSection.id}
								onSelect={setSelectedSectionId}
							/>
						</div>
					) : null}
					<WorkbenchContent
						mode={mode}
						content={state.content}
						section={selectedSection}
						onSectionChange={(section: AuthoringSection) =>
							edit(draft => {
								const index = draft.content.authoring.sections.findIndex(
									candidate => candidate.id === section.id
								);
								draft.content.authoring.sections[index] = section;
							})
						}
						onLegacyUpdate={updateLegacy}
						onImport={content =>
							dispatch({ type: "replace", snapshot: { content, versionLabel: state.versionLabel } })
						}
					/>
					<ValidationDrawer localFindings={localFindings} serverValidation={serverValidation} />
				</div>
			</div>
			<ConfirmDialog
				open={confirmPublish}
				onOpenChange={setConfirmPublish}
				title="Publish this instrument version?"
				description="New audits will start using this version. Existing submitted audits keep their stamped version."
				confirmLabel="Publish version"
				onConfirm={() => void run(publishCurrent)}
			/>
		</div>
	);
}
