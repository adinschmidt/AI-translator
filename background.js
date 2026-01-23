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
        modelName: "gemini-3-flash-preview",
    },
    groq: {
        apiEndpoint: "https://api.groq.com/openai/v1/chat/completions",
        modelName: "qwen/qwen3-32b",
    },
    grok: {
        apiEndpoint: "https://api.x.ai/v1/chat/completions",
        modelName: "grok-3-mini",
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
    "Preserve any HTML structure and formatting in your translation.";

const INSTRUCT_SYSTEM_PROMPT =
    "You are a professional translator. Output only the translated text with no " +
    "explanations, reasoning, or additional commentary.";

function isInstructModelName(modelName) {
    return typeof modelName === "string" && modelName.toLowerCase().includes("instruct");
}

function buildStandardPrompt(userInstructions, textToTranslate) {
    return `${userInstructions}

If this contains HTML, preserve the HTML structure and formatting.
If this is already in the target language, do not translate it, instead repeat it back verbatim.

Text to translate: ${textToTranslate}`;
}

function buildInstructPrompt(userInstructions, textToTranslate) {
    return `${userInstructions}

If this contains HTML, preserve the HTML structure and formatting.
If this is already in the target language, repeat it back verbatim.

Text to translate:
${textToTranslate}

Translated text:`;
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

        getSettingsAndTranslateWithDetection(
            request.html,
            sender.tab.id,
            false,
            request.detectedLanguage,
            request.detectedLanguageName,
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

        getSettingsAndTranslate(request.html, sender.tab.id, false);
        sendResponse({ status: "ok" });
        return;
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
                // Immediately tell content script to show the popup in loading state
                notifyContentScript(tabId, "Translating...", false, false, true); // isFullPage=false, isError=false, isLoading=true
                // Then, get settings and start the actual translation with HTML content
                getSettingsAndTranslate(response.html, tabId, false); // false = not full page
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
    // Handle Full Page Translation (Manual Trigger) - New HTML-based approach
    else if (info.menuItemId === "translateFullPage") {
        console.log("Action: Translate Full Page requested manually for tab:", tabId);

        // 1) Ask content script for main content HTML snapshot
        chrome.tabs.sendMessage(tabId, { action: "getPageText" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(
                    "Error getting page HTML for full page translation:",
                    chrome.runtime.lastError.message,
                );
                notifyContentScript(
                    tabId,
                    "Translation failed to start: could not read page content.",
                    true, // isFullPage
                    true, // isError
                    false, // isLoading
                );
                return;
            }

            if (!response || !response.text) {
                console.error(
                    "No page HTML received from content script for full page translation.",
                );
                notifyContentScript(
                    tabId,
                    "Translation failed to start: empty page content.",
                    true, // isFullPage
                    true, // isError
                    false, // isLoading
                );
                return;
            }

            const pageHtml = response.text;
            console.log(
                "Received page HTML for full page translation, length:",
                pageHtml.length,
            );

            // 2) Show loading indicator on page (with initial progress)
            chrome.tabs.sendMessage(
                tabId,
                {
                    action: "showLoadingIndicator",
                    isFullPage: true,
                    text: "Translating page... 0% (starting)",
                },
                (indicatorResponse) => {
                    if (chrome.runtime.lastError) {
                        console.warn(
                            "Could not show loading indicator:",
                            chrome.runtime.lastError.message,
                        );
                    } else {
                        console.log("Loading indicator shown:", indicatorResponse);
                    }
                },
            );

            // 3) Call API with isFullPage = true using the HTML snapshot
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
                        effective.modelName =
                            PROVIDER_DEFAULTS[activeProvider]?.modelName ||
                            effective.modelName;
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
                        const errorMsg =
                            "Translation Error: API Key or Endpoint not set. Please configure in extension settings.";
                        console.error(errorMsg);
                        notifyContentScript(
                            tabId,
                            errorMsg,
                            true, // isFullPage
                            true, // isError
                            false, // isLoading
                        );
                        return;
                    }

                    // Optional: send a mid-translation progress hint (best-effort UX)
                    try {
                        const approxTokens = Math.round(pageHtml.length / 4);
                        chrome.tabs.sendMessage(
                            tabId,
                            {
                                action: "showLoadingIndicator",
                                isFullPage: true,
                                text: `Translating page... input size ~${approxTokens} tokens`,
                            },
                            () => {
                                /* ignore errors */
                            },
                        );
                    } catch (e) {
                        console.warn("Could not send progress hint:", e);
                    }

                    translateTextApiCall(
                        pageHtml,
                        finalKey,
                        finalEndpoint,
                        finalType,
                        true, // isFullPage
                        finalModel,
                        finalInstructions,
                    )
                        .then((translatedHtml) => {
                            console.log(
                                "Full page translation received, length:",
                                translatedHtml.length,
                            );

                            // 4) Send translated HTML back for in-place replacement
                            chrome.tabs.sendMessage(
                                tabId,
                                {
                                    action: "applyFullPageTranslation",
                                    html: translatedHtml,
                                },
                                (applyResponse) => {
                                    if (chrome.runtime.lastError) {
                                        console.error(
                                            "Error applying full page translation:",
                                            chrome.runtime.lastError.message,
                                        );
                                        notifyContentScript(
                                            tabId,
                                            "Failed to apply translated content.",
                                            true, // isFullPage
                                            true, // isError
                                            false, // isLoading
                                        );
                                        return;
                                    }
                                    console.log(
                                        "Full page translation applied:",
                                        applyResponse,
                                    );
                                },
                            );
                        })
                        .catch((error) => {
                            console.error("Full page translation error:", error);
                            notifyContentScript(
                                tabId,
                                `Translation Error: ${error.message}`,
                                true, // isFullPage
                                true, // isError
                                false, // isLoading
                            );
                        });
                },
            );
        });
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
                    effective.modelName =
                        PROVIDER_DEFAULTS[activeProvider]?.modelName ||
                        effective.modelName;
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

// --- Helper Function to Get Settings and Call API ---
function getSettingsAndTranslate(textToTranslate, tabId, isFullPage) {
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
                effective.modelName =
                    PROVIDER_DEFAULTS[activeProvider]?.modelName || effective.modelName;
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
                const errorMsg =
                    "Translation Error: API Key or Endpoint not set. Please configure in extension settings.";
                console.error(errorMsg);
                // Send error back to content script to update the popup/indicator
                notifyContentScript(tabId, errorMsg, isFullPage, true, false); // isError=true, isLoading=false
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
                    notifyContentScript(tabId, translation, isFullPage, false, false); // isError=false, isLoading=false
                })
                .catch((error) => {
                    console.error("Translation error:", error);
                    // Send final error result
                    notifyContentScript(
                        tabId,
                        `Translation Error: ${error.message}`,
                        isFullPage,
                        true, // isError=true
                        false, // isLoading=false
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
                effective.modelName =
                    PROVIDER_DEFAULTS[activeProvider]?.modelName || effective.modelName;
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
                );
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
) {
    let message = {
        text: text,
        isError: isError,
        isLoading: isLoading,
        detectedLanguageName: detectedLanguageName,
        targetLanguageName: targetLanguageName,
    };

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
) {
    let message = {
        text: text,
        isError: isError,
        isLoading: isLoading, // Pass loading state
    };

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
        `Sending text to API (${apiType}) at ${apiEndpoint}. FullPage: ${isFullPage}. Text length: ${textToTranslate.length}`,
    );

    // When doing element-wise full page translation, we already split work in small batches (see content.js translatePageElements()).
    // For OpenRouter (and other stricter providers), additionally clamp max_tokens to reduce chances of rate/size errors.
    console.log("Text being sent for translation:", textToTranslate);

    let requestBody;
    let headers = { "Content-Type": "application/json" };

    // Use custom instructions if provided, otherwise fall back to default
    const userInstructions = translationInstructions || DEFAULT_TRANSLATION_INSTRUCTIONS;

    // Normalize provider name
    const provider = apiType && PROVIDERS.includes(apiType) ? apiType : "openai";

    // Use modelName from parameter, fallback to provider defaults
    const selectedModelName =
        modelName || PROVIDER_DEFAULTS[provider]?.modelName || DEFAULT_SETTINGS.modelName;

    const shouldUseInstructPrompt = isInstructModelName(selectedModelName);
    const prompt = shouldUseInstructPrompt
        ? buildInstructPrompt(userInstructions, textToTranslate)
        : buildStandardPrompt(userInstructions, textToTranslate);
    const systemPrompt = shouldUseInstructPrompt
        ? INSTRUCT_SYSTEM_PROMPT
        : DEFAULT_SYSTEM_PROMPT;

    switch (provider) {
        case "openai":
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: selectedModelName || "gpt-5-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                // Allow larger responses, but keep reasonable bounds
                max_tokens: isFullPage ? 4000 : 800,
            };
            break;
        case "anthropic":
            headers["x-api-key"] = apiKey;
            headers["anthropic-version"] = "2023-06-01";
            requestBody = {
                model: selectedModelName || "claude-haiku-4-5",
                max_tokens: isFullPage ? 4000 : 800,
                system: systemPrompt,
                messages: [{ role: "user", content: prompt }],
            };
            break;
        case "google": {
            headers["x-goog-api-key"] = apiKey;
            const base = apiEndpoint || PROVIDER_DEFAULTS.google.apiEndpoint;
            const googleApiUrl = `${base.replace(/\/+$/, "")}/models/${selectedModelName || "gemini-3-flash-preview"}:generateContent`;
            requestBody = {
                contents: [
                    {
                        parts: [{ text: systemPrompt }, { text: prompt }],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: isFullPage ? 65536 : 8000,
                },
            };
            console.log("Google API Request Body:", JSON.stringify(requestBody));
            apiEndpoint = googleApiUrl;
            break;
        }
        case "groq": {
            // Groq - OpenAI-compatible style
            // No max_completion_tokens - use model's maximum
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.groq.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
            };
            break;
        }
        case "grok": {
            // Grok (xAI) - OpenAI-compatible style
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.grok.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                max_tokens: isFullPage ? 4000 : 800,
            };
            break;
        }
        case "openrouter": {
            headers["Authorization"] = `Bearer ${apiKey}`;
            headers["HTTP-Referer"] = "https://github.com/"; // safe generic referer
            headers["X-Title"] = "AI Translator Extension";

            // For OpenRouter, allow large outputs so we don't truncate:
            // - Full page / large HTML: up to 8192 tokens
            // - Selection / single element: up to 2048 tokens
            const openRouterMaxTokens = isFullPage ? 8192 : 2048;

            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.openrouter.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                max_tokens: openRouterMaxTokens,
            };
            break;
        }
        case "deepseek": {
            // DeepSeek - OpenAI-compatible
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.deepseek.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                max_tokens: isFullPage ? 4000 : 800,
            };
            break;
        }
        case "mistral": {
            // Mistral AI - OpenAI-compatible
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.mistral.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                max_tokens: isFullPage ? 4000 : 800,
            };
            break;
        }
        case "qwen": {
            // Qwen (Alibaba DashScope) - OpenAI-compatible via compatible-mode endpoint
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.qwen.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                max_tokens: isFullPage ? 4000 : 800,
            };
            break;
        }
        case "cerebras": {
            // Cerebras - OpenAI-compatible style
            // No max_completion_tokens - let model use its maximum
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.cerebras.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
            };
            break;
        }
        case "ollama": {
            // Ollama uses /api/generate endpoint - no auth needed for local
            const ollamaBase = apiEndpoint || PROVIDER_DEFAULTS.ollama.apiEndpoint;
            apiEndpoint = `${ollamaBase.replace(/\/+$/, "")}/api/generate`;

            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.ollama.modelName,
                system: systemPrompt,
                prompt: prompt,
                stream: false, // Get complete response, not streaming
            };
            break;
        }
        default:
            throw new Error(`Unsupported API type configured: ${provider}`);
    }

    console.log(`Sending request to ${apiEndpoint} with body:`, requestBody);

    try {
        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
        });

        console.log("Received API response:", response);

        // Explicit logging to help debug partial translations / silent failures
        if (response.status === 429) {
            console.error(
                "Rate limited by provider (HTTP 429). Consider lowering concurrency or checking your OpenRouter plan/limits.",
            );
        }

        if (!response.ok) {
            let errorDetails = `API request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                console.error("API Error Response Body:", errorData);
                errorDetails += `: ${
                    errorData?.error?.message ||
                    errorData?.detail ||
                    JSON.stringify(errorData)
                }`;
            } catch (e) {
                errorDetails += `: ${response.statusText}`;
            }
            console.error("API request failed:", errorDetails);
            throw new Error(errorDetails);
        }
        const data = await response.json();
        console.log("API Response Data Received Successfully:", data);

        let translation;
        switch (provider) {
            case "groq": {
                // Filter out <think>...</think> blocks from reasoning models
                let content = data.choices?.[0]?.message?.content || "";
                translation = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
                break;
            }
            case "openai":
            case "grok":
            case "openrouter":
            case "deepseek":
            case "mistral":
            case "qwen":
                translation = data.choices?.[0]?.message?.content?.trim();
                break;
            case "cerebras": {
                // Filter out <think>...</think> blocks from reasoning models (qwen-3-32b, etc.)
                let content = data.choices?.[0]?.message?.content || "";
                translation = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
                break;
            }
            case "anthropic":
                if (Array.isArray(data.content) && data.content.length > 0) {
                    translation = data.content
                        .map((block) => block.text || "")
                        .join("\n")
                        .trim();
                }
                break;
            case "google":
                console.log("Google API Candidates:", data.candidates);
                if (data.candidates?.[0]?.content?.parts) {
                    console.log("Google API Parts:", data.candidates[0].content.parts);
                    if (data.candidates[0].content.parts.length > 0) {
                        console.log(
                            "Google API First Part:",
                            data.candidates[0].content.parts[0],
                        );
                    }
                }
                translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                break;
            case "ollama":
                // Ollama /api/generate returns { response: "..." }
                translation = data.response?.trim();
                break;
            default:
                throw new Error(
                    "Could not determine how to extract translation for this provider.",
                );
        }

        if (
            translation === undefined ||
            translation === null ||
            translation.trim() === ""
        ) {
            console.error("Extracted translation is empty or null.", data);
            throw new Error("API returned no translation text.");
        }
        console.log("Successfully extracted translation:", translation);
        console.log("=== RAW TRANSLATION DEBUG START ===");
        console.log("Raw translation text:", translation);
        console.log("=== RAW TRANSLATION DEBUG END ===");
        return translation;
    } catch (error) {
        console.error("Fetch API error:", error);
        throw error;
    }
}

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});
