import type { InstrumentContent, InstrumentVersionDetail } from "./schema";

export type DraftSnapshot = {
	content: InstrumentContent;
	versionLabel: string;
};

export type AuthoringState = DraftSnapshot & {
	instrumentId: string;
	updatedAt: string;
	baseline: string;
	undo: DraftSnapshot | null;
};

export type AuthoringAction =
	| { type: "edit"; update: (draft: DraftSnapshot) => void }
	| { type: "undo" }
	| { type: "replace"; snapshot: DraftSnapshot }
	| { type: "saved"; detail: InstrumentVersionDetail };

export function createAuthoringState(detail: InstrumentVersionDetail): AuthoringState {
	const snapshot = { content: structuredClone(detail.content), versionLabel: detail.instrument_version };
	return {
		...snapshot,
		instrumentId: detail.id,
		updatedAt: detail.updated_at,
		baseline: JSON.stringify(snapshot),
		undo: null
	};
}

export function authoringReducer(state: AuthoringState, action: AuthoringAction): AuthoringState {
	if (action.type === "edit") {
		const previous = { content: structuredClone(state.content), versionLabel: state.versionLabel };
		const next = { content: structuredClone(state.content), versionLabel: state.versionLabel };
		action.update(next);
		return { ...state, ...next, undo: previous };
	}
	if (action.type === "undo") {
		if (!state.undo) return state;
		return {
			...state,
			content: structuredClone(state.undo.content),
			versionLabel: state.undo.versionLabel,
			undo: null
		};
	}
	if (action.type === "replace") {
		return {
			...state,
			content: structuredClone(action.snapshot.content),
			versionLabel: action.snapshot.versionLabel,
			undo: { content: structuredClone(state.content), versionLabel: state.versionLabel }
		};
	}
	const saved = createAuthoringState(action.detail);
	return saved;
}

export function isAuthoringDirty(state: AuthoringState): boolean {
	return JSON.stringify({ content: state.content, versionLabel: state.versionLabel }) !== state.baseline;
}
