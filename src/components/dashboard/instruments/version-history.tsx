"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { InstrumentContentViewer } from "./instrument-content-viewer";
import type { DetailTabKey, InstrumentVersionRecord } from "./types";
import { getTypedContent } from "./utils";

export function VersionHistory({
	versions,
	loading,
	saving,
	deletingId,
	activeVersionLabel,
	onEditVersion,
	onActivate,
	onDelete
}: {
	versions: InstrumentVersionRecord[];
	loading: boolean;
	saving: boolean;
	deletingId: string | null;
	activeVersionLabel: string;
	onEditVersion: (version: InstrumentVersionRecord) => void;
	onActivate: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	const [selectedVersionId, setSelectedVersionId] = React.useState<string | null>(null);
	const [expandedVersionId, setExpandedVersionId] = React.useState<string | null>(null);
	const [detailTabByVersion, setDetailTabByVersion] = React.useState<Record<string, DetailTabKey>>({});

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Version History</CardTitle>
				<CardDescription>
					Active version: {activeVersionLabel}. Open a version to inspect it, edit it into a draft, publish
					it, or delete an inactive draft.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{loading ? (
					<p className="text-sm text-slate-500">Loading instrument versions...</p>
				) : versions.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
						No saved versions are available yet.
					</div>
				) : (
					versions.map(version => {
						const tab = detailTabByVersion[version.id] ?? "preamble";
						const expanded = expandedVersionId === version.id;
						return (
							<div
								key={version.id}
								className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
								<div
									className={cn(
										"flex flex-col gap-4 p-5",
										selectedVersionId === version.id ? "bg-emerald-50/70" : "bg-white"
									)}>
									<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<p className="break-words text-2xl font-semibold text-slate-900">
													{version.instrument_version}
												</p>
												<Badge
													className={cn(
														"rounded-full",
														version.is_active
															? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
															: "bg-slate-100 text-slate-600 hover:bg-slate-100"
													)}>
													{version.is_active ? "Active" : "Inactive"}
												</Badge>
											</div>
											<p className="text-sm text-slate-500">
												Created {new Date(version.created_at).toLocaleString()}
											</p>
										</div>
										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												variant="outline"
												className="rounded-2xl"
												onClick={() => {
													setSelectedVersionId(version.id);
													setExpandedVersionId(current =>
														current === version.id ? null : version.id
													);
												}}>
												{expanded ? "Hide Details" : "View Details"}
											</Button>
											<Button
												type="button"
												className="rounded-2xl bg-[#1f5f45] text-white hover:bg-[#194e3a]"
												onClick={() => {
													setSelectedVersionId(version.id);
													onEditVersion(version);
												}}>
												Edit this version
											</Button>
											{!version.is_active ? (
												<Button
													type="button"
													className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
													onClick={() => onActivate(version.id)}
													disabled={saving}>
													Make Active
												</Button>
											) : null}
											{!version.is_active ? (
												<Button
													type="button"
													variant="outline"
													className="rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50"
													onClick={() => onDelete(version.id)}
													disabled={deletingId === version.id}>
													{deletingId === version.id ? "Deleting..." : "Delete"}
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
		</Card>
	);
}
