import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

const root = join(__dirname, "../..");
const read = (relativePath: string) => readFileSync(join(root, relativePath), "utf8");

const globalsCss = read("src/app/globals.css");
const sidebarSource = read("src/components/layouts/dashboard/dashboard-sidebar.tsx");
const shellSource = read("src/components/layouts/dashboard/dashboard-shell.tsx");
const headerSource = read("src/components/layouts/dashboard/dashboard-header.tsx");
const logoutSource = read("src/features/auth/components/logout-button.tsx");

/**
 * The collapsed sidebar is styled entirely in CSS, off a `data-sidebar-collapsed`
 * flag on <html>. That is what keeps the rail flash-free and hydration-safe, but
 * it also means the guarantees below live in class strings rather than in code a
 * type checker can see. Each one has a specific way of breaking silently.
 */
test("collapsed rail styles stay scoped to the persistent desktop aside", () => {
	const variant = globalsCss.match(/@custom-variant rail-collapsed \(([^)]*)\)/)?.[1];

	expect(
		variant,
		"The `rail-collapsed` variant is missing from globals.css. Every collapsed style in the sidebar depends on it."
	).toBeTruthy();
	expect(
		variant,
		"`rail-collapsed:` must stay scoped to `[data-dashboard-rail]`. The mobile sheet renders the same DashboardSidebar at full width, so an unscoped variant would collapse the sheet's navigation to unlabelled icons for anyone whose last desktop session was collapsed."
	).toContain("[data-dashboard-rail]");
	expect(
		shellSource,
		"DashboardShell's <aside> must carry `data-dashboard-rail` - it is the anchor the `rail-collapsed` variant selects on."
	).toContain("data-dashboard-rail");
});

test("rail labels are hidden with sr-only, never removed from the accessibility tree", () => {
	for (const [name, source] of [
		["dashboard-sidebar.tsx", sidebarSource],
		["logout-button.tsx", logoutSource]
	] as const) {
		expect(
			source,
			`${name} must hide its labels with \`rail-collapsed:sr-only\`. An icon-only link whose label is display:none has no accessible name at all, which is the classic icon-rail regression.`
		).toContain("rail-collapsed:sr-only");

		const labelHiddenWithDisplayNone = /rail-collapsed:hidden[^"'`]*"\s*}?\s*>\s*\{?\s*(item\.label|config)/.test(
			source
		);
		expect(
			labelHiddenWithDisplayNone,
			`${name} hides a nav label with \`rail-collapsed:hidden\`. Use \`rail-collapsed:sr-only\` so the label still names the control.`
		).toBe(false);
	}
});

test("the sidebar toggle is wired to the sidebar it controls", () => {
	expect(
		shellSource,
		'The <aside> needs id="dashboard-sidebar" for the header toggle\'s aria-controls to resolve.'
	).toContain('id="dashboard-sidebar"');

	for (const attribute of ['aria-controls="dashboard-sidebar"', "aria-expanded={!collapsed}"]) {
		expect(
			headerSource,
			`The collapse toggle must keep ${attribute}. Without it the control announces nothing about the state it changes.`
		).toContain(attribute);
	}
});

test("rail controls keep the same tooltip trigger mounted across collapse toggles", () => {
	const railTooltipSource = sidebarSource.match(/function RailTooltip[\s\S]*?\n}\n\nexport function/)?.[0];

	expect(railTooltipSource, "RailTooltip must remain a dedicated wrapper around every rail control.").toBeTruthy();
	expect(
		railTooltipSource,
		"RailTooltip must not return the control directly while expanded. Changing its root from the control to <Tooltip> remounts the focused link or button when Ctrl/Cmd+B toggles the rail."
	).not.toContain("return children");
	expect(railTooltipSource).toContain("<Tooltip");
	expect(railTooltipSource).toContain("<TooltipTrigger asChild>");
});

test("the collapse preference is applied before first paint", () => {
	expect(
		shellSource,
		"DashboardShell must render <SidebarCollapseScript />. Without the pre-paint script the rail renders 292px wide and then snaps to 72px on every load for anyone who collapsed it."
	).toContain("SidebarCollapseScript");

	const scriptIndex = shellSource.indexOf("SidebarCollapseScript />");
	const asideIndex = shellSource.indexOf("data-dashboard-rail");
	expect(
		scriptIndex,
		"SidebarCollapseScript must render above the <aside>; it only avoids the flash if it runs before the sidebar is parsed."
	).toBeLessThan(asideIndex);
});
