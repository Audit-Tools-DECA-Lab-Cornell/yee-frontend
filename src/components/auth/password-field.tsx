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
	required = false
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	required?: boolean;
}) {
	const [visible, setVisible] = React.useState(false);

	return (
		<div className="relative">
			<Input
				id={id}
				type={visible ? "text" : "password"}
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
				className="absolute right-1 top-1 size-7 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
				onClick={() => setVisible(current => !current)}
				aria-label={visible ? "Hide password" : "Show password"}>
				{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
			</Button>
		</div>
	);
}
