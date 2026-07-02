"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordField({
	id,
	value,
	onChange,
	placeholder,
	required = false,
	autoComplete
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	required?: boolean;
	autoComplete?: string;
}) {
	const [visible, setVisible] = React.useState(false);

	return (
		<div className="relative">
			<Input
				id={id}
				name={id}
				type={visible ? "text" : "password"}
				autoComplete={autoComplete ?? (visible ? "off" : "current-password")}
				spellCheck={false}
				placeholder={placeholder}
				value={value}
				onChange={event => onChange(event.target.value)}
				required={required}
				className="pr-12"
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="absolute right-1 top-1 size-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
				onClick={() => setVisible(current => !current)}
				aria-label={visible ? "Hide password" : "Show password"}>
				{visible ? (
					<EyeOff className="size-4" aria-hidden="true" />
				) : (
					<Eye className="size-4" aria-hidden="true" />
				)}
			</Button>
		</div>
	);
}
