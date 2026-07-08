/**
 * Minimal store-only (no compression) ZIP writer — ported from COPA.
 *
 * PDFs and XLSX files are already compressed, so DEFLATE would buy almost
 * nothing while adding a dependency. This emits a spec-correct ZIP (local file
 * headers + central directory + EOCD) with method 0 (stored) and real CRC-32s,
 * so a file inside the archive is byte-identical to the one-off download.
 *
 * No external dependency; runs entirely in the browser.
 */

export type ZipEntry = {
	/** Path inside the archive, e.g. `yee-audit-riverside-park-2026-06-12.pdf`. */
	name: string;
	data: Uint8Array;
};

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n += 1) {
		let c = n;
		for (let k = 0; k < 8; k += 1) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < bytes.length; i += 1) {
		crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

/** Encode a filename to bytes, marking UTF-8 in the general-purpose flag. */
function encodeName(name: string): { bytes: Uint8Array; utf8: boolean } {
	const bytes = new TextEncoder().encode(name);
	const utf8 = bytes.some(b => b > 0x7f);
	return { bytes, utf8 };
}

/** DOS date/time for a JS Date (ZIP uses 1980-based fields). */
function dosDateTime(date: Date): { time: number; date: number } {
	const year = Math.max(1980, date.getFullYear());
	const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f);
	const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
	return { time: time & 0xffff, date: dosDate & 0xffff };
}

/**
 * Build a store-only ZIP archive from the given entries. `modifiedAt` sets the
 * (informational) mod time on every entry; defaults to now.
 */
export function buildZip(entries: ZipEntry[], modifiedAt: Date = new Date()): Blob {
	const { time, date } = dosDateTime(modifiedAt);
	const localParts: Uint8Array[] = [];
	const centralParts: Uint8Array[] = [];
	let offset = 0;

	for (const entry of entries) {
		const { bytes: nameBytes } = encodeName(entry.name);
		const crc = crc32(entry.data);
		const size = entry.data.length;

		// Local file header (30 bytes + name).
		const local = new DataView(new ArrayBuffer(30));
		local.setUint32(0, 0x04034b50, true); // signature
		local.setUint16(4, 20, true); // version needed
		local.setUint16(6, 0x0800, true); // flags: UTF-8 name
		local.setUint16(8, 0, true); // method: stored
		local.setUint16(10, time, true);
		local.setUint16(12, date, true);
		local.setUint32(14, crc, true);
		local.setUint32(18, size, true); // compressed size
		local.setUint32(22, size, true); // uncompressed size
		local.setUint16(26, nameBytes.length, true);
		local.setUint16(28, 0, true); // extra length
		localParts.push(new Uint8Array(local.buffer), nameBytes, entry.data);

		// Central directory header (46 bytes + name).
		const central = new DataView(new ArrayBuffer(46));
		central.setUint32(0, 0x02014b50, true); // signature
		central.setUint16(4, 20, true); // version made by
		central.setUint16(6, 20, true); // version needed
		central.setUint16(8, 0x0800, true); // flags: UTF-8 name
		central.setUint16(10, 0, true); // method: stored
		central.setUint16(12, time, true);
		central.setUint16(14, date, true);
		central.setUint32(16, crc, true);
		central.setUint32(20, size, true);
		central.setUint32(24, size, true);
		central.setUint16(28, nameBytes.length, true);
		central.setUint16(30, 0, true); // extra length
		central.setUint16(32, 0, true); // comment length
		central.setUint16(34, 0, true); // disk number
		central.setUint16(36, 0, true); // internal attrs
		central.setUint32(38, 0, true); // external attrs
		central.setUint32(42, offset, true); // local header offset
		centralParts.push(new Uint8Array(central.buffer), nameBytes);

		offset += 30 + nameBytes.length + size;
	}

	const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
	const eocd = new DataView(new ArrayBuffer(22));
	eocd.setUint32(0, 0x06054b50, true); // signature
	eocd.setUint16(4, 0, true); // disk number
	eocd.setUint16(6, 0, true); // central dir start disk
	eocd.setUint16(8, entries.length, true); // entries on this disk
	eocd.setUint16(10, entries.length, true); // total entries
	eocd.setUint32(12, centralSize, true);
	eocd.setUint32(16, offset, true); // central dir offset
	eocd.setUint16(20, 0, true); // comment length

	// Concatenate into a single ArrayBuffer-backed view so the result is a valid
	// BlobPart (a bare Uint8Array is generic over ArrayBufferLike, which Blob rejects).
	const parts = [...localParts, ...centralParts, new Uint8Array(eocd.buffer)];
	const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
	const output = new Uint8Array(totalLength);
	let cursor = 0;
	for (const part of parts) {
		output.set(part, cursor);
		cursor += part.length;
	}
	return new Blob([output], { type: "application/zip" });
}
