"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Copy, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { FrontendSession } from "@/features/auth/session";
import { fetchInstrumentVersion } from "@/features/workspaces/api/live-api";
import { cn } from "@/lib/utils";

import { LogicalInstrumentViewer } from "./authoring/logical-viewer";
import { instrumentVersionDetailSchema, type InstrumentVersionSummary } from "./authoring/schema";
import { formatCreatedAt } from "./utils";

export function VersionHistory({
	versions,
	session,
	deletingId,
	onFork,
	onDelete
}: {
	versions: InstrumentVersionSummary[];
	session: FrontendSession;
	deletingId: string | null;
	onFork: (version: InstrumentVersionSummary) => void;
	onDelete: (id: string) => void;
}) {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [deleteVersion, setDeleteVersion] = useState<InstrumentVersionSummary | null>(null);
	return (
		<Card>
			<CardHeader>
				<CardTitle>Version history</CardTitle>
				<CardDescription>
					Active, editable, and audit-protected versions are deliberately separated.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{versions.map(version => (
					<VersionRow
						key={version.id}
						version={version}
						session={session}
						expanded={expandedId === version.id}
						onToggle={() => setExpandedId(current => (current === version.id ? null : version.id))}
						onFork={() => onFork(version)}
						onDelete={() => setDeleteVersion(version)}
						deleting={deletingId === version.id}
					/>
				))}
				{versions.length === 0 ? (
					<p className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
						No instrument versions found.
					</p>
				) : null}
			</CardContent>
			<ConfirmDialog
				open={Boolean(deleteVersion)}
				onOpenChange={open => {
					if (!open) setDeleteVersion(null);
				}}
				title="Delete this private draft?"
				description={`Version ${deleteVersion?.instrument_version ?? ""} has no audit references and will be permanently removed.`}
				confirmLabel="Delete draft"
				variant="destructive"
				onConfirm={() => {
					if (deleteVersion) onDelete(deleteVersion.id);
					setDeleteVersion(null);
				}}
			/>
		</Card>
	);
}

function VersionRow({
	version,
	session,
	expanded,
	onToggle,
	onFork,
	onDelete,
	deleting
}: {
	version: InstrumentVersionSummary;
	session: FrontendSession;
	expanded: boolean;
	onToggle: () => void;
	onFork: () => void;
	onDelete: () => void;
	deleting: boolean;
}) {
	const detailQuery = useQuery({
		queryKey: ["yee", "admin", "instruments", version.id],
		queryFn: async () => instrumentVersionDetailSchema.parse(await fetchInstrumentVersion(session, version.id)),
		enabled: expanded
	});
	return (
		<article
			className={cn(
				"overflow-hidden rounded-md border border-border bg-card",
				version.lifecycle === "active" && "border-primary/40"
			)}>
			<div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-base font-semibold text-foreground">{version.instrument_version}</h3>
						<Badge
							variant={
								version.lifecycle === "active"
									? "success"
									: version.lifecycle === "draft"
										? "secondary"
										: "outline"
							}>
							{version.lifecycle}
						</Badge>
						<Badge variant={version.compatibility_status === "migration_required" ? "warning" : "outline"}>
							{version.schema_generation === "authoring_v2" ? "Authoring v2" : "Legacy"}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						Updated {formatCreatedAt(version.updated_at)}
						{version.usage_count
							? ` · ${version.usage_count} audit record${version.usage_count === 1 ? "" : "s"}`
							: ""}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button type="button" variant="outline" size="sm" onClick={onToggle} aria-expanded={expanded}>
						<ChevronDown className={cn("transition", expanded && "rotate-180")} aria-hidden="true" />{" "}
						{expanded ? "Hide map" : "View map"}
					</Button>
					{version.lifecycle === "draft" ? (
						<Button asChild size="sm">
							<Link href={`/admin/instruments/${version.id}/edit`}>
								<Pencil aria-hidden="true" /> Continue editing
							</Link>
						</Button>
					) : (
						<Button type="button" size="sm" onClick={onFork}>
							<Copy aria-hidden="true" /> Fork draft
						</Button>
					)}
					{version.lifecycle === "draft" ? (
						<Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={deleting}>
							<Trash2 aria-hidden="true" /> {deleting ? "Deleting…" : "Delete"}
						</Button>
					) : null}
				</div>
			</div>
			{expanded ? (
				detailQuery.isPending ? (
					<div className="border-t border-border p-5 text-sm text-muted-foreground">Loading survey map…</div>
				) : detailQuery.data ? (
					<LogicalInstrumentViewer detail={detailQuery.data} />
				) : (
					<div className="border-t border-border p-5 text-sm text-destructive">
						This version could not be loaded.
					</div>
				)
			) : null}
		</article>
	);
}
