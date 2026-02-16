export const LANGUAGE_NAMES: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    ar: "Arabic",
    hi: "Hindi",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    vi: "Vietnamese",
    th: "Thai",
    sv: "Swedish",
    da: "Danish",
    no: "Norwegian",
    fi: "Finnish",
    cs: "Czech",
    el: "Greek",
    he: "Hebrew",
    hu: "Hungarian",
    id: "Indonesian",
    ms: "Malay",
    ro: "Romanian",
    sk: "Slovak",
    uk: "Ukrainian",
    bg: "Bulgarian",
    hr: "Croatian",
    sr: "Serbian",
    sl: "Slovenian",
    et: "Estonian",
    lv: "Latvian",
    lt: "Lithuanian",
    fa: "Persian",
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    mr: "Marathi",
    gu: "Gujarati",
    kn: "Kannada",
    ml: "Malayalam",
    pa: "Punjabi",
    ur: "Urdu",
    sw: "Swahili",
    af: "Afrikaans",
    ca: "Catalan",
    gl: "Galician",
    eu: "Basque",
    fil: "Filipino",
    tl: "Tagalog",
};

export type LanguageCode = keyof typeof LANGUAGE_NAMES;

const INVALID_DETECTED_LANGUAGE_CODES = new Set([
    "",
    "und",
    "unknown",
    "auto",
    "zxx",
    "mis",
]);

const INVALID_DETECTED_LANGUAGE_NAMES = new Set([
    "",
    "unknown",
    "undetermined",
    "unidentified",
    "n/a",
]);

export const BASIC_TARGET_LANGUAGES = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
    { value: "it", label: "Italiano" },
    { value: "pt", label: "Português" },
    { value: "ru", label: "Русский" },
    { value: "ja", label: "日本語" },
    { value: "ko", label: "한국어" },
    { value: "zh", label: "中文" },
    { value: "ar", label: "العربية" },
    { value: "hi", label: "हिन्दी" },
] as const;

export type BasicTargetLanguage = (typeof BASIC_TARGET_LANGUAGES)[number]["value"];

export function getLanguageDisplayName(languageCode: string | null): string {
    if (!languageCode) return "Unknown";
    const normalizedCode = languageCode.toLowerCase().split("-")[0];
    return LANGUAGE_NAMES[languageCode] || LANGUAGE_NAMES[normalizedCode] || languageCode;
}

export function getBasicTargetLanguageLabel(value: string): string {
    return (
        BASIC_TARGET_LANGUAGES.find((lang) => lang.value === value)?.label || "English"
    );
}

export function buildBasicTranslationInstructions(targetLanguageLabel: string): string {
    return `Translate the following text to ${targetLanguageLabel}. Keep the same meaning and tone. DO NOT add any additional text or explanations.`;
}

export function buildTranslationInstructionsWithDetection(
    detectedLanguage: string | null,
    detectedLanguageName: string | null,
    targetLanguageLabel: string,
    extraInstructions: string,
): string {
    const normalizedDetectedLanguage = (detectedLanguage || "").trim().toLowerCase();
    const normalizedDetectedLanguageName = (detectedLanguageName || "")
        .trim()
        .toLowerCase();
    const normalizedTargetLanguageName = (targetLanguageLabel || "").trim().toLowerCase();
    const hasDetectedSourceLanguage =
        !INVALID_DETECTED_LANGUAGE_CODES.has(normalizedDetectedLanguage) &&
        !INVALID_DETECTED_LANGUAGE_NAMES.has(normalizedDetectedLanguageName);

    let instructions;

    if (
        hasDetectedSourceLanguage &&
        normalizedDetectedLanguageName !== normalizedTargetLanguageName
    ) {
        instructions = `Translate the following text from ${detectedLanguageName} to ${targetLanguageLabel}.`;
    } else {
        instructions = `Translate this into ${targetLanguageLabel}.`;
    }

    instructions +=
        " Keep the same meaning and tone. DO NOT add any additional text or explanations.";

    if (extraInstructions && extraInstructions.trim()) {
        instructions += `\n\nAdditional instructions: ${extraInstructions.trim()}`;
    }

    return instructions;
}
