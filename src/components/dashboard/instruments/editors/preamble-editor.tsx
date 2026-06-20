"use client";

import { EditableField, type UpdateDraft } from "../shared-components";
import type { StructuredInstrumentContent } from "../types";
import { cleanInstrumentText } from "../utils";

/** Overview tab: survey title + preamble paragraphs (light text editing). */
export function PreambleEditor({ content, update }: { content: StructuredInstrumentContent; update: UpdateDraft }) {
	const preamble = content.preamble ?? [];

	return (
		<div className="space-y-5">
			<EditableField
				label="Survey Title"
				value={content.survey_name ?? ""}
				onChange={value =>
					update(draft => {
						draft.survey_name = value;
					})
				}
			/>

			<div className="space-y-3">
				<p className="text-sm font-medium text-slate-900">Preamble copy</p>
				{preamble.length === 0 ? (
					<p className="text-sm text-slate-500">This instrument has no preamble paragraphs.</p>
				) : (
					preamble.map((paragraph, index) => (
						<EditableField
							key={`preamble-${index}`}
							label={`Preamble paragraph ${index + 1}`}
							value={cleanInstrumentText(paragraph)}
							multiline
							onChange={value =>
								update(draft => {
									const next = [...(draft.preamble ?? [])];
									next[index] = value;
									draft.preamble = next;
								})
							}
						/>
					))
				)}
			</div>
		</div>
	);
}
