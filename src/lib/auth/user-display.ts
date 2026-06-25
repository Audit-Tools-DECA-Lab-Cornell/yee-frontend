import type { SessionUser, UserRole } from "./session-types";

/** Returns the best available display name for a session user. */
export function getUserDisplayName(user: SessionUser): string {
	if (user.name && user.name.trim().length > 0) {
		return user.name.trim();
	}
	return user.email;
}

/**
 * Returns up to two uppercase initials derived from the user's name.
 * Falls back to the first character of the email local-part.
 */
export function getUserInitials(user: SessionUser): string {
	const name = user.name?.trim();
	if (name) {
		const parts = name.split(/\s+/).filter(Boolean);
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
		}
		return (parts[0]?.[0] ?? "?").toUpperCase();
	}
	return (user.email[0] ?? "?").toUpperCase();
}

/** Returns a human-readable label for a user role. */
export function getUserRoleLabel(role: UserRole): string {
	switch (role) {
		case "ADMIN":
			return "Admin";
		case "MANAGER":
			return "Manager";
		case "AUDITOR":
			return "Auditor";
	}
}
