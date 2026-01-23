const apiKeyInput = document.getElementById("api-key");
const apiEndpointInput = document.getElementById("api-endpoint");
const apiTypeSelect = document.getElementById("api-type");
const statusMessage = document.getElementById("status-message");
const fillDefaultEndpointButton = document.getElementById("fill-default-endpoint");
const modelNameInput = document.getElementById("model-name");
const fillDefaultModelButton = document.getElementById("fill-default-model");

// New UI elements for advanced mode
const advancedTargetLanguageSelect = document.getElementById("advanced-target-language");
const extraInstructionsInput = document.getElementById("extra-instructions");

// Basic mode elements
const settingsModeSelect = document.getElementById("settings-mode");
const basicSettingsDiv = document.getElementById("basic-settings");
const advancedSettingsDiv = document.getElementById("advanced-settings");
const basicProviderSelect = document.getElementById("basic-provider");
const basicApiKeyInput = document.getElementById("basic-api-key");
const basicTargetLanguageSelect = document.getElementById("basic-target-language");

// UI toggle: auto-translate button on selection
const showTranslateButtonOnSelectionInput = document.getElementById(
    "show-translate-button-on-selection",
);

// Ollama-specific elements
const ollamaSettingsDiv = document.getElementById("ollama-settings");
const ollamaModelSelect = document.getElementById("ollama-model-select");
const refreshOllamaModelsButton = document.getElementById("refresh-ollama-models");
const apiKeyContainer = document.getElementById("api-key")?.closest(".mb-4");
const modelNameContainer = document.getElementById("model-name")?.closest(".mb-4");

// Cerebras-specific elements
const cerebrasSettingsDiv = document.getElementById("cerebras-settings");
const cerebrasModelSelect = document.getElementById("cerebras-model-select");

// Settings mode keys
const SETTINGS_MODE_KEY = "settingsMode";
const BASIC_TARGET_LANGUAGE_KEY = "basicTargetLanguage";
const ADVANCED_TARGET_LANGUAGE_KEY = "advancedTargetLanguage";
const EXTRA_INSTRUCTIONS_KEY = "extraInstructions";
const SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY = "showTranslateButtonOnSelection";

const SETTINGS_MODE_BASIC = "basic";
const SETTINGS_MODE_ADVANCED = "advanced";

const ADVANCED_TARGET_LANGUAGE_DEFAULT = "en";

// Default translation instructions
const DEFAULT_TRANSLATION_INSTRUCTIONS =
    "Translate the following text to English. Keep the same meaning and tone. DO NOT add any additional text or explanations.";

const BASIC_TARGET_LANGUAGE_DEFAULT = "en";

const BASIC_PROVIDERS = ["openai", "anthropic", "google"];
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

// Per-provider defaults (used as initial values when a provider has no saved settings)
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

// In-memory cache of per-provider settings for the current options session.
// Shape:
// {
//   [provider]: { apiKey, apiEndpoint, modelName }
// }
let providerSettings = {};
let settingsMode = SETTINGS_MODE_BASIC;
let basicTargetLanguage = BASIC_TARGET_LANGUAGE_DEFAULT;
let advancedTargetLanguage = ADVANCED_TARGET_LANGUAGE_DEFAULT;
let extraInstructions = "";

let debounceTimer;

/**
 * Fetch available models from the Ollama API.
 * @param {string} baseUrl - The Ollama server base URL (e.g., http://localhost:11434)
 * @returns {Promise<string[]>} Array of model names
 */
async function fetchOllamaModels(baseUrl) {
    const url = `${baseUrl.replace(/\/+$/, "")}/api/tags`;
    console.log("options.js: Fetching Ollama models from:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const models = (data.models || []).map((m) => m.name);
        console.log("options.js: Fetched Ollama models:", models);
        return models;
    } catch (error) {
        console.error("options.js: Error fetching Ollama models:", error);
        throw error;
    }
}

/**
 * Populate the Ollama model dropdown with available models.
 * @param {string[]} models - Array of model names
 * @param {string} [selectedModel] - Currently selected model to preserve selection
 */
function populateOllamaModelDropdown(models, selectedModel = "") {
    if (!ollamaModelSelect) return;

    // Clear existing options except the placeholder
    while (ollamaModelSelect.firstChild) {
        ollamaModelSelect.removeChild(ollamaModelSelect.firstChild);
    }

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "-- Select a model --";
    ollamaModelSelect.appendChild(placeholderOption);

    models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        if (model === selectedModel) {
            option.selected = true;
        }
        ollamaModelSelect.appendChild(option);
    });
}

/**
 * Update UI visibility based on selected provider.
 * Shows/hides Ollama-specific and Cerebras-specific elements and API key field as appropriate.
 * @param {string} provider - The currently selected provider
 */
function updateProviderUI(provider) {
    const isOllama = provider === "ollama";
    const isCerebras = provider === "cerebras";

    // Show/hide Ollama-specific settings
    if (ollamaSettingsDiv) {
        ollamaSettingsDiv.classList.toggle("hidden", !isOllama);
    }

    // Show/hide Cerebras-specific settings
    if (cerebrasSettingsDiv) {
        cerebrasSettingsDiv.classList.toggle("hidden", !isCerebras);
    }

    // Show/hide standard model name input (hide for Ollama/Cerebras since we use dropdown)
    // Also hide in Basic mode, since model is fixed.
    if (modelNameContainer) {
        modelNameContainer.classList.toggle(
            "hidden",
            isOllama || isCerebras || settingsMode === SETTINGS_MODE_BASIC,
        );
    }

    // Show/hide API key field (Ollama doesn't require it)
    // Also hide in Basic mode, since it uses its own API key field.
    if (apiKeyContainer) {
        apiKeyContainer.classList.toggle(
            "hidden",
            isOllama || settingsMode === SETTINGS_MODE_BASIC,
        );
    }

    // If switching to Ollama, try to fetch models
    if (isOllama) {
        const settings = providerSettings["ollama"] || resolveProviderDefaults("ollama");
        const baseUrl = settings.apiEndpoint || PROVIDER_DEFAULTS.ollama.apiEndpoint;

        fetchOllamaModels(baseUrl)
            .then((models) => {
                populateOllamaModelDropdown(models, settings.modelName);
            })
            .catch((error) => {
                displayStatus(`Could not fetch Ollama models: ${error.message}`, true);
            });
    }

    // If switching to Cerebras, set the dropdown to the current model
    if (isCerebras && cerebrasModelSelect) {
        const settings = providerSettings["cerebras"] || resolveProviderDefaults("cerebras");
        cerebrasModelSelect.value = settings.modelName || PROVIDER_DEFAULTS.cerebras.modelName;
    }
}

function resolveProviderDefaults(provider) {
    const defaults = PROVIDER_DEFAULTS[provider] || {};
    return {
        apiKey: "",
        apiEndpoint: defaults.apiEndpoint || "",
        modelName: defaults.modelName || "",
        apiType: provider,
    };
}

function buildBasicTranslationInstructions(targetLanguageLabel) {
    return `Translate the following text to ${targetLanguageLabel}. Keep the same meaning and tone. DO NOT add any additional text or explanations.`;
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

function populateBasicLanguageDropdown() {
    if (!basicTargetLanguageSelect) return;

    basicTargetLanguageSelect.textContent = "";

    for (const lang of BASIC_TARGET_LANGUAGES) {
        const option = document.createElement("option");
        option.value = lang.value;
        option.textContent = lang.label;
        basicTargetLanguageSelect.appendChild(option);
    }
}

function populateAdvancedLanguageDropdown() {
    if (!advancedTargetLanguageSelect) return;

    advancedTargetLanguageSelect.textContent = "";

    for (const lang of BASIC_TARGET_LANGUAGES) {
        const option = document.createElement("option");
        option.value = lang.value;
        option.textContent = lang.label;
        advancedTargetLanguageSelect.appendChild(option);
    }
}

function updateSettingsModeUI() {
    const isBasic = settingsMode === SETTINGS_MODE_BASIC;

    if (basicSettingsDiv) {
        basicSettingsDiv.classList.toggle("hidden", !isBasic);
    }

    if (advancedSettingsDiv) {
        advancedSettingsDiv.classList.toggle("hidden", isBasic);
    }
}

/**
 * Load all provider-specific settings from storage.
 * Storage schema (backwards compatible):
 * - Legacy:
 *   apiKey, apiEndpoint, apiType, modelName
 * - New:
 *   providerSettings = {
 *     [provider]: { apiKey, apiEndpoint, modelName }
 *   }
 */
function loadSettings() {
    console.log("options.js: Attempting to load settings...");
    chrome.storage.sync.get(
        [
            "apiKey",
            "apiEndpoint",
            "apiType",
            "modelName",
            "providerSettings",
            "translationInstructions",
            SETTINGS_MODE_KEY,
            BASIC_TARGET_LANGUAGE_KEY,
            ADVANCED_TARGET_LANGUAGE_KEY,
            EXTRA_INSTRUCTIONS_KEY,
            SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY,
        ],
        (result) => {
            if (chrome.runtime.lastError) {
                console.error(
                    "options.js: Error loading settings:",
                    chrome.runtime.lastError,
                );
                displayStatus(
                    `Error loading settings: ${chrome.runtime.lastError.message} `,
                    true,
                );
                return;
            }

            console.log("options.js: Raw settings loaded from storage:", result);

            // Migration/initialization for mode + target languages
            settingsMode = result[SETTINGS_MODE_KEY] || SETTINGS_MODE_BASIC;
            basicTargetLanguage =
                result[BASIC_TARGET_LANGUAGE_KEY] || BASIC_TARGET_LANGUAGE_DEFAULT;
            advancedTargetLanguage =
                result[ADVANCED_TARGET_LANGUAGE_KEY] || ADVANCED_TARGET_LANGUAGE_DEFAULT;
            extraInstructions = result[EXTRA_INSTRUCTIONS_KEY] || "";

            // Migration: if old translationInstructions exists, extract any custom parts
            if (result.translationInstructions && !result[EXTRA_INSTRUCTIONS_KEY]) {
                const oldInstructions = result.translationInstructions;
                // Check if it's not the default and extract custom content
                if (!oldInstructions.startsWith("Translate the following text to")) {
                    extraInstructions = oldInstructions;
                    console.log("options.js: Migrated old translationInstructions to extraInstructions");
                }
            }

            const shouldPersistModeMigration =
                !result[SETTINGS_MODE_KEY] || !result[BASIC_TARGET_LANGUAGE_KEY];

            const needsPersistShowButtonSetting =
                typeof result[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY] !== "boolean";

            const showButtonSetting =
                typeof result[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY] === "boolean"
                    ? result[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY]
                    : true;

            if (shouldPersistModeMigration || needsPersistShowButtonSetting) {
                chrome.storage.sync.set({
                    [SETTINGS_MODE_KEY]: settingsMode,
                    [BASIC_TARGET_LANGUAGE_KEY]: basicTargetLanguage,
                    [ADVANCED_TARGET_LANGUAGE_KEY]: advancedTargetLanguage,
                    [EXTRA_INSTRUCTIONS_KEY]: extraInstructions,
                    [SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY]: showButtonSetting,
                });
            }

            if (settingsModeSelect) {
                settingsModeSelect.value = settingsMode;
            }

            // Populate language dropdowns
            populateBasicLanguageDropdown();
            populateAdvancedLanguageDropdown();

            if (basicTargetLanguageSelect) {
                basicTargetLanguageSelect.value = basicTargetLanguage;
            }

            if (advancedTargetLanguageSelect) {
                advancedTargetLanguageSelect.value = advancedTargetLanguage;
            }

            if (extraInstructionsInput) {
                extraInstructionsInput.value = extraInstructions;
            }

            updateSettingsModeUI();

            if (showTranslateButtonOnSelectionInput) {
                const current = result[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY];
                showTranslateButtonOnSelectionInput.checked =
                    typeof current === "boolean" ? current : true;
            }

            // Initialize from stored providerSettings or empty object
            providerSettings = result.providerSettings || {};

            // Backwards compatibility: if legacy flat settings exist, fold them
            // into the selected provider (or default openai) once.
            if (
                !result.providerSettings &&
                (result.apiKey || result.apiEndpoint || result.modelName)
            ) {
                const legacyProvider = result.apiType || "openai";
                providerSettings[legacyProvider] = {
                    apiKey: result.apiKey || "",
                    apiEndpoint:
                        result.apiEndpoint ||
                        PROVIDER_DEFAULTS[legacyProvider]?.apiEndpoint ||
                        "",
                    modelName:
                        result.modelName ||
                        PROVIDER_DEFAULTS[legacyProvider]?.modelName ||
                        "",
                };
                console.log(
                    "options.js: Migrated legacy settings into providerSettings:",
                    providerSettings,
                );
                // Persist migration (fire and forget)
                chrome.storage.sync.set({ providerSettings });
            }

            // Ensure every provider has an entry (with defaults) so switching is seamless
            for (const provider of PROVIDERS) {
                if (!providerSettings[provider]) {
                    providerSettings[provider] = resolveProviderDefaults(provider);
                } else {
                    // Fill any missing fields from defaults for robustness
                    const base = resolveProviderDefaults(provider);
                    providerSettings[provider] = {
                        apiKey: providerSettings[provider].apiKey || "",
                        apiEndpoint:
                            providerSettings[provider].apiEndpoint || base.apiEndpoint,
                        modelName: providerSettings[provider].modelName || base.modelName,
                        translationInstructions:
                            providerSettings[provider].translationInstructions ||
                            DEFAULT_TRANSLATION_INSTRUCTIONS,
                    };
                }
            }

            // Determine initially selected provider (default to legacy apiType or openai)
            let initialProvider =
                result.apiType && PROVIDERS.includes(result.apiType)
                    ? result.apiType
                    : "openai";

            // In basic mode, clamp to basic providers
            if (
                settingsMode === SETTINGS_MODE_BASIC &&
                !BASIC_PROVIDERS.includes(initialProvider)
            ) {
                initialProvider = "openai";
            }

            apiTypeSelect.value = initialProvider;

            if (basicProviderSelect) {
                basicProviderSelect.value = BASIC_PROVIDERS.includes(initialProvider)
                    ? initialProvider
                    : "openai";
            }

            applyProviderToForm(initialProvider);

            if (settingsMode === SETTINGS_MODE_BASIC) {
                applyBasicSettingsToUI(initialProvider);
            }
        },
    );
}

/**
 * Apply given provider's settings into the form inputs.
 * Called on initial load and whenever dropdown changes.
 */
function applyProviderToForm(provider) {
    const settings = providerSettings[provider] || resolveProviderDefaults(provider);
    console.log(`options.js: Applying settings for provider ${provider}: `, settings);

    apiKeyInput.value = settings.apiKey || "";
    apiEndpointInput.value = settings.apiEndpoint || "";
    modelNameInput.value = settings.modelName || "";

    // Update UI visibility based on provider (show/hide Ollama-specific fields)
    updateProviderUI(provider);
}

function applyBasicSettingsToUI(provider) {
    const settings = providerSettings[provider] || resolveProviderDefaults(provider);

    if (basicProviderSelect) {
        basicProviderSelect.value = BASIC_PROVIDERS.includes(provider)
            ? provider
            : "openai";
    }

    if (basicApiKeyInput) {
        basicApiKeyInput.value = settings.apiKey || "";
    }

    if (basicTargetLanguageSelect) {
        basicTargetLanguageSelect.value = basicTargetLanguage;
    }
}

function autoSaveSetting() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveSetting, 300);
}

function saveSetting() {
    console.log("options.js: saveSetting function called.");

    const isBasic = settingsMode === SETTINGS_MODE_BASIC;

    if (isBasic) {
        const selectedProvider = basicProviderSelect?.value || "openai";
        const provider = BASIC_PROVIDERS.includes(selectedProvider)
            ? selectedProvider
            : "openai";

        const apiKey = basicApiKeyInput?.value.trim() || "";
        const defaults = resolveProviderDefaults(provider);
        const targetLanguageValue =
            basicTargetLanguageSelect?.value || BASIC_TARGET_LANGUAGE_DEFAULT;
        const targetLanguageLabel = getBasicTargetLanguageLabel(targetLanguageValue);
        const translationInstructions =
            buildBasicTranslationInstructions(targetLanguageLabel);

        providerSettings[provider] = {
            apiKey,
            apiEndpoint: defaults.apiEndpoint,
            modelName: defaults.modelName,
            translationInstructions,
        };

        basicTargetLanguage = targetLanguageValue;

        chrome.storage.sync.set(
            {
                providerSettings,
                apiType: provider,
                [SETTINGS_MODE_KEY]: settingsMode,
                [BASIC_TARGET_LANGUAGE_KEY]: basicTargetLanguage,
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error(
                        "options.js: Error saving basic settings:",
                        chrome.runtime.lastError,
                    );
                    displayStatus(
                        `Error saving: ${chrome.runtime.lastError.message} `,
                        true,
                    );
                } else {
                    displayStatus("Settings saved!", false);
                }
            },
        );

        return;
    }

    const currentProvider = apiTypeSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();
    const modelName = modelNameInput.value.trim();

    // Get the new advanced mode settings
    advancedTargetLanguage = advancedTargetLanguageSelect?.value || ADVANCED_TARGET_LANGUAGE_DEFAULT;
    extraInstructions = extraInstructionsInput?.value.trim() || "";

    console.log(
        `options.js: Saving for provider = ${currentProvider}: apiKey =***, apiEndpoint = ${apiEndpoint}, modelName = ${modelName}, targetLang = ${advancedTargetLanguage}`,
    );

    // Validate API endpoint if provided (allow custom base URLs)
    if (apiEndpoint) {
        try {
            new URL(apiEndpoint);
        } catch (_) {
            console.warn("options.js: Invalid API Endpoint URL format.");
            displayStatus("Invalid API Endpoint URL format.", true);
            return;
        }
    }

    // Update in-memory provider-specific settings
    if (!providerSettings[currentProvider]) {
        providerSettings[currentProvider] = resolveProviderDefaults(currentProvider);
    }
    providerSettings[currentProvider] = {
        apiKey,
        apiEndpoint,
        modelName,
    };

    // Persist providerSettings, currently selected provider, and advanced settings
    console.log(
        "options.js: Attempting to save providerSettings to chrome.storage.sync...",
    );
    chrome.storage.sync.set(
        {
            providerSettings,
            apiType: currentProvider,
            [SETTINGS_MODE_KEY]: settingsMode,
            [BASIC_TARGET_LANGUAGE_KEY]: basicTargetLanguage,
            [ADVANCED_TARGET_LANGUAGE_KEY]: advancedTargetLanguage,
            [EXTRA_INSTRUCTIONS_KEY]: extraInstructions,
        },
        () => {
            if (chrome.runtime.lastError) {
                console.error(
                    "options.js: Error saving settings:",
                    chrome.runtime.lastError,
                );
                displayStatus(`Error saving: ${chrome.runtime.lastError.message} `, true);
            } else {
                console.log("options.js: Provider settings saved successfully.");
                displayStatus("Settings saved!", false);
            }
        },
    );
}

let statusTimeout;
function displayStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "#dc2626" : "#16a34a";
    statusMessage.classList.remove("opacity-0");

    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
        statusMessage.classList.add("opacity-0");
    }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("options.js: DOMContentLoaded event fired.");

    populateBasicLanguageDropdown();
    populateAdvancedLanguageDropdown();
    loadSettings();

    if (settingsModeSelect) {
        settingsModeSelect.addEventListener("change", (event) => {
            settingsMode =
                event.target.value === SETTINGS_MODE_ADVANCED
                    ? SETTINGS_MODE_ADVANCED
                    : SETTINGS_MODE_BASIC;

            const isBasic = settingsMode === SETTINGS_MODE_BASIC;

            let activeProvider = apiTypeSelect.value;
            if (isBasic && !BASIC_PROVIDERS.includes(activeProvider)) {
                activeProvider = "openai";
                apiTypeSelect.value = activeProvider;
            }

            if (basicProviderSelect) {
                basicProviderSelect.value = BASIC_PROVIDERS.includes(activeProvider)
                    ? activeProvider
                    : "openai";
            }

            applyProviderToForm(activeProvider);
            applyBasicSettingsToUI(activeProvider);
            updateProviderUI(activeProvider);
            updateSettingsModeUI();

            chrome.storage.sync.set({
                [SETTINGS_MODE_KEY]: settingsMode,
                [BASIC_TARGET_LANGUAGE_KEY]: basicTargetLanguage,
                [SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY]:
                    showTranslateButtonOnSelectionInput?.checked ?? true,
            });

            autoSaveSetting();
        });
    }

    if (basicProviderSelect) {
        basicProviderSelect.addEventListener("change", () => {
            const provider = basicProviderSelect.value;
            const safeProvider = BASIC_PROVIDERS.includes(provider) ? provider : "openai";

            apiTypeSelect.value = safeProvider;
            applyProviderToForm(safeProvider);
            applyBasicSettingsToUI(safeProvider);
            autoSaveSetting();
        });
    }

    if (basicApiKeyInput) {
        basicApiKeyInput.addEventListener("input", autoSaveSetting);
    }

    if (basicTargetLanguageSelect) {
        basicTargetLanguageSelect.addEventListener("change", (event) => {
            basicTargetLanguage = event.target.value || BASIC_TARGET_LANGUAGE_DEFAULT;
            autoSaveSetting();
        });
    }

    // Advanced mode target language
    if (advancedTargetLanguageSelect) {
        advancedTargetLanguageSelect.addEventListener("change", (event) => {
            advancedTargetLanguage = event.target.value || ADVANCED_TARGET_LANGUAGE_DEFAULT;
            autoSaveSetting();
        });
        console.log("options.js: Change listener added to advanced-target-language select.");
    }

    // Extra instructions for advanced mode
    if (extraInstructionsInput) {
        extraInstructionsInput.addEventListener("input", () => {
            extraInstructions = extraInstructionsInput.value.trim();
            autoSaveSetting();
        });
        console.log("options.js: Input listener added to extra-instructions textarea.");
    }

    if (showTranslateButtonOnSelectionInput) {
        showTranslateButtonOnSelectionInput.addEventListener("change", () => {
            chrome.storage.sync.set({
                [SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY]:
                    showTranslateButtonOnSelectionInput.checked,
            });
            displayStatus("Settings saved!", false);
        });
    }

    // Add auto-save listeners to all form inputs
    if (apiKeyInput) {
        apiKeyInput.addEventListener("input", autoSaveSetting);
        console.log("options.js: Auto-save listener added to api-key input.");
    }

    if (apiEndpointInput) {
        apiEndpointInput.addEventListener("input", autoSaveSetting);
        console.log("options.js: Auto-save listener added to api-endpoint input.");
    }

    if (apiTypeSelect) {
        apiTypeSelect.addEventListener("change", (event) => {
            const selectedApiType = event.target.value;
            console.log("options.js: Provider changed to:", selectedApiType);

            // When switching provider:
            // 1. Ensure settings object exists for this provider (with defaults)
            if (!providerSettings[selectedApiType]) {
                providerSettings[selectedApiType] =
                    resolveProviderDefaults(selectedApiType);
            }

            // 2. Apply that provider's settings to the form
            applyProviderToForm(selectedApiType);

            // 3. Persist updated apiType and current providerSettings
            console.log("options.js: Saving selection change to storage.");
            chrome.storage.sync.set(
                {
                    providerSettings,
                    apiType: selectedApiType,
                    [SETTINGS_MODE_KEY]: settingsMode,
                    [BASIC_TARGET_LANGUAGE_KEY]: basicTargetLanguage,
                },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "options.js: Error saving apiType on change:",
                            chrome.runtime.lastError,
                        );
                        displayStatus(
                            `Error saving provider selection: ${chrome.runtime.lastError.message} `,
                            true,
                        );
                    } else {
                        console.log("options.js: Provider selection saved.");
                        displayStatus("Provider switched.", false);
                    }
                },
            );
        });
        console.log("options.js: Change event listener added to api-type select.");
    }

    if (modelNameInput) {
        modelNameInput.addEventListener("input", autoSaveSetting);
        console.log("options.js: Auto-save listener added to model-name input.");
    }

    if (fillDefaultEndpointButton) {
        fillDefaultEndpointButton.addEventListener("click", () => {
            console.log("options.js: Fill Default Endpoint button clicked.");
            const selectedApiType = apiTypeSelect.value;
            const defaults = resolveProviderDefaults(selectedApiType);

            if (defaults.apiEndpoint) {
                apiEndpointInput.value = defaults.apiEndpoint;
                console.log(
                    `options.js: Filled endpoint with default for ${selectedApiType}: ${defaults.apiEndpoint} `,
                );
                autoSaveSetting();
            } else {
                console.warn(
                    `options.js: No default endpoint found for provider: ${selectedApiType} `,
                );
                displayStatus(
                    `No default endpoint available for ${selectedApiType}.`,
                    true,
                );
            }
        });
        console.log(
            "options.js: Click event listener added to fill default endpoint button.",
        );
    } else {
        console.error("options.js: Could not find fill default endpoint button element!");
    }

    if (fillDefaultModelButton) {
        fillDefaultModelButton.addEventListener("click", () => {
            console.log("options.js: Fill Default Model button clicked.");
            const selectedApiType = apiTypeSelect.value;
            const defaults = resolveProviderDefaults(selectedApiType);

            if (defaults.modelName) {
                modelNameInput.value = defaults.modelName;
                console.log(
                    `options.js: Filled model name with default for ${selectedApiType}: ${defaults.modelName} `,
                );
                autoSaveSetting();
            } else {
                console.warn(
                    `options.js: No default model found for provider: ${selectedApiType} `,
                );
                displayStatus(`No default model available for ${selectedApiType}.`, true);
            }
        });
        console.log(
            "options.js: Click event listener added to fill default model button.",
        );
    } else {
        console.error("options.js: Could not find fill default model button element!");
    }

    // Ollama-specific event listeners
    if (ollamaModelSelect) {
        ollamaModelSelect.addEventListener("change", (event) => {
            const selectedModel = event.target.value;
            console.log("options.js: Ollama model selected:", selectedModel);

            if (selectedModel && providerSettings["ollama"]) {
                providerSettings["ollama"].modelName = selectedModel;
                // Also update the hidden modelNameInput so saving works correctly
                modelNameInput.value = selectedModel;
                autoSaveSetting();
            }
        });
        console.log("options.js: Change event listener added to Ollama model select.");
    }

    if (refreshOllamaModelsButton) {
        refreshOllamaModelsButton.addEventListener("click", async () => {
            console.log("options.js: Refresh Ollama models button clicked.");

            const settings =
                providerSettings["ollama"] || resolveProviderDefaults("ollama");
            const baseUrl =
                apiEndpointInput.value.trim() ||
                settings.apiEndpoint ||
                PROVIDER_DEFAULTS.ollama.apiEndpoint;

            displayStatus("Fetching models...", false);

            try {
                const models = await fetchOllamaModels(baseUrl);
                populateOllamaModelDropdown(models, settings.modelName);
                displayStatus(`Found ${models.length} model(s)`, false);
            } catch (error) {
                displayStatus(`Error: ${error.message}`, true);
            }
        });
        console.log(
            "options.js: Click event listener added to refresh Ollama models button.",
        );
    }

    // Cerebras-specific event listeners
    if (cerebrasModelSelect) {
        cerebrasModelSelect.addEventListener("change", (event) => {
            const selectedModel = event.target.value;
            console.log("options.js: Cerebras model selected:", selectedModel);

            if (selectedModel) {
                if (!providerSettings["cerebras"]) {
                    providerSettings["cerebras"] = resolveProviderDefaults("cerebras");
                }
                providerSettings["cerebras"].modelName = selectedModel;
                // Also update the hidden modelNameInput so saving works correctly
                modelNameInput.value = selectedModel;
                autoSaveSetting();
            }
        });
        console.log("options.js: Change event listener added to Cerebras model select."
        );
    }
});

console.log("options.js: Script loaded.");
