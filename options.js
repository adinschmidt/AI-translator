const apiKeyInput = document.getElementById("api-key");
const apiEndpointInput = document.getElementById("api-endpoint");
const apiTypeSelect = document.getElementById("api-type");
const statusMessage = document.getElementById("status-message");
const fillDefaultEndpointButton = document.getElementById("fill-default-endpoint");
const modelNameInput = document.getElementById("model-name");
const fillDefaultModelButton = document.getElementById("fill-default-model");
const translationInstructionsInput = document.getElementById("translation-instructions");
const fillDefaultInstructionsButton = document.getElementById("fill-default-instructions");

// Default translation instructions
const DEFAULT_TRANSLATION_INSTRUCTIONS = "Translate the following text to English. Keep the same meaning and tone. DO NOT add any additional text or explanations.";

const PROVIDERS = ["openai", "anthropic", "google", "grok", "openrouter"];

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
    grok: {
        apiEndpoint: "https://api.x.ai/v1/chat/completions",
        modelName: "grok-3-mini",
    },
    openrouter: {
        apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
        modelName: "openrouter/auto",
    },
};

// In-memory cache of per-provider settings for the current options session.
// Shape:
// {
//   [provider]: { apiKey, apiEndpoint, modelName }
// }
let providerSettings = {};

let debounceTimer;

function resolveProviderDefaults(provider) {
    const defaults = PROVIDER_DEFAULTS[provider] || {};
    return {
        apiKey: "",
        apiEndpoint: defaults.apiEndpoint || "",
        modelName: defaults.modelName || "",
        apiType: provider,
    };
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
        ["apiKey", "apiEndpoint", "apiType", "modelName", "providerSettings", "translationInstructions"],
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

            // Initialize from stored providerSettings or empty object
            providerSettings = result.providerSettings || {};

            // Backwards compatibility: if legacy flat settings exist, fold them
            // into the selected provider (or default openai) once.
            if (!result.providerSettings && (result.apiKey || result.apiEndpoint || result.modelName)) {
                const legacyProvider = result.apiType || "openai";
                providerSettings[legacyProvider] = {
                    apiKey: result.apiKey || "",
                    apiEndpoint: result.apiEndpoint || (PROVIDER_DEFAULTS[legacyProvider]?.apiEndpoint || ""),
                    modelName: result.modelName || (PROVIDER_DEFAULTS[legacyProvider]?.modelName || ""),
                };
                console.log("options.js: Migrated legacy settings into providerSettings:", providerSettings);
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
                        apiEndpoint: providerSettings[provider].apiEndpoint || base.apiEndpoint,
                        modelName: providerSettings[provider].modelName || base.modelName,
                        translationInstructions: providerSettings[provider].translationInstructions || DEFAULT_TRANSLATION_INSTRUCTIONS,
                    };
                }
            }

            // Determine initially selected provider (default to legacy apiType or openai)
            const initialProvider = result.apiType && PROVIDERS.includes(result.apiType)
                ? result.apiType
                : "openai";

            apiTypeSelect.value = initialProvider;
            applyProviderToForm(initialProvider);
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
    if (translationInstructionsInput) {
        translationInstructionsInput.value = settings.translationInstructions || DEFAULT_TRANSLATION_INSTRUCTIONS;
    }
}

function autoSaveSetting() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveSetting, 300);
}

function saveSetting() {
    console.log("options.js: saveSetting function called.");

    const currentProvider = apiTypeSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();
    const modelName = modelNameInput.value.trim();
    const translationInstructions = translationInstructionsInput ? translationInstructionsInput.value.trim() : DEFAULT_TRANSLATION_INSTRUCTIONS;

    console.log(
        `options.js: Saving for provider = ${currentProvider}: apiKey =***, apiEndpoint = ${apiEndpoint}, modelName = ${modelName} `,
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
        translationInstructions,
    };

    // Persist providerSettings and currently selected provider (apiType)
    console.log("options.js: Attempting to save providerSettings to chrome.storage.sync...");
    chrome.storage.sync.set(
        {
            providerSettings,
            apiType: currentProvider,
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
    loadSettings();

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
                providerSettings[selectedApiType] = resolveProviderDefaults(selectedApiType);
            }

            // 2. Apply that provider's settings to the form
            applyProviderToForm(selectedApiType);

            // 3. Persist updated apiType and current providerSettings
            console.log("options.js: Saving selection change to storage.");
            chrome.storage.sync.set(
                {
                    providerSettings,
                    apiType: selectedApiType,
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
        console.log("options.js: Click event listener added to fill default endpoint button.");
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
                displayStatus(
                    `No default model available for ${selectedApiType}.`,
                    true,
                );
            }
        });
        console.log("options.js: Click event listener added to fill default model button.");
    } else {
        console.error("options.js: Could not find fill default model button element!");
    }

    if (translationInstructionsInput) {
        translationInstructionsInput.addEventListener("input", autoSaveSetting);
        console.log("options.js: Auto-save listener added to translation-instructions input.");
    }

    if (fillDefaultInstructionsButton) {
        fillDefaultInstructionsButton.addEventListener("click", () => {
            console.log("options.js: Fill Default Instructions button clicked.");
            if (translationInstructionsInput) {
                translationInstructionsInput.value = DEFAULT_TRANSLATION_INSTRUCTIONS;
                console.log(`options.js: Filled translation instructions with default.`);
                autoSaveSetting();
            }
        });
        console.log("options.js: Click event listener added to fill default instructions button.");
    } else {
        console.error("options.js: Could not find fill default instructions button element!");
    }
});

console.log("options.js: Script loaded.");
