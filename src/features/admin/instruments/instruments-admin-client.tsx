"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/components/auth-provider";
import type { FrontendSession } from "@/features/auth/session";
import {
	deleteInstrumentVersion,
	fetchInstrumentVersions,
	forkInstrumentVersion
} from "@/features/workspaces/api/live-api";

import {
	instrumentVersionDetailSchema,
	instrumentVersionListSchema,
	type InstrumentVersionSummary
} from "./authoring/schema";
import { INSTRUMENT_KEY, INSTRUMENTS_LIST_QUERY_KEY } from "./constants";
import { InstrumentsAdminOverview } from "./instruments-admin-overview";
import { toUniqueDraftLabel } from "./utils";
import { VersionHistory } from "./version-history";

function requireSession(session: FrontendSession | null): FrontendSession {
	if (!session) throw new Error("An admin session is required.");
	return session;
}

export function InstrumentsAdminClient() {
	const { session } = useAuth();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const versionsQuery = useQuery({
		queryKey: INSTRUMENTS_LIST_QUERY_KEY,
		queryFn: async () =>
			instrumentVersionListSchema.parse(await fetchInstrumentVersions(requireSession(session), INSTRUMENT_KEY)),
		enabled: Boolean(session),
		select: rows => rows.filter(row => !row.instrument_version.toLowerCase().includes("smoke-test"))
	});
	const versions = versionsQuery.data ?? [];
	const activeVersion = versions.find(version => version.lifecycle === "active") ?? null;

	const forkMutation = useMutation({
		mutationFn: async ({ source, label }: { source: InstrumentVersionSummary; label: string }) =>
			instrumentVersionDetailSchema.parse(await forkInstrumentVersion(requireSession(session), source.id, label)),
		onSuccess: async draft => {
			await queryClient.invalidateQueries({ queryKey: INSTRUMENTS_LIST_QUERY_KEY });
			toast.success("Private draft created", {
				description: `Editing ${draft.instrument_version}. The live instrument is unchanged.`
			});
			router.push(`/admin/instruments/${draft.id}/edit`);
		},
		onError: error =>
			toast.error("Draft could not be created", {
				description: error instanceof Error ? error.message : "Try again."
			})
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteInstrumentVersion(requireSession(session), id),
		onMutate: setDeletingId,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: INSTRUMENTS_LIST_QUERY_KEY });
			toast.success("Draft deleted");
		},
		onError: error =>
			toast.error("Draft could not be deleted", {
				description: error instanceof Error ? error.message : "Try again."
			}),
		onSettled: () => setDeletingId(null)
	});

	function fork(source: InstrumentVersionSummary) {
		const label = toUniqueDraftLabel(
			source.instrument_version,
			versions.map(version => version.instrument_version)
		);
		forkMutation.mutate({ source, label });
	}

	if (!session) return null;
	if (versionsQuery.isPending) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-72 rounded-md" />
				<Skeleton className="h-64 rounded-md" />
			</div>
		);
	}
	if (versionsQuery.error) {
		return (
			<Card className="border-destructive/30">
				<CardHeader>
					<CardTitle>Instrument versions could not be loaded</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					{versionsQuery.error instanceof Error ? versionsQuery.error.message : "Try again."}
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<InstrumentsAdminOverview activeVersion={activeVersion} versions={versions} />
			<Card className="border-primary/20 bg-primary/5">
				<CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="font-semibold text-foreground">Start from the live instrument</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							A private authoring-v2 draft is created. Nothing changes for auditors until it passes
							validation and is published.
						</p>
					</div>
					<Button
						type="button"
						onClick={() => activeVersion && fork(activeVersion)}
						disabled={!activeVersion || forkMutation.isPending}>
						<CopyPlus aria-hidden="true" /> {forkMutation.isPending ? "Creating…" : "Create draft"}
					</Button>
				</CardContent>
			</Card>
			<VersionHistory
				versions={versions}
				session={session}
				deletingId={deletingId}
				onFork={fork}
				onDelete={id => deleteMutation.mutate(id)}
			/>
		</div>
	);
}
