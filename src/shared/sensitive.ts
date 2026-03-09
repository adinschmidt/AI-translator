import type { RedactionMode } from "./constants/settings";

/** Categories of sensitive data that can be detected and redacted. */
export type SensitiveDataType = "PHONE" | "SSN" | "SIN" | "EMAIL" | "PASSWORD_FIELD";

/** Result returned by redaction functions. */
export interface RedactionResult {
    redactedText: string;
    redactionCount: number;
    typesDetected: SensitiveDataType[];
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
 * 123-45-6789, 123 45 6789, 123456789
 *
 * Excludes invalid area prefixes: 000, 666, 9xx (per IRS rules).
 * The 3-2-4 grouping distinguishes SSNs from SINs (3-3-3).
 */
const SSN_REGEX =
    /(?<!\d)(?!000|666|9\d\d)\d{3}[-\s]?\d{2}[-\s]?\d{4}(?!\d)/g;

/**
 * Canadian Social Insurance Numbers (SIN):
 * 123-456-789, 123 456 789
 *
 * Requires separators to distinguish from SSNs and other 9-digit sequences.
 * The 3-3-3 grouping is canonical for SINs.
 */
const SIN_REGEX = /(?<!\d)\d{3}[-\s]\d{3}[-\s]\d{3}(?!\d)/g;

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

// ---------------------------------------------------------------------------
// Core redaction functions
// ---------------------------------------------------------------------------

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
 * Redact sensitive data from an HTML string while preserving all tags and
 * attributes.
 *
 * The function splits the input into alternating "tag" / "text" segments and
 * only applies redaction to text segments.  This avoids touching href, src, or
 * any other attribute content and keeps the HTML structurally valid.
 */
export function redactSensitiveHTML(
    html: string,
    mode: RedactionMode = "auto",
): RedactionResult {
    if (mode === "off" || !html) {
        return { redactedText: html, redactionCount: 0, typesDetected: [] };
    }

    let totalCount = 0;
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
            totalCount += r.redactionCount;
            r.typesDetected.forEach((t) => allTypes.add(t));
        }
        // The tag itself — pass through unchanged
        parts.push(match[0]);
        lastIndex = match.index + match[0].length;
    }

    // Trailing text after the last tag (or the entire string if no tags)
    if (lastIndex < html.length) {
        const textSegment = html.slice(lastIndex);
        const r = redactSensitiveData(textSegment, mode);
        parts.push(r.redactedText);
        totalCount += r.redactionCount;
        r.typesDetected.forEach((t) => allTypes.add(t));
    }

    return {
        redactedText: parts.join(""),
        redactionCount: totalCount,
        typesDetected: Array.from(allTypes),
    };
}

// ---------------------------------------------------------------------------
// Sensitive form-field detection (content-script context)
// ---------------------------------------------------------------------------

const SENSITIVE_INPUT_TYPES = new Set(["password", "hidden"]);

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
 * Returns `true` when the given element is a form field whose value the
 * browser considers sensitive (password inputs, hidden fields, or inputs with
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

    const autocomplete = (element.getAttribute("autocomplete") || "")
        .toLowerCase()
        .trim();
    if (autocomplete && SENSITIVE_AUTOCOMPLETE_VALUES.has(autocomplete)) {
        return true;
    }

    return false;
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

    // Search within the nearest form (or parent) for any sensitive inputs that
    // intersect the selected range.
    const ancestor =
        element.closest("form") || element.parentElement || document.body;

    const sensitiveSelector = [
        'input[type="password"]',
        'input[type="hidden"]',
        'input[autocomplete="current-password"]',
        'input[autocomplete="new-password"]',
        'input[autocomplete="cc-number"]',
        'input[autocomplete="cc-csc"]',
        'input[autocomplete="cc-exp"]',
        'input[autocomplete="cc-exp-month"]',
        'input[autocomplete="cc-exp-year"]',
        'input[autocomplete="cc-type"]',
    ].join(", ");

    const sensitiveInputs = ancestor.querySelectorAll(sensitiveSelector);

    for (const input of sensitiveInputs) {
        if (range.intersectsNode(input)) {
            return true;
        }
    }

    return false;
}
