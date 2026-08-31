"use client";

import { ArrowLeft, CheckCircle2, Save, Undo2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WorkbenchToolbar({
	versionLabel,
	dirty,
	canUndo,
	busy,
	onVersionChange,
	onUndo,
	onSave,
	onValidate,
	onPublish
}: {
	versionLabel: string;
	dirty: boolean;
	canUndo: boolean;
	busy: boolean;
	onVersionChange: (value: string) => void;
	onUndo: () => void;
	onSave: () => void;
	onValidate: () => void;
	onPublish: () => void;
}) {
	return (
		<header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
			<div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
				<div className="flex min-w-0 items-center gap-3">
					<Button asChild variant="ghost" size="icon" aria-label="Back to instrument versions">
						<Link href="/admin/instruments">
							<ArrowLeft aria-hidden="true" />
						</Link>
					</Button>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<h1 className="truncate text-lg font-semibold text-foreground">Instrument workbench</h1>
							<Badge variant={dirty ? "warning" : "success"}>{dirty ? "Unsaved" : "Saved"}</Badge>
						</div>
						<p className="text-xs text-muted-foreground">
							Questions are edited as auditors experience them.
						</p>
					</div>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
						Version
						<Input
							value={versionLabel}
							onChange={event => onVersionChange(event.target.value)}
							className="h-9 w-full sm:w-44"
							aria-label="Instrument version"
						/>
					</label>
					<div className="flex flex-wrap gap-2">
						<Button type="button" variant="outline" size="sm" onClick={onUndo} disabled={!canUndo || busy}>
							<Undo2 aria-hidden="true" /> Undo
						</Button>
						<Button type="button" variant="outline" size="sm" onClick={onSave} disabled={!dirty || busy}>
							<Save aria-hidden="true" /> Save draft
						</Button>
						<Button type="button" variant="outline" size="sm" onClick={onValidate} disabled={busy}>
							<CheckCircle2 aria-hidden="true" /> Save & validate
						</Button>
						<Button type="button" size="sm" onClick={onPublish} disabled={busy}>
							Publish
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
