"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
	createInstrumentVersion,
	deleteInstrumentVersion,
	fetchInstrumentVersions,
	updateInstrumentStatus
} from "@/features/workspaces/api/live-api";

import { INSTRUMENT_KEY, INSTRUMENTS_LIST_QUERY_KEY } from "./constants";
import { InstrumentEditor } from "./instrument-editor";
import { MetricRow } from "./shared-components";
import type { InstrumentVersionRecord } from "./types";
import { VersionHistory } from "./version-history";
import {
	fetchCanonicalInstrument,
	formatCreatedAt,
	isThrowawayVersion,
	summarizeInstrument,
	toDraftLabel
} from "./utils";

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
		const source = activeVersion?.content ?? canonicalInstrument;
		if (!source) return;
		const label = activeVersion
			? toDraftLabel(activeVersion.instrument_version)
			: toDraftLabel(summarizeInstrument(canonicalInstrument).version);
		openEditor(source, label);
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
			{loadError ? (
				<Card className="border-destructive/30 bg-destructive/10">
					<CardHeader>
						<CardTitle className="text-destructive">Instrument tool needs attention</CardTitle>
						<CardDescription className="text-destructive">
							{loadError instanceof Error ? loadError.message : "Could not load instrument data."}
						</CardDescription>
					</CardHeader>
				</Card>
			) : versionsQuery.isPending || canonicalQuery.isPending ? (
				<Card>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-6 w-44" />
						</div>
						<div className="grid gap-3 md:grid-cols-4">
							{[0, 1, 2, 3].map(index => (
								<Skeleton key={index} className="h-20 rounded-md" />
							))}
						</div>
					</CardContent>
				</Card>
			) : activeVersion ? (
				<Card>
					<CardContent className="space-y-4">
						<div className="space-y-1">
							<p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
								Currently live
							</p>
							<div className="flex flex-wrap items-center gap-2">
								<p className="text-xl font-semibold text-foreground">
									{activeVersion.instrument_version}
								</p>
								<Badge variant="success">Active</Badge>
							</div>
							<p className="text-sm text-muted-foreground">
								Published {formatCreatedAt(activeVersion.created_at)} - this is the version the public
								site uses right now.
							</p>
						</div>
						<MetricRow summary={activeSummary} />
					</CardContent>
				</Card>
			) : (
				<div className="rounded-md border border-dashed border-border">
					<EmptyState
						title="No published version yet"
						description="Create and publish a draft to make an instrument version live for the website."
					/>
				</div>
			)}

			<div className="space-y-2">
				<div className="flex flex-wrap gap-2">
					<Button type="button" variant="outline" onClick={handleOpenCurrent} disabled={!canonicalInstrument}>
						Open current version
					</Button>
					<Button
						type="button"
						onClick={handleCreateNewDraft}
						disabled={!activeVersion && !canonicalInstrument}>
						Create new draft
					</Button>
				</div>
				<p className="text-sm text-muted-foreground">
					Creating a new draft copies the live version so you can edit safely — nothing changes on the site
					until you publish it.
				</p>
			</div>

			<VersionHistory
				versions={versions}
				loading={versionsQuery.isPending}
				saving={activateMutation.isPending}
				deletingId={deletingId}
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
					<div className="rounded-md border border-dashed border-border">
						<EmptyState
							title="No draft open"
							description="Open the current version or one of the saved versions above to start editing a draft."
						/>
					</div>
				)}
			</div>
		</div>
	);
}
