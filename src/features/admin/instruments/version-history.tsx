"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

import { InstrumentContentViewer } from "./instrument-content-viewer";
import type { DetailTabKey, InstrumentVersionRecord } from "./types";
import { formatCreatedAt, getTypedContent } from "./utils";

export function VersionHistory({
	versions,
	loading,
	saving,
	deletingId,
	onEditVersion,
	onActivate,
	onDelete
}: {
	versions: InstrumentVersionRecord[];
	loading: boolean;
	saving: boolean;
	deletingId: string | null;
	onEditVersion: (version: InstrumentVersionRecord) => void;
	onActivate: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	const [selectedVersionId, setSelectedVersionId] = React.useState<string | null>(null);
	const [expandedVersionId, setExpandedVersionId] = React.useState<string | null>(null);
	const [detailTabByVersion, setDetailTabByVersion] = React.useState<Record<string, DetailTabKey>>({});
	const [confirm, setConfirm] = React.useState<{
		type: "delete" | "activate";
		version: InstrumentVersionRecord;
	} | null>(null);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Version history</CardTitle>
				<CardDescription>
					Every saved version. Open one to inspect it, edit it into a new draft, publish it, or delete an
					inactive draft.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{loading ? (
					<p className="text-sm text-muted-foreground">Loading instrument versions…</p>
				) : versions.length === 0 ? (
					<div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
						No saved versions yet.
					</div>
				) : (
					versions.map(version => {
						const tab = detailTabByVersion[version.id] ?? "preamble";
						const expanded = expandedVersionId === version.id;
						const isSelected = selectedVersionId === version.id;
						return (
							<div key={version.id} className="overflow-hidden rounded-md border border-border bg-card">
								<div className={cn("flex flex-col gap-4 p-5", isSelected ? "bg-accent" : "bg-card")}>
									<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
										<div className="space-y-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="wrap-break-word text-lg font-semibold text-foreground">
													{version.instrument_version}
												</p>
												<Badge variant={version.is_active ? "success" : "secondary"}>
													{version.is_active ? "Active" : "Inactive"}
												</Badge>
											</div>
											<p className="text-sm text-muted-foreground">
												Created {formatCreatedAt(version.created_at)}
											</p>
										</div>
										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												aria-expanded={expanded}
												onClick={() => {
													setSelectedVersionId(version.id);
													setExpandedVersionId(current =>
														current === version.id ? null : version.id
													);
												}}>
												{expanded ? "Hide details" : "View details"}
											</Button>
											<Button
												type="button"
												size="sm"
												onClick={() => {
													setSelectedVersionId(version.id);
													onEditVersion(version);
												}}>
												Edit
											</Button>
											{!version.is_active ? (
												<Button
													type="button"
													variant="success"
													size="sm"
													onClick={() => setConfirm({ type: "activate", version })}
													disabled={saving}>
													Make active
												</Button>
											) : null}
											{!version.is_active ? (
												<Button
													type="button"
													variant="danger"
													size="sm"
													onClick={() => setConfirm({ type: "delete", version })}
													disabled={deletingId === version.id}>
													{deletingId === version.id ? "Deleting…" : "Delete"}
												</Button>
											) : null}
										</div>
									</div>
									{expanded ? (
										<InstrumentContentViewer
											content={getTypedContent(version.content)}
											tab={tab}
											onTabChange={nextTab =>
												setDetailTabByVersion(current => ({
													...current,
													[version.id]: nextTab
												}))
											}
										/>
									) : null}
								</div>
							</div>
						);
					})
				)}
			</CardContent>

			{confirm ? (
				<ConfirmDialog
					open
					onOpenChange={open => {
						if (!open) setConfirm(null);
					}}
					title={confirm.type === "delete" ? "Delete this version?" : "Make this version live?"}
					description={
						confirm.type === "delete"
							? `Version ${confirm.version.instrument_version} will be permanently removed. This can't be undone.`
							: `Version ${confirm.version.instrument_version} will replace the current live instrument — new audits on the public site will use it immediately.`
					}
					confirmLabel={confirm.type === "delete" ? "Delete version" : "Make live"}
					variant={confirm.type === "delete" ? "destructive" : "default"}
					onConfirm={() => {
						if (confirm.type === "delete") onDelete(confirm.version.id);
						else onActivate(confirm.version.id);
					}}
				/>
			) : null}
		</Card>
	);
}
