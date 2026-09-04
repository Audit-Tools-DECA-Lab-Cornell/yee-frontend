"use client";

import * as React from "react";

const STORAGE_KEY = "yee:sidebar-collapsed";
const ROOT_ATTRIBUTE = "data-sidebar-collapsed";

/**
 * Collapse state for the desktop sidebar rail.
 *
 * The state of record is the `data-sidebar-collapsed` attribute on <html>, not
 * React state. Every collapsed style is a CSS descendant of that attribute (see
 * the `rail-collapsed:` variant in globals.css), which buys three things:
 *
 *   1. No flash. `SidebarCollapseScript` sets the attribute before first paint,
 *      so a returning user's rail is already narrow on the first frame instead
 *      of animating 292px -> 72px after hydration.
 *   2. No hydration mismatch. Server and client render identical markup; only
 *      the stylesheet reads the attribute.
 *   3. No layout thrash. Toggling writes one custom property, and the shell
 *      grid, the aside and the transition all move off that single value.
 *
 * React subscribes to the attribute rather than owning it, so the parts CSS
 * cannot express — the toggle's `aria-expanded`, whether the rail's tooltips
 * are live — still track it exactly.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function getSnapshot() {
	return document.documentElement.getAttribute(ROOT_ATTRIBUTE) === "true";
}

/** The rail only exists at lg and up, where the server cannot know the width. */
function getServerSnapshot() {
	return false;
}

function readStoredPreference() {
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		if (stored !== null) return stored === "true";
	} catch {
		// Storage can be blocked (private mode, a partitioned context). Fall
		// through to whatever the bootstrap script already put on <html>.
	}
	return getSnapshot();
}

function applyCollapsed(next: boolean, { persist }: { persist: boolean }) {
	document.documentElement.setAttribute(ROOT_ATTRIBUTE, String(next));

	if (persist) {
		try {
			window.localStorage.setItem(STORAGE_KEY, String(next));
		} catch {
			// The toggle still works for this session, it just is not remembered.
		}
	}

	for (const listener of listeners) listener();
}

/**
 * Blocking inline script, rendered above the sidebar so it runs while the
 * browser is still parsing the shell — the attribute is in place before the
 * aside is painted.
 *
 * The mount effect below deliberately repeats it: on a client-side navigation
 * into the dashboard (login -> /manager, say) this is markup React never
 * executes, so the effect is what applies the preference on that path.
 */
const BOOTSTRAP_SCRIPT = `(function(){try{var v=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});document.documentElement.setAttribute(${JSON.stringify(ROOT_ATTRIBUTE)},v==="true"?"true":"false")}catch(e){}})();`;

export function SidebarCollapseScript() {
	return <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP_SCRIPT }} />;
}

type SidebarCollapseValue = {
	collapsed: boolean;
	setCollapsed: (next: boolean) => void;
	toggle: () => void;
};

const SidebarCollapseContext = React.createContext<SidebarCollapseValue>({
	collapsed: false,
	setCollapsed: () => {},
	toggle: () => {}
});

export function SidebarCollapseProvider({ children }: { children: React.ReactNode }) {
	const collapsed = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	// Syncing the document with a preference held outside React is what an
	// effect is for. It writes the DOM and notifies the store; it never sets
	// state, so there is no cascading render.
	React.useEffect(() => {
		applyCollapsed(readStoredPreference(), { persist: false });
	}, []);

	const setCollapsed = React.useCallback((next: boolean) => applyCollapsed(next, { persist: true }), []);

	// Reads the attribute rather than the rendered value, so a keypress landing
	// between renders cannot toggle off a stale snapshot.
	const toggle = React.useCallback(() => setCollapsed(!getSnapshot()), [setCollapsed]);

	// Cmd/Ctrl+B — what Linear, VS Code and Notion all bind. Skipped while the
	// user is typing so it never eats a real "bold" or a character.
	React.useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key.toLowerCase() !== "b") return;
			if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;

			const target = event.target as HTMLElement | null;
			if (target?.isContentEditable) return;
			if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;

			event.preventDefault();
			toggle();
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [toggle]);

	const value = React.useMemo(() => ({ collapsed, setCollapsed, toggle }), [collapsed, setCollapsed, toggle]);

	return <SidebarCollapseContext.Provider value={value}>{children}</SidebarCollapseContext.Provider>;
}

export function useSidebarCollapse() {
	return React.useContext(SidebarCollapseContext);
}

const neverChanges = () => () => {};

/**
 * "⌘" or "Ctrl" for shortcut hints. The platform is not knowable on the server,
 * so it resolves right after hydration — harmless, since the only place it is
 * shown is a tooltip that cannot open before then anyway.
 */
export function useShortcutModifierLabel() {
	return React.useSyncExternalStore(
		neverChanges,
		() => (/mac|iphone|ipad|ipod/i.test(navigator.userAgent) ? "⌘" : "Ctrl"),
		() => "Ctrl"
	);
}
