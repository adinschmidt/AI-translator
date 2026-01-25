import { generateText, streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

const SETTINGS_MODE_KEY = "settingsMode";
const BASIC_TARGET_LANGUAGE_KEY = "basicTargetLanguage";
const ADVANCED_TARGET_LANGUAGE_KEY = "advancedTargetLanguage";
const EXTRA_INSTRUCTIONS_KEY = "extraInstructions";

const SETTINGS_MODE_BASIC = "basic";
const SETTINGS_MODE_ADVANCED = "advanced";

const BASIC_PROVIDERS = ["openai", "anthropic", "google"];

const BASIC_TARGET_LANGUAGE_DEFAULT = "en";
const ADVANCED_TARGET_LANGUAGE_DEFAULT = "en";

// Language code to name mapping (ISO 639-1)
const LANGUAGE_NAMES = {
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

/**
 * Get the display name for a language code
 */
function getLanguageDisplayName(languageCode) {
    if (!languageCode) return "Unknown";
    const normalizedCode = languageCode.toLowerCase().split("-")[0];
    return LANGUAGE_NAMES[languageCode] || LANGUAGE_NAMES[normalizedCode] || languageCode;
}

const BASIC_TARGET_LANGUAGES = [
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
];

function getBasicTargetLanguageLabel(value) {
    return (
        BASIC_TARGET_LANGUAGES.find((lang) => lang.value === value)?.label || "English"
    );
}

function buildBasicTranslationInstructions(targetLanguageLabel) {
    return `Translate the following text to ${targetLanguageLabel}. Keep the same meaning and tone. DO NOT add any additional text or explanations.`;
}

/**
 * Build translation instructions with detected source language and optional extra instructions
 * @param {string|null} detectedLanguageName - Name of detected source language (or null if unknown)
 * @param {string} targetLanguageLabel - Name of target language
 * @param {string} extraInstructions - Optional additional instructions from user
 */
function buildTranslationInstructionsWithDetection(
    detectedLanguageName,
    targetLanguageLabel,
    extraInstructions,
) {
    let instructions;

    if (detectedLanguageName && detectedLanguageName !== targetLanguageLabel) {
        instructions = `Translate the following text from ${detectedLanguageName} to ${targetLanguageLabel}.`;
    } else {
        instructions = `Translate the following text to ${targetLanguageLabel}.`;
    }

    instructions +=
        " Keep the same meaning and tone. DO NOT add any additional text or explanations.";

    if (extraInstructions && extraInstructions.trim()) {
        instructions += `\n\nAdditional instructions: ${extraInstructions.trim()}`;
    }

    return instructions;
}

const PROVIDERS = [
    "openai",
    "anthropic",
    "google",
    "groq",
    "grok",
    "openrouter",
    "deepseek",
    "mistral",
    "qwen",
    "cerebras",
    "ollama",
];

// Per-provider defaults (for when no stored settings exist)
const PROVIDER_DEFAULTS = {
    openai: {
        apiEndpoint: "https://api.openai.com/v1/chat/completions",
        modelName: "gpt-5-mini",
    },
    anthropic: {
        apiEndpoint: "https://api.anthropic.com/v1/messages",
        modelName: "claude-haiku-4-5",
    },
    google: {
        apiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
        modelName: "gemini-flash-lite-latest",
    },
    groq: {
        apiEndpoint: "https://api.groq.com/openai/v1/chat/completions",
        modelName: "kimi-k2-instruct",
    },
    grok: {
        apiEndpoint: "https://api.x.ai/v1/chat/completions",
        modelName: "grok-4-1-fast-non-reasoning",
    },
    openrouter: {
        apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
        modelName: "openrouter/auto",
    },
    deepseek: {
        apiEndpoint: "https://api.deepseek.com/v1/chat/completions",
        modelName: "deepseek-chat",
    },
    mistral: {
        apiEndpoint: "https://api.mistral.ai/v1/chat/completions",
        modelName: "mistral-small-latest",
    },
    qwen: {
        apiEndpoint:
            "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
        modelName: "qwen-turbo",
    },
    cerebras: {
        apiEndpoint: "https://api.cerebras.ai/v1/chat/completions",
        modelName: "qwen-3-235b-a22b-instruct-2507",
    },
    ollama: {
        apiEndpoint: "http://localhost:11434",
        modelName: "llama3.2",
    },
};

function resolveProviderDefaults(provider) {
    const defaults = PROVIDER_DEFAULTS[provider] || {};
    return {
        apiKey: "",
        apiEndpoint: defaults.apiEndpoint || "",
        modelName: defaults.modelName || "",
        apiType: provider,
    };
}

// DEFAULT_SETTINGS kept for internal fallback usage (e.g. non-migrated installs)
const DEFAULT_SETTINGS = resolveProviderDefaults("openai");

// Default translation instructions (can be overridden by user in settings)
const DEFAULT_TRANSLATION_INSTRUCTIONS =
    "Translate the following text to English. Keep the same meaning and tone. DO NOT add any additional text or explanations.";

const DEFAULT_SYSTEM_PROMPT =
    "You are a professional translator. Translate the provided text accurately. " +
    "Preserve the provided HTML tags and their structure; do not add new wrapper tags or attributes.";

const INSTRUCT_SYSTEM_PROMPT =
    "You are a professional translator. Output only the translated text with no " +
    "explanations, reasoning, or additional commentary.";

// Placeholder-safe system prompt for unit translation (v2)
const PLACEHOLDER_SAFE_SYSTEM_PROMPT =
    "You are a professional translator. Translate only the human-language text. " +
    "Leave all placeholder tokens (like ⟦P0⟧, ⟦/P0⟧, ⟦P1⟧, etc.) exactly unchanged. " +
    "Return only the translated text with placeholders preserved. " +
    "Do not add quotes, markdown fences, explanations, or any formatting.";

const PLACEHOLDER_STRICT_SYSTEM_PROMPT =
    "You are a professional translator. CRITICAL RULES:\n" +
    "1. Translate ONLY the human-language text between placeholders.\n" +
    "2. Do NOT modify, remove, or reorder any placeholder tokens (⟦P0⟧, ⟦/P0⟧, etc.).\n" +
    "3. Do NOT add any text besides the translation.\n" +
    "4. Return ONLY the translated text with all original placeholders intact.\n" +
    "5. No quotes, no markdown, no explanations.";

// Max tokens for unit translation (sane cap to avoid truncation)
const MAX_UNIT_TOKENS = 1024;

const STREAM_PORT_NAME = "translationStream";
const STREAM_UPDATE_THROTTLE_MS = 120;
const STREAM_KEEP_ALIVE_INTERVAL_MS = 20000;
const activeStreams = new Map();

function isInstructModelName(modelName) {
    return typeof modelName === "string" && modelName.toLowerCase().includes("instruct");
}

function buildStandardPrompt(userInstructions, textToTranslate) {
    return `${userInstructions}

If this contains HTML, preserve the provided HTML tags and their structure; do not add new wrapper tags or attributes.
If this is already in the target language, do not translate it, instead repeat it back verbatim.

Text to translate: ${textToTranslate}`;
}

function buildInstructPrompt(userInstructions, textToTranslate) {
    return `${userInstructions}

If this contains HTML, preserve the provided HTML tags and their structure; do not add new wrapper tags or attributes.
If this is already in the target language, repeat it back verbatim.

Text to translate:
${textToTranslate}

Translated text:`;
}

function createRequestId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeOpenAIBaseUrl(apiEndpoint, provider) {
    const fallback = PROVIDER_DEFAULTS[provider]?.apiEndpoint || "";
    const endpoint = (apiEndpoint || fallback).trim();
    if (!endpoint) {
        return "";
    }

    let base = endpoint.replace(/\/+$/, "");
    if (base.endsWith("/chat/completions")) {
        base = base.slice(0, -"/chat/completions".length);
    }

    if (provider === "ollama" && !base.endsWith("/v1")) {
        base = `${base}/v1`;
    }

    return base;
}

function normalizeAnthropicBaseUrl(apiEndpoint) {
    const fallback = PROVIDER_DEFAULTS.anthropic.apiEndpoint || "";
    const endpoint = (apiEndpoint || fallback).trim();
    if (!endpoint) {
        return "";
    }

    let base = endpoint.replace(/\/+$/, "");
    if (base.endsWith("/messages")) {
        base = base.slice(0, -"/messages".length);
    }

    return base;
}

function normalizeGoogleBaseUrl(apiEndpoint) {
    const fallback = PROVIDER_DEFAULTS.google.apiEndpoint || "";
    const endpoint = (apiEndpoint || fallback).trim();
    if (!endpoint) {
        return "";
    }

    let base = endpoint.replace(/\/+$/, "");
    const modelsIndex = base.indexOf("/models/");
    if (modelsIndex !== -1) {
        base = base.slice(0, modelsIndex);
    }

    if (base.endsWith(":generateContent")) {
        base = base.replace(/:generateContent$/, "");
    }

    return base;
}

function resolveProviderModel(provider, apiKey, apiEndpoint, modelName) {
    if (provider === "anthropic") {
        const anthropic = createAnthropic({
            apiKey,
            baseURL: normalizeAnthropicBaseUrl(apiEndpoint) || undefined,
        });
        return anthropic(modelName);
    }

    if (provider === "google") {
        const google = createGoogleGenerativeAI({
            apiKey,
            baseURL: normalizeGoogleBaseUrl(apiEndpoint) || undefined,
        });
        return google(modelName);
    }

    const baseURL = normalizeOpenAIBaseUrl(apiEndpoint, provider);
    const headers =
        provider === "openrouter"
            ? {
                  "HTTP-Referer": "https://github.com/",
                  "X-Title": "AI Translator Extension",
              }
            : undefined;
    const openai = createOpenAI({
        apiKey: apiKey || "ollama",
        baseURL: baseURL || undefined,
        headers,
    });
    return openai(modelName);
}

function resolveMaxTokens(provider, isFullPage) {
    if (provider === "openrouter") {
        return isFullPage ? 8192 : 2048;
    }

    if (provider === "google") {
        return isFullPage ? 65536 : 8000;
    }

    if (provider === "groq" || provider === "cerebras") {
        return undefined;
    }

    return isFullPage ? 4000 : 800;
}

function shouldStripThinkBlocks(provider) {
    return provider === "groq" || provider === "cerebras";
}

function stripThinkBlocks(text) {
    return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function startStreamKeepAlive() {
    return setInterval(() => {
        chrome.runtime.getPlatformInfo(() => {});
    }, STREAM_KEEP_ALIVE_INTERVAL_MS);
}

const SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY = "showTranslateButtonOnSelection";

// --- Context Menu Setup ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get([SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.warn(
                "Could not read selection button setting:",
                chrome.runtime.lastError.message,
            );
            return;
        }

        if (typeof result[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY] !== "boolean") {
            chrome.storage.sync.set({
                [SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY]: true,
            });
        }
    });
    // Context menu for selected text
    chrome.contextMenus.create({
        id: "translateSelectedText",
        title: "Translate Selected Text",
        contexts: ["selection"],
    });

    // Context menu for the whole page (always visible, even if text is selected)
    chrome.contextMenus.create({
        id: "translateFullPage",
        title: "Translate Entire Page",
        contexts: ["page", "selection"],
    });

    console.log("AI Translator context menus created.");
});

// --- Message Listener (for Element Translation Only) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "cancelTranslation") {
        if (sender.tab?.id) {
            cancelActiveStream(sender.tab.id, request.requestId);
        }
        sendResponse({ status: "ok" });
        return;
    }

    // Handle target language lookup request (for content script language detection)
    if (request.action === "getTargetLanguage") {
        chrome.storage.sync.get(
            [SETTINGS_MODE_KEY, BASIC_TARGET_LANGUAGE_KEY, ADVANCED_TARGET_LANGUAGE_KEY],
            (settings) => {
                const mode = settings[SETTINGS_MODE_KEY] || SETTINGS_MODE_BASIC;
                const targetLanguage =
                    mode === SETTINGS_MODE_BASIC
                        ? settings[BASIC_TARGET_LANGUAGE_KEY] ||
                          BASIC_TARGET_LANGUAGE_DEFAULT
                        : settings[ADVANCED_TARGET_LANGUAGE_KEY] ||
                          ADVANCED_TARGET_LANGUAGE_DEFAULT;

                sendResponse({ targetLanguage });
            },
        );
        return true; // Async response
    }

    // Handle translation with detected language
    if (request.action === "translateSelectedHtmlWithDetection") {
        if (!sender.tab?.id) {
            sendResponse({ status: "error", message: "No sender tab ID" });
            return;
        }

        if (!request.html) {
            sendResponse({ status: "error", message: "No HTML provided" });
            return;
        }

        const requestId = createRequestId();
        getSettingsAndTranslateWithDetection(
            request.html,
            sender.tab.id,
            false,
            request.detectedLanguage,
            request.detectedLanguageName,
            requestId,
        );
        sendResponse({ status: "ok" });
        return;
    }

    if (request.action === "translateSelectedHtml") {
        if (!sender.tab?.id) {
            sendResponse({ status: "error", message: "No sender tab ID" });
            return;
        }

        if (!request.html) {
            sendResponse({ status: "error", message: "No HTML provided" });
            return;
        }

        const requestId = createRequestId();
        getSettingsAndTranslate(request.html, sender.tab.id, false, requestId);
        sendResponse({ status: "ok" });
        return;
    }

    // Handle translateUnit for placeholder-based full-page translation (v2)
    if (request.action === "translateUnit") {
        console.log("Received translateUnit request:", {
            contentLength: request.content?.length,
            isPlaceholderFormat: request.meta?.isPlaceholderFormat,
            isRetry: request.meta?.isRetry,
        });

        if (!request.content) {
            sendResponse({ error: "No content provided" });
            return;
        }

        translateUnitText(
            request.content,
            request.targetLanguage,
            request.meta?.isRetry || false,
        )
            .then((translatedText) => {
                console.log("translateUnit completed, length:", translatedText.length);
                sendResponse({ translatedText });
            })
            .catch((error) => {
                console.error("translateUnit error:", error);
                sendResponse({ error: error.message });
            });

        return true; // Async response
    }

    // Handle individual element translation
    if (request.action === "translateElement") {
        console.log("Received translateElement request:", {
            textLength: request.text?.length,
            elementPath: request.elementPath,
        });

        if (sender.tab?.id) {
            translateElementText(request.text, request.elementPath, sender.tab.id)
                .then((translation) => {
                    console.log(
                        "Element translation completed for:",
                        request.elementPath,
                    );
                    sendResponse({ translatedText: translation });
                })
                .catch((error) => {
                    console.error("Element translation error:", error);
                    sendResponse({
                        error: error.message,
                        elementPath: request.elementPath,
                    });
                });
        } else {
            console.error("Could not get sender tab ID for element translation.");
            sendResponse({ error: "No sender tab ID" });
        }
        return true; // Indicate async response
    }
    // Handle other messages if necessary in the future
});

// --- Helper Function to Ensure Content Script is Injected ---
async function ensureContentScriptInjected(tabId) {
    try {
        // Inject DOMPurify and content script together
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["purify.min.js", "content.js"],
        });
        await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ["styles.css"],
        });
        // Small delay to ensure message listener is ready
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log(`DOMPurify, content script, and CSS injected into tab ${tabId}`);
    } catch (error) {
        console.error(`Failed to inject content script into tab ${tabId}:`, error);
        throw error;
    }
}

// --- Context Menu Click Handler ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("Context menu item clicked.", info, tab);
    if (!tab || !tab.id) {
        console.error("Cannot get tab ID.");
        return;
    }
    const tabId = tab.id;

    // Ensure content script is injected before sending messages
    try {
        await ensureContentScriptInjected(tabId);
    } catch (error) {
        console.error("Could not inject content script. Aborting operation.", error);
        return;
    }

    // Handle Selected Text Translation
    if (info.menuItemId === "translateSelectedText" && info.selectionText) {
        console.log("Action: Translate Selected Text - Getting HTML content");
        // First, get the HTML content from the selected text to preserve hyperlinks
        chrome.tabs.sendMessage(tabId, { action: "extractSelectedHtml" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(
                    "Error getting selected HTML:",
                    chrome.runtime.lastError.message,
                );
                // Selected text translation error -> not full page, show error popup
                notifyContentScript(
                    tabId,
                    "Could not extract selected content",
                    false,
                    true,
                    false,
                );
                return;
            }

            if (response && response.html) {
                console.log("Received selected HTML:", response.html);
                const requestId = createRequestId();
                getSettingsAndTranslate(response.html, tabId, false, requestId); // false = not full page
            } else {
                console.error("No HTML content received from content script");
                // Selected text translation error -> not full page, show error popup
                notifyContentScript(
                    tabId,
                    "Could not extract selected HTML",
                    false,
                    true,
                    false,
                );
            }
        });
    }
    // Handle Full Page Translation (Manual Trigger) - V2: delegate to content script
    else if (info.menuItemId === "translateFullPage") {
        console.log("Action: Translate Full Page V2 requested for tab:", tabId);

        // Simply tell the content script to start the v2 translation flow
        // The content script will handle collecting units, queueing, and applying translations
        chrome.tabs.sendMessage(
            tabId,
            { action: "startElementTranslation" },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error(
                        "Error starting full page translation:",
                        chrome.runtime.lastError.message,
                    );
                    return;
                }
                console.log("Full page translation v2 started:", response);
            },
        );
    }
});

// --- Helper Function to Translate Individual Element Text ---
async function translateElementText(textToTranslate, elementPath, tabId) {
    console.log(
        `Translating element text (length: ${textToTranslate.length}) for path: ${elementPath}`,
    );

    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(
            [
                "apiKey",
                "apiEndpoint",
                "apiType",
                "modelName",
                "providerSettings",
                SETTINGS_MODE_KEY,
                BASIC_TARGET_LANGUAGE_KEY,
            ],
            (settings) => {
                const {
                    apiKey,
                    apiEndpoint,
                    apiType,
                    modelName,
                    providerSettings = {},
                    [SETTINGS_MODE_KEY]: settingsMode,
                    [BASIC_TARGET_LANGUAGE_KEY]: basicTargetLanguage,
                } = settings;

                const mode = settingsMode || SETTINGS_MODE_BASIC;

                let activeProvider =
                    apiType && PROVIDERS.includes(apiType) ? apiType : "openai";
                if (
                    mode === SETTINGS_MODE_BASIC &&
                    !BASIC_PROVIDERS.includes(activeProvider)
                ) {
                    activeProvider = "openai";
                }

                const perProvider = providerSettings[activeProvider];

                const effective = perProvider
                    ? {
                          apiKey: perProvider.apiKey || "",
                          apiEndpoint:
                              perProvider.apiEndpoint ||
                              PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                              "",
                          modelName:
                              perProvider.modelName ||
                              PROVIDER_DEFAULTS[activeProvider]?.modelName ||
                              "",
                          translationInstructions:
                              perProvider.translationInstructions ||
                              DEFAULT_TRANSLATION_INSTRUCTIONS,
                          apiType: activeProvider,
                      }
                    : {
                          apiKey: apiKey || "",
                          apiEndpoint:
                              apiEndpoint ||
                              PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                              "",
                          modelName:
                              modelName ||
                              PROVIDER_DEFAULTS[activeProvider]?.modelName ||
                              "",
                          translationInstructions: DEFAULT_TRANSLATION_INSTRUCTIONS,
                          apiType: activeProvider,
                      };

                // In Basic mode, always use fixed endpoint/model and auto-generated instructions.
                if (mode === SETTINGS_MODE_BASIC) {
                    const languageValue =
                        basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT;
                    const languageLabel = getBasicTargetLanguageLabel(languageValue);
                    effective.apiEndpoint =
                        PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                        effective.apiEndpoint;
                    effective.modelName = PROVIDER_DEFAULTS[activeProvider]?.modelName;
                    effective.translationInstructions =
                        buildBasicTranslationInstructions(languageLabel);
                }

                const {
                    apiKey: finalKey,
                    apiEndpoint: finalEndpoint,
                    apiType: finalType,
                    modelName: finalModel,
                    translationInstructions: finalInstructions,
                } = effective;

                if (!finalEndpoint || (!finalKey && finalType !== "ollama")) {
                    reject(
                        new Error(
                            "API Key or Endpoint not set. Please configure in extension settings.",
                        ),
                    );
                    return;
                }

                // Call the API for element translation
                translateTextApiCall(
                    textToTranslate,
                    finalKey,
                    finalEndpoint,
                    finalType,
                    false,
                    finalModel,
                    finalInstructions,
                ) // false = not full page
                    .then((translation) => {
                        console.log("Element translation received:", translation);
                        resolve(translation);
                    })
                    .catch((error) => {
                        console.error("Element translation error:", error);
                        reject(error);
                    });
            },
        );
    });
}

// --- Helper Function to Translate Unit Text with Placeholder-Safe Prompting (v2) ---
async function translateUnitText(content, targetLanguage = null, isRetry = false) {
    console.log(`translateUnitText (length: ${content.length}, isRetry: ${isRetry})`);

    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(
            [
                "apiKey",
                "apiEndpoint",
                "apiType",
                "modelName",
                "providerSettings",
                SETTINGS_MODE_KEY,
                BASIC_TARGET_LANGUAGE_KEY,
                ADVANCED_TARGET_LANGUAGE_KEY,
            ],
            async (settings) => {
                const {
                    apiKey,
                    apiEndpoint,
                    apiType,
                    modelName,
                    providerSettings = {},
                    [SETTINGS_MODE_KEY]: settingsMode,
                    [BASIC_TARGET_LANGUAGE_KEY]: basicTargetLanguage,
                    [ADVANCED_TARGET_LANGUAGE_KEY]: advancedTargetLanguage,
                } = settings;

                const mode = settingsMode || SETTINGS_MODE_BASIC;

                let activeProvider =
                    apiType && PROVIDERS.includes(apiType) ? apiType : "openai";
                if (
                    mode === SETTINGS_MODE_BASIC &&
                    !BASIC_PROVIDERS.includes(activeProvider)
                ) {
                    activeProvider = "openai";
                }

                const perProvider = providerSettings[activeProvider];

                const effective = perProvider
                    ? {
                          apiKey: perProvider.apiKey || "",
                          apiEndpoint:
                              perProvider.apiEndpoint ||
                              PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                              "",
                          modelName:
                              perProvider.modelName ||
                              PROVIDER_DEFAULTS[activeProvider]?.modelName ||
                              "",
                          apiType: activeProvider,
                      }
                    : {
                          apiKey: apiKey || "",
                          apiEndpoint:
                              apiEndpoint ||
                              PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                              "",
                          modelName:
                              modelName ||
                              PROVIDER_DEFAULTS[activeProvider]?.modelName ||
                              "",
                          apiType: activeProvider,
                      };

                // In Basic mode, use fixed endpoint/model
                if (mode === SETTINGS_MODE_BASIC) {
                    effective.apiEndpoint =
                        PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                        effective.apiEndpoint;
                    effective.modelName = PROVIDER_DEFAULTS[activeProvider]?.modelName;
                }

                const {
                    apiKey: finalKey,
                    apiEndpoint: finalEndpoint,
                    apiType: finalType,
                    modelName: finalModel,
                } = effective;

                if (!finalEndpoint || (!finalKey && finalType !== "ollama")) {
                    reject(
                        new Error(
                            "API Key or Endpoint not set. Please configure in extension settings.",
                        ),
                    );
                    return;
                }

                // Determine target language label
                const languageValue =
                    targetLanguage ||
                    (mode === SETTINGS_MODE_BASIC
                        ? basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT
                        : advancedTargetLanguage || ADVANCED_TARGET_LANGUAGE_DEFAULT);
                const languageLabel = getBasicTargetLanguageLabel(languageValue);

                // Build system prompt - use stricter version on retry
                const systemPrompt = isRetry
                    ? PLACEHOLDER_STRICT_SYSTEM_PROMPT
                    : PLACEHOLDER_SAFE_SYSTEM_PROMPT;

                // Build user prompt
                const userPrompt = `Translate the following text to ${languageLabel}. Preserve all placeholder tokens exactly.\n\n${content}`;

                try {
                    const model = resolveProviderModel(
                        finalType,
                        finalKey,
                        finalEndpoint,
                        finalModel,
                    );

                    const result = await generateText({
                        model,
                        system: systemPrompt,
                        prompt: userPrompt,
                        maxTokens: MAX_UNIT_TOKENS,
                    });

                    let translatedText = result.text || "";

                    // Strip think blocks if needed
                    if (shouldStripThinkBlocks(finalType)) {
                        translatedText = stripThinkBlocks(translatedText);
                    }

                    resolve(translatedText.trim());
                } catch (error) {
                    console.error("translateUnitText API error:", error);
                    reject(error);
                }
            },
        );
    });
}

// --- Helper Function to Get Settings and Call API ---
function getSettingsAndTranslate(textToTranslate, tabId, isFullPage, requestId = null) {
    console.log("getSettingsAndTranslate called.", {
        textToTranslate,
        tabId,
        isFullPage,
    });
    chrome.storage.sync.get(
        [
            "apiKey",
            "apiEndpoint",
            "apiType",
            "modelName",
            "providerSettings",
            SETTINGS_MODE_KEY,
            BASIC_TARGET_LANGUAGE_KEY,
        ],
        (settings) => {
            console.log("Settings retrieved from storage:", settings);
            const {
                apiKey,
                apiEndpoint,
                apiType,
                modelName,
                providerSettings = {},
                [SETTINGS_MODE_KEY]: settingsMode,
                [BASIC_TARGET_LANGUAGE_KEY]: basicTargetLanguage,
            } = settings;

            const mode = settingsMode || SETTINGS_MODE_BASIC;

            let activeProvider =
                apiType && PROVIDERS.includes(apiType) ? apiType : "openai";
            if (
                mode === SETTINGS_MODE_BASIC &&
                !BASIC_PROVIDERS.includes(activeProvider)
            ) {
                activeProvider = "openai";
            }

            const perProvider = providerSettings[activeProvider];

            const effective = perProvider
                ? {
                      apiKey: perProvider.apiKey || "",
                      apiEndpoint:
                          perProvider.apiEndpoint ||
                          PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                          "",
                      modelName:
                          perProvider.modelName ||
                          PROVIDER_DEFAULTS[activeProvider]?.modelName ||
                          "",
                      translationInstructions:
                          perProvider.translationInstructions ||
                          DEFAULT_TRANSLATION_INSTRUCTIONS,
                      apiType: activeProvider,
                  }
                : {
                      apiKey: apiKey || "",
                      apiEndpoint:
                          apiEndpoint ||
                          PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                          "",
                      modelName:
                          modelName || PROVIDER_DEFAULTS[activeProvider]?.modelName || "",
                      translationInstructions: DEFAULT_TRANSLATION_INSTRUCTIONS,
                      apiType: activeProvider,
                  };

            // In Basic mode, always use fixed endpoint/model and auto-generated instructions.
            if (mode === SETTINGS_MODE_BASIC) {
                const languageValue =
                    basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT;
                const languageLabel = getBasicTargetLanguageLabel(languageValue);
                effective.apiEndpoint =
                    PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                    effective.apiEndpoint;
                effective.modelName = PROVIDER_DEFAULTS[activeProvider]?.modelName;
                effective.translationInstructions =
                    buildBasicTranslationInstructions(languageLabel);
            }

            const {
                apiKey: finalKey,
                apiEndpoint: finalEndpoint,
                apiType: finalType,
                modelName: finalModel,
                translationInstructions: finalInstructions,
            } = effective;

            const resolvedRequestId = requestId || createRequestId();

            if (!finalEndpoint || (!finalKey && finalType !== "ollama")) {
                const errorMsg =
                    "Translation Error: API Key or Endpoint not set. Please configure in extension settings.";
                console.error(errorMsg);
                // Send error back to content script to update the popup/indicator
                notifyContentScript(
                    tabId,
                    errorMsg,
                    isFullPage,
                    true,
                    false,
                    resolvedRequestId,
                );
                return;
            }

            if (!isFullPage) {
                notifyContentScript(
                    tabId,
                    "Translating...",
                    false,
                    false,
                    true,
                    resolvedRequestId,
                );

                streamSelectedTranslation(
                    tabId,
                    resolvedRequestId,
                    textToTranslate,
                    finalKey,
                    finalEndpoint,
                    finalType,
                    finalModel,
                    finalInstructions,
                )
                    .then((translation) => {
                        if (!translation) {
                            return;
                        }
                        notifyContentScript(
                            tabId,
                            translation,
                            false,
                            false,
                            false,
                            resolvedRequestId,
                        );
                    })
                    .catch((error) => {
                        console.error("Translation error:", error);
                        notifyContentScript(
                            tabId,
                            `Translation Error: ${error.message}`,
                            false,
                            true,
                            false,
                            resolvedRequestId,
                        );
                    });
                return;
            }

            console.log(
                "Attempting to call translateTextApiCall with resolved provider settings.",
            );

            // Call the API - the promise resolution/rejection will handle sending the final result
            translateTextApiCall(
                textToTranslate,
                finalKey,
                finalEndpoint,
                finalType,
                isFullPage,
                finalModel,
                finalInstructions,
            )
                .then((translation) => {
                    console.log("Translation received (length):", translation.length);
                    // Send final translation result
                    notifyContentScript(
                        tabId,
                        translation,
                        isFullPage,
                        false,
                        false,
                        resolvedRequestId,
                    );
                })
                .catch((error) => {
                    console.error("Translation error:", error);
                    // Send final error result
                    notifyContentScript(
                        tabId,
                        `Translation Error: ${error.message}`,
                        isFullPage,
                        true,
                        false,
                        resolvedRequestId,
                    );
                });
        },
    );
}

// --- Helper Function to Get Settings and Translate with Detected Language ---
function getSettingsAndTranslateWithDetection(
    textToTranslate,
    tabId,
    isFullPage,
    detectedLanguage,
    detectedLanguageName,
    requestId = null,
) {
    console.log("getSettingsAndTranslateWithDetection called.", {
        textToTranslate,
        tabId,
        isFullPage,
        detectedLanguage,
        detectedLanguageName,
    });
    chrome.storage.sync.get(
        [
            "apiKey",
            "apiEndpoint",
            "apiType",
            "modelName",
            "providerSettings",
            SETTINGS_MODE_KEY,
            BASIC_TARGET_LANGUAGE_KEY,
            ADVANCED_TARGET_LANGUAGE_KEY,
            EXTRA_INSTRUCTIONS_KEY,
        ],
        (settings) => {
            console.log("Settings retrieved from storage:", settings);
            const {
                apiKey,
                apiEndpoint,
                apiType,
                modelName,
                providerSettings = {},
                [SETTINGS_MODE_KEY]: settingsMode,
                [BASIC_TARGET_LANGUAGE_KEY]: basicTargetLanguage,
                [ADVANCED_TARGET_LANGUAGE_KEY]: advancedTargetLanguage,
                [EXTRA_INSTRUCTIONS_KEY]: extraInstructions,
            } = settings;

            const mode = settingsMode || SETTINGS_MODE_BASIC;

            let activeProvider =
                apiType && PROVIDERS.includes(apiType) ? apiType : "openai";
            if (
                mode === SETTINGS_MODE_BASIC &&
                !BASIC_PROVIDERS.includes(activeProvider)
            ) {
                activeProvider = "openai";
            }

            const perProvider = providerSettings[activeProvider];

            const effective = perProvider
                ? {
                      apiKey: perProvider.apiKey || "",
                      apiEndpoint:
                          perProvider.apiEndpoint ||
                          PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                          "",
                      modelName:
                          perProvider.modelName ||
                          PROVIDER_DEFAULTS[activeProvider]?.modelName ||
                          "",
                      apiType: activeProvider,
                  }
                : {
                      apiKey: apiKey || "",
                      apiEndpoint:
                          apiEndpoint ||
                          PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                          "",
                      modelName:
                          modelName || PROVIDER_DEFAULTS[activeProvider]?.modelName || "",
                      apiType: activeProvider,
                  };

            // Build translation instructions based on mode
            let targetLanguageLabel;
            let finalInstructions;

            if (mode === SETTINGS_MODE_BASIC) {
                const languageValue =
                    basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT;
                targetLanguageLabel = getBasicTargetLanguageLabel(languageValue);
                effective.apiEndpoint =
                    PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint ||
                    effective.apiEndpoint;
                effective.modelName = PROVIDER_DEFAULTS[activeProvider]?.modelName;
                // Use detected language in the prompt
                finalInstructions = buildTranslationInstructionsWithDetection(
                    detectedLanguageName,
                    targetLanguageLabel,
                    "", // No extra instructions in basic mode
                );
            } else {
                // Advanced mode
                const languageValue =
                    advancedTargetLanguage || ADVANCED_TARGET_LANGUAGE_DEFAULT;
                targetLanguageLabel = getBasicTargetLanguageLabel(languageValue);
                // Use detected language and extra instructions in the prompt
                finalInstructions = buildTranslationInstructionsWithDetection(
                    detectedLanguageName,
                    targetLanguageLabel,
                    extraInstructions || "",
                );
            }

            const {
                apiKey: finalKey,
                apiEndpoint: finalEndpoint,
                apiType: finalType,
                modelName: finalModel,
            } = effective;

            const resolvedRequestId = requestId || createRequestId();

            if (!finalEndpoint || (!finalKey && finalType !== "ollama")) {
                const errorMsg =
                    "Translation Error: API Key or Endpoint not set. Please configure in extension settings.";
                console.error(errorMsg);
                notifyContentScriptWithDetection(
                    tabId,
                    errorMsg,
                    isFullPage,
                    true,
                    false,
                    detectedLanguageName,
                    targetLanguageLabel,
                    resolvedRequestId,
                );
                return;
            }

            if (!isFullPage) {
                notifyContentScriptWithDetection(
                    tabId,
                    "Translating...",
                    false,
                    false,
                    true,
                    detectedLanguageName,
                    targetLanguageLabel,
                    resolvedRequestId,
                );

                streamSelectedTranslation(
                    tabId,
                    resolvedRequestId,
                    textToTranslate,
                    finalKey,
                    finalEndpoint,
                    finalType,
                    finalModel,
                    finalInstructions,
                    detectedLanguageName,
                    targetLanguageLabel,
                )
                    .then((translation) => {
                        if (!translation) {
                            return;
                        }
                        notifyContentScriptWithDetection(
                            tabId,
                            translation,
                            false,
                            false,
                            false,
                            detectedLanguageName,
                            targetLanguageLabel,
                            resolvedRequestId,
                        );
                    })
                    .catch((error) => {
                        console.error("Translation error:", error);
                        notifyContentScriptWithDetection(
                            tabId,
                            `Translation Error: ${error.message}`,
                            false,
                            true,
                            false,
                            detectedLanguageName,
                            targetLanguageLabel,
                            resolvedRequestId,
                        );
                    });
                return;
            }

            console.log(
                "Attempting to call translateTextApiCall with detected language.",
                { detectedLanguageName, targetLanguageLabel },
            );

            // Call the API
            translateTextApiCall(
                textToTranslate,
                finalKey,
                finalEndpoint,
                finalType,
                isFullPage,
                finalModel,
                finalInstructions,
            )
                .then((translation) => {
                    console.log("Translation received (length):", translation.length);
                    notifyContentScriptWithDetection(
                        tabId,
                        translation,
                        isFullPage,
                        false,
                        false,
                        detectedLanguageName,
                        targetLanguageLabel,
                        resolvedRequestId,
                    );
                })
                .catch((error) => {
                    console.error("Translation error:", error);
                    notifyContentScriptWithDetection(
                        tabId,
                        `Translation Error: ${error.message}`,
                        isFullPage,
                        true,
                        false,
                        detectedLanguageName,
                        targetLanguageLabel,
                        resolvedRequestId,
                    );
                });
        },
    );
}

// --- Notify Content Script with Detection Info ---
function notifyContentScriptWithDetection(
    tabId,
    text,
    isFullPage,
    isError,
    isLoading,
    detectedLanguageName,
    targetLanguageName,
    requestId = null,
) {
    let message = {
        text: text,
        isError: isError,
        isLoading: isLoading,
        detectedLanguageName: detectedLanguageName,
        targetLanguageName: targetLanguageName,
    };

    if (requestId) {
        message.requestId = requestId;
    }

    if (isFullPage) {
        if (isLoading) {
            message.action = "showLoadingIndicator";
        } else {
            message.action = "startElementTranslation";
        }
    } else {
        message.action = "displayTranslation";
    }

    console.log(`Sending message to content script with detection:`, message);

    chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
            if (
                !chrome.runtime.lastError.message.includes("Receiving end does not exist")
            ) {
                console.warn(
                    `Could not send message to tab ${tabId} for action ${message.action}: ${chrome.runtime.lastError.message}.`,
                );
            }
        } else if (response?.status === "received") {
            console.log(`Content script in tab ${tabId} acknowledged ${message.action}.`);
        }
    });
}

// --- Notify Content Script ---
function notifyContentScript(
    tabId,
    text,
    isFullPage,
    isError = false,
    isLoading = false,
    requestId = null,
) {
    let message = {
        text: text,
        isError: isError,
        isLoading: isLoading, // Pass loading state
    };

    if (requestId) {
        message.requestId = requestId;
    }

    if (isFullPage) {
        // Full page now uses startElementTranslation
        if (isLoading) {
            message.action = "showLoadingIndicator";
        } else {
            message.action = "startElementTranslation"; // Changed from replacePageContent
        }
    } else {
        // Selected text uses displayTranslation for both loading and final result
        message.action = "displayTranslation";
    }

    console.log(`Sending message to content script:`, message);

    chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
            // Don't log error if it's just because the tab was closed during translation
            if (
                !chrome.runtime.lastError.message.includes("Receiving end does not exist")
            ) {
                console.warn(
                    `Could not send message to tab ${tabId} for action ${message.action}: ${chrome.runtime.lastError.message}.`,
                );
            }
        } else if (response?.status === "received") {
            console.log(`Content script in tab ${tabId} acknowledged ${message.action}.`);
        }
    });
}

function cancelActiveStream(tabId, requestId = null) {
    const existing = activeStreams.get(tabId);
    if (!existing) {
        return;
    }

    if (requestId && existing.requestId !== requestId) {
        return;
    }

    if (existing.throttleTimer) {
        clearTimeout(existing.throttleTimer);
    }

    if (existing.keepAliveTimer) {
        clearInterval(existing.keepAliveTimer);
    }

    if (existing.controller) {
        existing.controller.abort();
    }

    if (existing.port) {
        try {
            existing.port.disconnect();
        } catch (error) {
            console.warn("Could not disconnect stream port:", error);
        }
    }

    activeStreams.delete(tabId);
}

function sendStreamUpdate(streamState, text, detectedLanguageName, targetLanguageName) {
    if (!streamState.port) {
        return;
    }

    try {
        streamState.port.postMessage({
            action: "streamTranslationUpdate",
            requestId: streamState.requestId,
            text,
            detectedLanguageName,
            targetLanguageName,
        });
    } catch (error) {
        console.warn("Failed to post stream update:", error);
    }
}

function scheduleStreamUpdate(
    streamState,
    text,
    detectedLanguageName,
    targetLanguageName,
) {
    streamState.pendingText = text;

    if (streamState.throttleTimer) {
        return;
    }

    streamState.throttleTimer = setTimeout(() => {
        streamState.throttleTimer = null;
        sendStreamUpdate(
            streamState,
            streamState.pendingText,
            detectedLanguageName,
            targetLanguageName,
        );
    }, STREAM_UPDATE_THROTTLE_MS);
}

function flushStreamUpdate(streamState, text, detectedLanguageName, targetLanguageName) {
    if (streamState.throttleTimer) {
        clearTimeout(streamState.throttleTimer);
        streamState.throttleTimer = null;
    }

    sendStreamUpdate(streamState, text, detectedLanguageName, targetLanguageName);
}

async function streamSelectedTranslation(
    tabId,
    requestId,
    textToTranslate,
    apiKey,
    apiEndpoint,
    apiType,
    modelName,
    translationInstructions,
    detectedLanguageName = null,
    targetLanguageName = null,
) {
    cancelActiveStream(tabId);

    const userInstructions = translationInstructions || DEFAULT_TRANSLATION_INSTRUCTIONS;
    const provider = apiType && PROVIDERS.includes(apiType) ? apiType : "openai";
    const selectedModelName =
        modelName || PROVIDER_DEFAULTS[provider]?.modelName || DEFAULT_SETTINGS.modelName;
    const shouldUseInstructPrompt = isInstructModelName(selectedModelName);
    const prompt = shouldUseInstructPrompt
        ? buildInstructPrompt(userInstructions, textToTranslate)
        : buildStandardPrompt(userInstructions, textToTranslate);
    const systemPrompt = shouldUseInstructPrompt
        ? INSTRUCT_SYSTEM_PROMPT
        : DEFAULT_SYSTEM_PROMPT;
    const maxTokens = resolveMaxTokens(provider, false);
    const model = resolveProviderModel(provider, apiKey, apiEndpoint, selectedModelName);

    const controller = new AbortController();
    const port = chrome.tabs.connect(tabId, { name: STREAM_PORT_NAME });
    const streamState = {
        requestId,
        controller,
        port,
        throttleTimer: null,
        pendingText: "",
        keepAliveTimer: startStreamKeepAlive(),
    };

    activeStreams.set(tabId, streamState);

    port.onMessage.addListener((message) => {
        if (message?.action === "cancelStream" && message.requestId === requestId) {
            cancelActiveStream(tabId, requestId);
        }
    });

    port.onDisconnect.addListener(() => {
        cancelActiveStream(tabId, requestId);
    });

    try {
        const result = await streamText({
            model,
            system: systemPrompt,
            prompt,
            maxTokens: maxTokens ?? undefined,
            abortSignal: controller.signal,
        });

        let translation = "";
        for await (const chunk of result.textStream) {
            translation += chunk;
            const streamedText = shouldStripThinkBlocks(provider)
                ? stripThinkBlocks(translation)
                : translation;
            scheduleStreamUpdate(
                streamState,
                streamedText,
                detectedLanguageName,
                targetLanguageName,
            );
        }

        const finalText = shouldStripThinkBlocks(provider)
            ? stripThinkBlocks(translation)
            : translation;
        flushStreamUpdate(
            streamState,
            finalText,
            detectedLanguageName,
            targetLanguageName,
        );
        return finalText;
    } catch (error) {
        if (controller.signal.aborted || error?.name === "AbortError") {
            return null;
        }
        throw error;
    } finally {
        if (activeStreams.get(tabId) === streamState) {
            activeStreams.delete(tabId);
        }
        if (streamState.throttleTimer) {
            clearTimeout(streamState.throttleTimer);
        }
        if (streamState.keepAliveTimer) {
            clearInterval(streamState.keepAliveTimer);
        }
        if (streamState.port) {
            try {
                streamState.port.disconnect();
            } catch (error) {
                console.warn("Could not disconnect stream port:", error);
            }
        }
    }
}

// --- API Call Function (Updated to include modelName parameter) ---
async function translateTextApiCall(
    textToTranslate,
    apiKey,
    apiEndpoint,
    apiType,
    isFullPage,
    modelName,
    translationInstructions,
) {
    console.log(
        `Sending text to AI SDK (${apiType}). FullPage: ${isFullPage}. Text length: ${textToTranslate.length}`,
    );

    const userInstructions = translationInstructions || DEFAULT_TRANSLATION_INSTRUCTIONS;
    const provider = apiType && PROVIDERS.includes(apiType) ? apiType : "openai";
    const selectedModelName =
        modelName || PROVIDER_DEFAULTS[provider]?.modelName || DEFAULT_SETTINGS.modelName;
    const shouldUseInstructPrompt = isInstructModelName(selectedModelName);
    const prompt = shouldUseInstructPrompt
        ? buildInstructPrompt(userInstructions, textToTranslate)
        : buildStandardPrompt(userInstructions, textToTranslate);
    const systemPrompt = shouldUseInstructPrompt
        ? INSTRUCT_SYSTEM_PROMPT
        : DEFAULT_SYSTEM_PROMPT;
    const model = resolveProviderModel(provider, apiKey, apiEndpoint, selectedModelName);
    const maxTokens = resolveMaxTokens(provider, isFullPage);

    try {
        const { text } = await generateText({
            model,
            system: systemPrompt,
            prompt,
            maxTokens: maxTokens ?? undefined,
        });

        let translation = text;

        if (shouldStripThinkBlocks(provider)) {
            translation = stripThinkBlocks(translation);
        }

        if (!translation || translation.trim() === "") {
            throw new Error("API returned no translation text.");
        }

        return translation.trim();
    } catch (error) {
        console.error("AI SDK translation error:", error);
        throw error;
    }
}

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});
