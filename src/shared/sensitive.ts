import type { RedactionMode } from "./constants/settings";

/** Categories of sensitive data that can be detected and redacted. */
export type SensitiveDataType = "PHONE" | "SSN" | "SIN" | "EMAIL";

/** Result returned by redaction functions. */
export interface RedactionResult {
    redactedText: string;
    redactionCount: number;
    typesDetected: SensitiveDataType[];
}

export interface ProtectedHtmlAttributes {
    protectedHtml: string;
    replacements: Array<readonly [placeholder: string, originalValue: string]>;
}

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

/**
 * North American phone numbers:
 * (123) 456-7890, 123-456-7890, 123.456.7890, +1-123-456-7890, +1 123 456 7890
 *
 * Lookbehind/lookahead prevent matching digit-runs inside longer numbers or words.
 */
const NA_PHONE_REGEX =
    /(?<![0-9a-zA-Z])(?:\+?1[\s.-]?)?\(?[2-9]\d{2}\)?[\s.-][2-9]\d{2}[\s.-]\d{4}(?![0-9a-zA-Z])/g;

/**
 * International phone numbers that begin with a '+' country code:
 * +44 20 7946 0958, +91-98765-43210, +33 1 23 45 67 89
 *
 * Requires a leading '+' and 7-15 total digits (ITU-T E.164 max is 15).
 */
const INTL_PHONE_REGEX =
    /(?<![0-9a-zA-Z])\+\d{1,3}[\s.-]?\d(?:[\d\s.-]{5,13})\d(?![0-9a-zA-Z])/g;

/**
 * US Social Security Numbers (SSN):
 * 123-45-6789, 123 45 6789
 *
 * Requires at least one separator (dash or space) to avoid matching arbitrary
 * 9-digit numbers like product codes or reference IDs.  Alphanumeric
 * boundaries prevent matching within longer tokens.
 *
 * Excludes invalid area prefixes: 000, 666, 9xx (per IRS rules).
 * The 3-2-4 grouping distinguishes SSNs from SINs (3-3-3).
 */
const SSN_REGEX =
    /(?<![0-9a-zA-Z])(?!000|666|9\d\d)\d{3}([-\s])\d{2}\1\d{4}(?![0-9a-zA-Z])/g;

/**
 * Canadian Social Insurance Numbers (SIN):
 * 123-456-789, 123 456 789
 *
 * Requires separators to distinguish from SSNs and other 9-digit sequences.
 * Alphanumeric boundaries prevent matching within longer tokens.
 * The 3-3-3 grouping is canonical for SINs.
 */
const SIN_REGEX = /(?<![0-9a-zA-Z])\d{3}([-\s])\d{3}\1\d{3}(?![0-9a-zA-Z])/g;

/**
 * Email addresses.
 *
 * Intentionally simple — good enough for redaction without needing RFC 5321
 * compliance.  The negative lookbehind prevents matching partial strings that
 * are already part of a longer token.
 */
const EMAIL_REGEX =
    /(?<![0-9a-zA-Z._%+-])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?![0-9a-zA-Z])/g;

// ---------------------------------------------------------------------------
// Pattern list – order matters: more-specific patterns first to avoid
// double-matching.  Each successive pattern runs against text that already had
// prior matches replaced, so overlaps are not possible.
// ---------------------------------------------------------------------------

const PATTERNS: ReadonlyArray<{ regex: RegExp; type: SensitiveDataType }> = [
    { regex: EMAIL_REGEX, type: "EMAIL" },
    { regex: SSN_REGEX, type: "SSN" },
    { regex: SIN_REGEX, type: "SIN" },
    { regex: NA_PHONE_REGEX, type: "PHONE" },
    { regex: INTL_PHONE_REGEX, type: "PHONE" },
];

const ATTRIBUTE_PLACEHOLDER_PREFIX = "__AI_TRANSLATOR_ATTR_";

// ---------------------------------------------------------------------------
// Core redaction functions
// ---------------------------------------------------------------------------

/**
 * Collect redaction counts/types into accumulators.
 */
function accumulateResult(
    result: RedactionResult,
    totalCount: { value: number },
    allTypes: Set<SensitiveDataType>,
): void {
    totalCount.value += result.redactionCount;
    for (const t of result.typesDetected) {
        allTypes.add(t);
    }
}

/**
 * Redact sensitive data from a plain-text string.
 *
 * Each match is replaced with `[REDACTED:TYPE]` (e.g. `[REDACTED:PHONE]`).
 * When `mode` is `"off"` the text is returned unchanged.
 */
export function redactSensitiveData(
    text: string,
    mode: RedactionMode = "auto",
): RedactionResult {
    if (mode === "off" || !text) {
        return { redactedText: text, redactionCount: 0, typesDetected: [] };
    }

    const typesDetected = new Set<SensitiveDataType>();
    let redactionCount = 0;
    let result = text;

    for (const { regex, type } of PATTERNS) {
        // Reset lastIndex — required for global regexes reused across calls.
        regex.lastIndex = 0;
        result = result.replace(regex, () => {
            redactionCount++;
            typesDetected.add(type);
            return `[REDACTED:${type}]`;
        });
    }

    return {
        redactedText: result,
        redactionCount,
        typesDetected: Array.from(typesDetected),
    };
}

/**
 * Replace quoted HTML attribute values with opaque placeholders so sensitive
 * values never reach the translation provider.  The placeholders can be
 * restored later with {@link restoreHtmlAttributeValues}.
 *
 * This intentionally protects all quoted attribute values, not just a subset
 * like `href`/`title`, because they are not user-visible translation content.
 */
export function protectHtmlAttributeValues(html: string): ProtectedHtmlAttributes {
    if (!html || !html.includes("<")) {
        return {
            protectedHtml: html,
            replacements: [],
        };
    }

    const replacements: ProtectedHtmlAttributes["replacements"] = [];
    let placeholderIndex = 0;

    const protectedHtml = html.replace(/<[^>]*>/g, (tag) => {
        return tag.replace(/=("[^"]*"|'[^']*')/g, (_full, quoted: string) => {
            const quote = quoted[0];
            const originalValue = quoted.slice(1, -1);
            const placeholder = `${ATTRIBUTE_PLACEHOLDER_PREFIX}${placeholderIndex++}__`;
            replacements.push([placeholder, originalValue] as const);
            return `=${quote}${placeholder}${quote}`;
        });
    });

    return {
        protectedHtml,
        replacements,
    };
}

/**
 * Restore placeholders produced by {@link protectHtmlAttributeValues}.
 */
export function restoreHtmlAttributeValues(
    html: string,
    replacements: ReadonlyArray<readonly [placeholder: string, originalValue: string]>,
): string {
    if (!html || replacements.length === 0) {
        return html;
    }

    let restoredHtml = html;
    for (const [placeholder, originalValue] of replacements) {
        restoredHtml = restoredHtml.split(placeholder).join(originalValue);
    }

    return restoredHtml;
}

/**
 * Redact sensitive data from an HTML string while preserving tag structure.
 *
 * The function splits the input into alternating "tag" / "text" segments and
 * only applies redaction to text segments.  Tag segments (including attribute
 * values like `href`, `title`, `data-*`) are passed through unchanged here.
 * Attribute protection is handled separately via placeholder stripping so the
 * original values can be restored after translation without leaking them.
 */
export function redactSensitiveHTML(
    html: string,
    mode: RedactionMode = "auto",
): RedactionResult {
    if (mode === "off" || !html) {
        return { redactedText: html, redactionCount: 0, typesDetected: [] };
    }

    // Short-circuit: if there are no HTML tags, just redact as plain text.
    if (!html.includes("<")) {
        return redactSensitiveData(html, mode);
    }

    const totalCount = { value: 0 };
    const allTypes = new Set<SensitiveDataType>();

    // Match HTML tags (opening, closing, self-closing, comments).
    const TAG_REGEX = /<[^>]*>/g;
    let lastIndex = 0;
    const parts: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = TAG_REGEX.exec(html)) !== null) {
        // Text segment before this tag
        if (match.index > lastIndex) {
            const textSegment = html.slice(lastIndex, match.index);
            const r = redactSensitiveData(textSegment, mode);
            parts.push(r.redactedText);
            accumulateResult(r, totalCount, allTypes);
        }
        // The tag itself — pass through unchanged (see JSDoc above).
        parts.push(match[0]);
        lastIndex = match.index + match[0].length;
    }

    // Trailing text after the last tag
    if (lastIndex < html.length) {
        const textSegment = html.slice(lastIndex);
        const r = redactSensitiveData(textSegment, mode);
        parts.push(r.redactedText);
        accumulateResult(r, totalCount, allTypes);
    }

    return {
        redactedText: parts.join(""),
        redactionCount: totalCount.value,
        typesDetected: Array.from(allTypes),
    };
}

// ---------------------------------------------------------------------------
// Sensitive form-field detection (content-script context)
// ---------------------------------------------------------------------------

const SENSITIVE_INPUT_TYPES = new Set(["password"]);

const SENSITIVE_AUTOCOMPLETE_VALUES = new Set([
    "current-password",
    "new-password",
    "cc-number",
    "cc-csc",
    "cc-exp",
    "cc-exp-month",
    "cc-exp-year",
    "cc-type",
]);

/**
 * Build a CSS selector that matches all sensitive input elements.
 *
 * Derived programmatically from {@link SENSITIVE_INPUT_TYPES} and
 * {@link SENSITIVE_AUTOCOMPLETE_VALUES} so the selector stays in sync with
 * the sets used by {@link isSensitiveFormField}.
 */
function buildSensitiveSelector(): string {
    const parts: string[] = [];
    for (const t of SENSITIVE_INPUT_TYPES) {
        parts.push(`input[type="${t}"]`);
    }
    for (const v of SENSITIVE_AUTOCOMPLETE_VALUES) {
        parts.push(`input[autocomplete~="${v}"]`);
    }
    return parts.join(", ");
}

const SENSITIVE_SELECTOR = buildSensitiveSelector();

/**
 * Check whether any token in the element's `autocomplete` attribute matches
 * a known sensitive value.
 *
 * The `autocomplete` attribute can contain a space-separated list of tokens
 * (e.g. `"section-checkout cc-number"`).  Per the spec we need to check each
 * token individually, not require an exact match on the full string.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
 */
function hasAnySensitiveAutocompleteToken(element: Element): boolean {
    const raw = element.getAttribute("autocomplete");
    if (!raw) return false;

    const tokens = raw.toLowerCase().trim().split(/\s+/);
    return tokens.some((token) => SENSITIVE_AUTOCOMPLETE_VALUES.has(token));
}

/**
 * Returns `true` when the given element is a form field whose value the
 * browser considers sensitive (password inputs or inputs with
 * payment/credential autocomplete hints).
 */
export function isSensitiveFormField(element: Element): boolean {
    if (
        !(element instanceof HTMLInputElement) &&
        !(element instanceof HTMLTextAreaElement)
    ) {
        return false;
    }

    if (element instanceof HTMLInputElement) {
        const inputType = (element.type || "").toLowerCase();
        if (SENSITIVE_INPUT_TYPES.has(inputType)) {
            return true;
        }
    }

    return hasAnySensitiveAutocompleteToken(element);
}

/**
 * Returns `true` when the current browser `Selection` overlaps any element
 * that {@link isSensitiveFormField} considers sensitive.
 *
 * Designed to be called in the content-script context where a full DOM is
 * available.
 */
export function selectionOverlapsSensitiveField(selection: Selection): boolean {
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Resolve the containing Element (text nodes don't have querySelector).
    const element =
        container.nodeType === Node.ELEMENT_NODE
            ? (container as Element)
            : container.parentElement;

    if (!element) return false;

    // If the selection *is* a sensitive field, that's an immediate match.
    if (isSensitiveFormField(element)) return true;

    // Search within the nearest form for any sensitive inputs that intersect
    // the selected range.  We intentionally do NOT fall back to document.body
    // to avoid false positives when an unrelated password input exists
    // elsewhere on the page.
    const ancestor = element.closest("form");
    if (!ancestor) return false;

    const sensitiveInputs = ancestor.querySelectorAll(SENSITIVE_SELECTOR);

    for (const input of sensitiveInputs) {
        if (range.intersectsNode(input)) {
            return true;
        }
    }

    return false;
}
