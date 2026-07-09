"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Root error boundary. Reports uncaught rendering errors to Sentry and shows a
 * minimal recovery UI. Only rendered when an error escapes every nested
 * boundary, so it is intentionally dependency-free.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html lang="en">
			<body
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100vh",
					gap: "1rem",
					fontFamily: "system-ui, sans-serif",
					textAlign: "center",
					padding: "1.5rem"
				}}>
				<h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h1>
				<p style={{ color: "#666", maxWidth: "28rem" }}>
					An unexpected error occurred. The team has been notified — please try again.
				</p>
				<button
					type="button"
					onClick={() => reset()}
					style={{
						padding: "0.5rem 1rem",
						borderRadius: "0.5rem",
						border: "1px solid #ccc",
						background: "#111",
						color: "#fff",
						cursor: "pointer"
					}}>
					Try again
				</button>
			</body>
		</html>
	);
}
