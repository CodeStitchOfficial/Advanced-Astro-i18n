/**
 * Pure transformation helpers shared across scripts.
 * Extracted here to make them independently unit-testable.
 */

import slugifyLib from "slugify";

export function slugify(name) {
	return slugifyLib(name, { lower: true, strict: true });
}

export function titleCase(name) {
	return name
		.split(/\s+/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(" ");
}

export function humanizeKey(key) {
	const withoutNamespace = key.includes(":") ? key.split(":").slice(1).join(":") : key;
	const lastSegment = withoutNamespace.split(".").pop() || withoutNamespace;
	const words = lastSegment.replace(/[-_]/g, " ");
	return words.charAt(0).toUpperCase() + words.slice(1);
}

export function flattenIntoMap(obj, namespace, prefix, map) {
	for (const [key, value] of Object.entries(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (typeof value === "string") {
			map[`${namespace}:${fullKey}`] = value;
			if (!(fullKey in map)) map[fullKey] = value;
		} else if (typeof value === "object" && value !== null) {
			flattenIntoMap(value, namespace, fullKey, map);
		}
	}
}

export function lookupTranslation(key, map) {
	if (map[key] !== undefined) return map[key];
	if (key.includes(":")) {
		const withoutNs = key.split(":").slice(1).join(":");
		if (map[withoutNs] !== undefined) return map[withoutNs];
	}
	return humanizeKey(key);
}

/**
 * Insert a key/value entry into a named locale block (e.g. `en: { ... }`) in a TS file.
 * Returns updated content, or null if the slug already exists in that block.
 */
export function insertIntoLocaleBlock(content, localeName, slug, value) {
	const localeRegex = new RegExp(`\\b${localeName}:\\s*\\{`);
	const match = localeRegex.exec(content);
	if (!match) return null;

	const braceOpenIndex = content.indexOf("{", match.index + match[0].length - 1);

	let depth = 1;
	let i = braceOpenIndex + 1;
	while (i < content.length && depth > 0) {
		if (content[i] === "{") depth++;
		else if (content[i] === "}") depth--;
		i++;
	}
	const closingBracePos = i - 1;

	const blockContent = content.slice(braceOpenIndex + 1, closingBracePos);
	if (new RegExp(`"${slug}"\\s*:`).test(blockContent)) return null;

	// Walk back to find the start of the closing brace's line
	let lineStart = closingBracePos;
	while (lineStart > 0 && content[lineStart - 1] !== "\n") lineStart--;

	return (
		content.slice(0, lineStart) +
		`    "${slug}": "${value}",\n` +
		content.slice(lineStart)
	);
}

/**
 * Remove an object key block (e.g. `i18n: { ... },`) from JS/TS content.
 * Handles arbitrarily nested braces by counting depth.
 */
export function removeObjectKey(content, keyName) {
	const keyRegex = new RegExp(`(\\n[ \\t]*)${keyName}:\\s*\\{`);
	const match = keyRegex.exec(content);
	if (!match) return content;

	const startIndex = match.index;
	const braceOpenIndex = content.indexOf("{", match.index + match[0].length - 1);

	let depth = 1;
	let i = braceOpenIndex + 1;
	while (i < content.length && depth > 0) {
		if (content[i] === "{") depth++;
		else if (content[i] === "}") depth--;
		i++;
	}

	let endIndex = i;
	if (content[endIndex] === ",") endIndex++;
	if (content[endIndex] === "\n") endIndex++;

	return content.slice(0, startIndex) + content.slice(endIndex);
}
