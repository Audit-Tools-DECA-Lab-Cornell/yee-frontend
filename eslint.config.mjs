import { defineConfig, globalIgnores } from "eslint/config";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
	// eslint-config-next v16 ships native flat configs — no FlatCompat needed.
	...coreWebVitals,
	...typescript,
	{
		rules: {
			// New in react-hooks v7 (eslint-config-next 16). The codebase's
			// session/hydration providers intentionally set state in effects;
			// keep as a warning until they are refactored.
			"react-hooks/set-state-in-effect": "warn"
		}
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts"
	])
]);

export default eslintConfig;
