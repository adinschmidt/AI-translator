export const SETTINGS_MODE_KEY = "settingsMode";
export const BASIC_TARGET_LANGUAGE_KEY = "basicTargetLanguage";
export const ADVANCED_TARGET_LANGUAGE_KEY = "advancedTargetLanguage";
export const EXTRA_INSTRUCTIONS_KEY = "extraInstructions";
export const SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY = "showTranslateButtonOnSelection";

export const SETTINGS_MODE_BASIC = "basic";
export const SETTINGS_MODE_ADVANCED = "advanced";

export type SettingsMode = typeof SETTINGS_MODE_BASIC | typeof SETTINGS_MODE_ADVANCED;

export const BASIC_TARGET_LANGUAGE_DEFAULT = "en";
export const ADVANCED_TARGET_LANGUAGE_DEFAULT = "en";

export const DEFAULT_TRANSLATION_INSTRUCTIONS =
    "Translate the following text to English. Keep the same meaning and tone. DO NOT add any additional text or explanations.";

export const DEFAULT_SYSTEM_PROMPT =
    "You are a professional translator. Translate the provided text accurately. " +
    "Preserve the provided HTML tags and their structure; do not add new wrapper tags or attributes.";

export const INSTRUCT_SYSTEM_PROMPT =
    "You are a professional translator. Output only the translated text with no " +
    "explanations, reasoning, or additional commentary.";

export const HTML_PRESERVING_SYSTEM_PROMPT =
    "You are a professional translator. Translate only the human-readable text content. " +
    "Preserve all HTML tags exactly (like <a>, <b>, <em>, <strong>, <br>, etc.) and their attributes (especially href, title). " +
    "Do NOT add, remove, or modify any HTML tags or attributes. " +
    "Do NOT wrap output in markdown code fences or quotes. " +
    "Return only the translated HTML snippet.";

export const HTML_PRESERVING_STRICT_PROMPT =
    "You are a professional translator. CRITICAL RULES:\n" +
    "1. Translate ONLY the human-readable text between HTML tags.\n" +
    "2. Preserve ALL HTML tags exactly as they appear (a, b, em, strong, br, span, etc.).\n" +
    "3. Preserve ALL attributes exactly (href, title, lang, dir, etc.).\n" +
    "4. Do NOT add new tags, remove existing tags, or change tag structure.\n" +
    "5. Do NOT add markdown formatting, code fences, or quotes around output.\n" +
    "6. Return ONLY the translated HTML snippet, nothing else.";

export const CHARS_PER_TOKEN_ESTIMATE = 4;
export const MAX_BATCH_INPUT_TOKENS = 3000;
export const MAX_BATCH_UNITS = 25;
export const MAX_BATCH_INPUT_CHARS = MAX_BATCH_INPUT_TOKENS * CHARS_PER_TOKEN_ESTIMATE;
export const MAX_BATCH_OUTPUT_TOKENS = 4096;
export const HTML_UNIT_SEPARATOR = "\n〈UNIT〉\n";
export const MAX_UNIT_TOKENS = 1024;

export const STREAM_PORT_NAME = "translationStream";
export const HTML_TRANSLATION_PORT_NAME = "htmlTranslation";
export const STREAM_UPDATE_THROTTLE_MS = 120;
export const STREAM_KEEP_ALIVE_INTERVAL_MS = 20000;

// Rate limit retry configuration
export const RATE_LIMIT_MAX_RETRIES = 5;
export const RATE_LIMIT_BASE_DELAY_MS = 1000;
export const RATE_LIMIT_MAX_DELAY_MS = 60000;
export const RATE_LIMIT_BACKOFF_MULTIPLIER = 2;

export function buildStandardPrompt(
    userInstructions: string,
    textToTranslate: string,
): string {
    return `${userInstructions}

If this contains HTML, preserve the provided HTML tags and their structure; do not add new wrapper tags or attributes.
If this is already in the target language, do not translate it, instead repeat it back verbatim.

Text to translate: ${textToTranslate}`;
}

export function buildInstructPrompt(
    userInstructions: string,
    textToTranslate: string,
): string {
    return `${userInstructions}

If this contains HTML, preserve the provided HTML tags and their structure; do not add new wrapper tags or attributes.
If this is already in the target language, repeat it back verbatim.

Text to translate:
${textToTranslate}

Translated text:`;
}

export function createRequestId(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isInstructModelName(modelName: string): boolean {
    return typeof modelName === "string" &&
        modelName.toLowerCase().includes("instruct");
}

export function stripThinkBlocks(text: string): string {
    return text.replace(/[\s\S]*?<\/think>/gi, "").trim();
}
