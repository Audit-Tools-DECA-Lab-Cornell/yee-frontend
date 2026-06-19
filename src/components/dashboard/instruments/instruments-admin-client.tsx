"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	createInstrumentVersion,
	deleteInstrumentVersion,
	fetchInstrumentVersions,
	updateInstrumentStatus
} from "@/lib/dashboard/live-api";

import { INSTRUMENT_KEY, INSTRUMENTS_LIST_QUERY_KEY } from "./constants";
import { InstrumentEditor } from "./instrument-editor";
import type { InstrumentVersionRecord } from "./types";
import { VersionHistory } from "./version-history";
import { fetchCanonicalInstrument, isThrowawayVersion, summarizeInstrument, toDraftLabel } from "./utils";

type EditingState = {
	initialJson: string;
	version: string;
};

export function InstrumentsAdminClient() {
	const { session } = useAuth();
	const queryClient = useQueryClient();
	const editorRef = React.useRef<HTMLDivElement | null>(null);

	const [editing, setEditing] = React.useState<EditingState | null>(null);
	const [deletingId, setDeletingId] = React.useState<string | null>(null);

	const versionsQuery = useQuery({
		queryKey: INSTRUMENTS_LIST_QUERY_KEY,
		queryFn: () => fetchInstrumentVersions(session!, INSTRUMENT_KEY),
		enabled: Boolean(session),
		select: rows => rows.filter(row => !isThrowawayVersion(row))
	});

	const canonicalQuery = useQuery({
		queryKey: ["yee", "instrument", "canonical"],
		queryFn: fetchCanonicalInstrument,
		enabled: Boolean(session)
	});

	const versions = versionsQuery.data ?? [];
	const canonicalInstrument = canonicalQuery.data ?? null;
	const activeVersion = versions.find(version => version.is_active) ?? null;
	const activeSummary = summarizeInstrument(activeVersion?.content ?? canonicalInstrument);

	async function refreshVersions() {
		await queryClient.invalidateQueries({ queryKey: INSTRUMENTS_LIST_QUERY_KEY });
	}

	function scrollToEditor() {
		requestAnimationFrame(() => {
			editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	}

	const createMutation = useMutation({
		mutationFn: (vars: { version: string; content: Record<string, unknown>; activate: boolean }) =>
			createInstrumentVersion(
				session!,
				{ instrument_key: INSTRUMENT_KEY, instrument_version: vars.version, content: vars.content },
				vars.activate
			),
		onSuccess: async (created, vars) => {
			toast.success(vars.activate ? "Version published" : "Draft saved", {
				description: vars.activate
					? `Created and activated instrument version ${created.instrument_version}.`
					: `Created draft instrument version ${created.instrument_version}.`
			});
			setEditing(null);
			await refreshVersions();
		},
		onError: (error: Error) => {
			toast.error("Could not save version", { description: error.message });
		}
	});

	const activateMutation = useMutation({
		mutationFn: (instrumentId: string) => updateInstrumentStatus(session!, instrumentId, { is_active: true }),
		onSuccess: async updated => {
			toast.success("Version activated", {
				description: `Activated instrument version ${updated.instrument_version}.`
			});
			await refreshVersions();
		},
		onError: (error: Error) => {
			toast.error("Could not activate version", { description: error.message });
		}
	});

	const deleteMutation = useMutation({
		mutationFn: (instrumentId: string) => deleteInstrumentVersion(session!, instrumentId),
		onMutate: (instrumentId: string) => {
			setDeletingId(instrumentId);
		},
		onSuccess: async () => {
			toast.success("Version deleted", { description: "Removed the instrument version." });
			await refreshVersions();
		},
		onError: (error: Error) => {
			toast.error("Could not delete version", { description: error.message });
		},
		onSettled: () => {
			setDeletingId(null);
		}
	});

	function openEditor(content: Record<string, unknown>, versionLabel: string) {
		setEditing({ initialJson: JSON.stringify(content, null, 2), version: versionLabel });
		scrollToEditor();
	}

	function handleOpenCurrent() {
		if (!canonicalInstrument) return;
		openEditor(canonicalInstrument, toDraftLabel(summarizeInstrument(canonicalInstrument).version));
	}

	function handleCreateNewDraft() {
		const source = activeVersion?.content ?? canonicalInstrument;
		if (!source) return;
		const label = activeVersion
			? toDraftLabel(activeVersion.instrument_version)
			: toDraftLabel(summarizeInstrument(canonicalInstrument).version);
		openEditor(source, label);
	}

	function handleEditVersion(version: InstrumentVersionRecord) {
		openEditor(
			version.content,
			version.is_active ? toDraftLabel(version.instrument_version) : version.instrument_version
		);
	}

	if (!session) return null;

	const loadError = versionsQuery.error ?? canonicalQuery.error;

	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-[#3b3027] bg-[#352b25] text-white shadow-sm">
				<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d6c9bc]">
							Administrator Workspace
						</p>
						<CardTitle className="text-4xl text-white">Instrument Management</CardTitle>
						<CardDescription className="max-w-3xl text-base text-[#e9dfd4]">
							Review version history, open the current instrument as a draft, update wording, and publish
							the version the website should use.
						</CardDescription>
					</div>
					<div className="flex w-full flex-col gap-3 lg:w-auto">
						<Button
							type="button"
							variant="outline"
							className="rounded-2xl border-white/25 bg-white/90 text-[#352b25] hover:bg-white"
							onClick={handleOpenCurrent}
							disabled={!canonicalInstrument}>
							Open Current Version
						</Button>
						<Button
							type="button"
							className="rounded-2xl bg-[#3e8f63] text-white hover:bg-[#347b55]"
							onClick={handleCreateNewDraft}
							disabled={!activeVersion && !canonicalInstrument}>
							Create New Draft
						</Button>
					</div>
				</CardHeader>
			</Card>

			{loadError ? (
				<Card className="rounded-[1.75rem] border-rose-200 bg-rose-50 shadow-sm">
					<CardHeader>
						<CardTitle>Instrument tool needs attention</CardTitle>
						<CardDescription className="text-rose-700">
							{loadError instanceof Error ? loadError.message : "Could not load instrument data."}
						</CardDescription>
					</CardHeader>
				</Card>
			) : null}

			<VersionHistory
				versions={versions}
				loading={versionsQuery.isPending}
				saving={activateMutation.isPending}
				deletingId={deletingId}
				activeVersionLabel={activeSummary.version}
				onEditVersion={handleEditVersion}
				onActivate={id => activateMutation.mutate(id)}
				onDelete={id => deleteMutation.mutate(id)}
			/>

			<div ref={editorRef}>
				{editing ? (
					<InstrumentEditor
						initialJson={editing.initialJson}
						version={editing.version}
						instrumentKey={INSTRUMENT_KEY}
						isPending={createMutation.isPending}
						onSave={(version, content, activate) => createMutation.mutate({ version, content, activate })}
						onCancel={() => setEditing(null)}
					/>
				) : (
					<Card className="rounded-[1.75rem] border-dashed border-slate-300 bg-slate-50/70 shadow-sm">
						<CardContent className="py-8 text-center text-sm text-slate-600">
							Open the current version or one of the saved versions above to start editing a draft.
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
