"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { instrumentContentSchema, type InstrumentContent } from "./schema";

export function DeveloperTools({
	content,
	onImport
}: {
	content: InstrumentContent;
	onImport: (content: InstrumentContent) => void;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [importing, setImporting] = useState(false);

	function download() {
		const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "yee-instrument-draft.json";
		anchor.click();
		URL.revokeObjectURL(url);
	}

	async function importFile(file: File | undefined) {
		if (!file) return;
		setImporting(true);
		try {
			const parsed = instrumentContentSchema.safeParse(JSON.parse(await file.text()));
			if (!parsed.success) {
				toast.error("Import rejected", {
					description: parsed.error.issues[0]?.message ?? "The file is not a valid authoring-v2 instrument."
				});
				return;
			}
			onImport(parsed.data);
			toast.success("Instrument imported", { description: "Review the changes, then save the draft." });
		} catch {
			toast.error("Import rejected", { description: "Choose a valid JSON file." });
		} finally {
			setImporting(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	}

	return (
		<div className="rounded-md border border-border bg-card p-5">
			<h2 className="text-lg font-semibold text-foreground">Developer tools</h2>
			<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
				JSON is available for diagnostics and reviewed imports. It is not the editing source of truth.
			</p>
			<div className="mt-4 flex flex-wrap gap-2">
				<Button type="button" variant="outline" onClick={download}>
					<Download aria-hidden="true" /> Download JSON
				</Button>
				<Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={importing}>
					<Upload aria-hidden="true" /> {importing ? "Checking…" : "Import validated JSON"}
				</Button>
				<input
					ref={inputRef}
					type="file"
					accept="application/json,.json"
					className="sr-only"
					onChange={event => void importFile(event.target.files?.[0])}
				/>
			</div>
		</div>
	);
}
