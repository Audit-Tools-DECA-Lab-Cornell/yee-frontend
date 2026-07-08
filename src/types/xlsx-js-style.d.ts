/**
 * Minimal ambient types for `xlsx-js-style` (an `xlsx` fork). The package
 * declares a `types` entry but ships no `.d.ts`, so we declare just the styled-
 * write surface the export layer uses. Cell styles follow the xlsx-js-style
 * shape: colors are ARGB/RGB hex strings without `#`.
 */
declare module "xlsx-js-style" {
	export interface CellStyleColor {
		rgb?: string;
	}
	export interface CellStyle {
		font?: {
			bold?: boolean;
			italic?: boolean;
			sz?: number;
			color?: CellStyleColor;
			name?: string;
		};
		fill?: {
			patternType?: "solid" | "none";
			fgColor?: CellStyleColor;
			bgColor?: CellStyleColor;
		};
		alignment?: {
			horizontal?: "left" | "center" | "right";
			vertical?: "top" | "center" | "bottom";
			wrapText?: boolean;
		};
		border?: Record<string, { style?: string; color?: CellStyleColor }>;
		numFmt?: string;
	}

	export interface CellObject {
		v?: string | number | boolean | null;
		t?: "s" | "n" | "b" | "d" | "z";
		s?: CellStyle;
		[key: string]: unknown;
	}

	export interface WorkSheet {
		[cell: string]: CellObject | unknown;
		"!ref"?: string;
		"!cols"?: { wch?: number }[];
		"!merges"?: { s: { r: number; c: number }; e: { r: number; c: number } }[];
	}

	export interface WorkBook {
		SheetNames: string[];
		Sheets: Record<string, WorkSheet>;
	}

	export interface WritingOptions {
		type?: "array" | "binary" | "base64" | "buffer" | "string";
		bookType?: "xlsx" | "xlsm" | "xlsb" | "csv";
		cellStyles?: boolean;
	}

	export namespace utils {
		function book_new(): WorkBook;
		function aoa_to_sheet(data: (string | number | boolean | null)[][], opts?: unknown): WorkSheet;
		function book_append_sheet(wb: WorkBook, ws: WorkSheet, name?: string): void;
		function encode_cell(cell: { r: number; c: number }): string;
		function decode_range(ref: string): { s: { r: number; c: number }; e: { r: number; c: number } };
	}

	export function write(wb: WorkBook, opts: WritingOptions): ArrayBuffer;
}
