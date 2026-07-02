"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { YeeStepNumber } from "@/features/yee-audit/config/yee-audit-config";

type StepNavItem = {
	step: YeeStepNumber;
	label: string;
	shortLabel: string;
	isComplete: boolean;
};

type AuditStepNavProps = {
	steps: StepNavItem[];
	currentStep: YeeStepNumber;
	onStepClick: (step: YeeStepNumber) => void;
};

/**
 * Horizontal step navigation bar for the audit wizard.
 * Uses aria-label and announces current step via aria-current.
 */
function AuditStepNav({ steps, currentStep, onStepClick }: AuditStepNavProps) {
	return (
		<nav
			aria-label={`Audit progress: step ${currentStep} of ${steps.length}`}
			className="flex items-center gap-1 overflow-x-auto pb-1">
			{steps.map((item, index) => {
				const isActive = item.step === currentStep;
				const isPast = item.isComplete;

				return (
					<React.Fragment key={item.step}>
						{index > 0 ? (
							<div
								className={cn(
									"h-px w-4 shrink-0 rounded-full",
									isPast ? "bg-[var(--yee-green-500)]" : "bg-border"
								)}
								aria-hidden="true"
							/>
						) : null}

						<button
							type="button"
							onClick={() => onStepClick(item.step)}
							aria-current={isActive ? "step" : undefined}
							aria-label={`Step ${item.step}: ${item.label}${isPast ? " (complete)" : ""}${isActive ? " (current)" : ""}`}
							className={cn(
								"flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors",
								isActive
									? "bg-[var(--yee-green-900)] text-[var(--primary-foreground)]"
									: isPast
										? "bg-[var(--yee-green-100)] text-[var(--yee-green-900)] hover:bg-[var(--yee-green-200)]"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
							)}>
							{/* Step number circle */}
							<span
								className={cn(
									"flex size-4 items-center justify-center rounded-full text-[10px] font-bold",
									isActive
										? "bg-white/20 text-white"
										: isPast
											? "bg-[var(--yee-green-600)] text-white"
											: "bg-border text-muted-foreground"
								)}
								aria-hidden="true">
								{item.step}
							</span>
							<span className="hidden sm:inline">{item.shortLabel}</span>
						</button>
					</React.Fragment>
				);
			})}
		</nav>
	);
}

export { AuditStepNav };
export type { StepNavItem };
