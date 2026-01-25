import {
    getStorage,
    setStorage,
    STORAGE_KEYS,
    type StorageGetResult,
    type ProviderSettingsMap,
} from "../shared/storage";
import {
    PROVIDERS,
    PROVIDER_DEFAULTS,
    BASIC_PROVIDERS,
    resolveProviderDefaults,
    type Provider,
} from "../shared/constants/providers";
import {
    SETTINGS_MODE_BASIC,
    SETTINGS_MODE_ADVANCED,
    BASIC_TARGET_LANGUAGE_DEFAULT,
    ADVANCED_TARGET_LANGUAGE_DEFAULT,
    DEFAULT_TRANSLATION_INSTRUCTIONS,
    type SettingsMode,
} from "../shared/constants/settings";
import {
    BASIC_TARGET_LANGUAGES,
    getBasicTargetLanguageLabel,
    buildBasicTranslationInstructions,
} from "../shared/constants/languages";

const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const apiEndpointInput = document.getElementById("api-endpoint") as HTMLInputElement;
const apiTypeSelect = document.getElementById("api-type") as HTMLSelectElement;
const statusMessage = document.getElementById("status-message") as HTMLElement;
const fillDefaultEndpointButton = document.getElementById(
    "fill-default-endpoint",
) as HTMLButtonElement;
const modelNameInput = document.getElementById("model-name") as HTMLInputElement;
const fillDefaultModelButton = document.getElementById("fill-default-model") as HTMLButtonElement;

const advancedTargetLanguageSelect = document.getElementById(
    "advanced-target-language",
) as HTMLSelectElement;
const extraInstructionsInput = document.getElementById(
    "extra-instructions",
) as HTMLTextAreaElement;

const settingsModeSelect = document.getElementById("settings-mode") as HTMLSelectElement;
const basicSettingsDiv = document.getElementById("basic-settings") as HTMLElement;
const advancedSettingsDiv = document.getElementById("advanced-settings") as HTMLElement;
const basicProviderSelect = document.getElementById("basic-provider") as HTMLSelectElement;
const basicApiKeyInput = document.getElementById("basic-api-key") as HTMLInputElement;
const basicTargetLanguageSelect = document.getElementById(
    "basic-target-language",
) as HTMLSelectElement;

const showTranslateButtonOnSelectionInput = document.getElementById(
    "show-translate-button-on-selection",
) as HTMLInputElement;

const ollamaSettingsDiv = document.getElementById("ollama-settings") as HTMLElement;
const ollamaModelSelect = document.getElementById("ollama-model-select") as HTMLSelectElement;
const refreshOllamaModelsButton = document.getElementById(
    "refresh-ollama-models",
) as HTMLButtonElement;
const apiKeyContainer = document.getElementById("api-key")?.closest(".mb-4") as HTMLElement;
const modelNameContainer = document.getElementById("model-name")?.closest(".mb-4") as HTMLElement;

const cerebrasSettingsDiv = document.getElementById("cerebras-settings") as HTMLElement;
const cerebrasModelSelect = document.getElementById("cerebras-model-select") as HTMLSelectElement;

const groqSettingsDiv = document.getElementById("groq-settings") as HTMLElement;
const groqModelSelect = document.getElementById("groq-model-select") as HTMLSelectElement;

let providerSettings: ProviderSettingsMap = {};
let settingsMode: SettingsMode = SETTINGS_MODE_BASIC;
let basicTargetLanguage = BASIC_TARGET_LANGUAGE_DEFAULT;
let advancedTargetLanguage = ADVANCED_TARGET_LANGUAGE_DEFAULT;
let extraInstructions = "";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function populateBasicLanguageDropdown(): void {
    if (!basicTargetLanguageSelect) return;

    basicTargetLanguageSelect.textContent = "";

    for (const lang of BASIC_TARGET_LANGUAGES) {
        const option = document.createElement("option");
        option.value = lang.value;
        option.textContent = lang.label;
        basicTargetLanguageSelect.appendChild(option);
    }
}

function populateAdvancedLanguageDropdown(): void {
    if (!advancedTargetLanguageSelect) return;

    advancedTargetLanguageSelect.textContent = "";

    for (const lang of BASIC_TARGET_LANGUAGES) {
        const option = document.createElement("option");
        option.value = lang.value;
        option.textContent = lang.label;
        advancedTargetLanguageSelect.appendChild(option);
    }
}

async function fetchOllamaModels(baseUrl: string): Promise<string[]> {
    const url = `${baseUrl.replace(/\/+$/, "")}/api/tags`;
    console.log("options.ts: Fetching Ollama models from:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const models = (data.models || []).map((m: { name: string }) => m.name);
        console.log("options.ts: Fetched Ollama models:", models);
        return models;
    } catch (error) {
        console.error("options.ts: Error fetching Ollama models:", error);
        throw error;
    }
}

function populateOllamaModelDropdown(models: string[], selectedModel = ""): void {
    if (!ollamaModelSelect) return;

    while (ollamaModelSelect.firstChild) {
        ollamaModelSelect.removeChild(ollamaModelSelect.firstChild);
    }

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "-- Select a model --";
    ollamaModelSelect.appendChild(placeholderOption);

    for (const model of models) {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        if (model === selectedModel) {
            option.selected = true;
        }
        ollamaModelSelect.appendChild(option);
    }
}

function updateProviderUI(provider: string): void {
    const isOllama = provider === "ollama";
    const isCerebras = provider === "cerebras";
    const isGroq = provider === "groq";

    if (ollamaSettingsDiv) {
        ollamaSettingsDiv.classList.toggle("hidden", !isOllama);
    }

    if (cerebrasSettingsDiv) {
        cerebrasSettingsDiv.classList.toggle("hidden", !isCerebras);
    }

    if (groqSettingsDiv) {
        groqSettingsDiv.classList.toggle("hidden", !isGroq);
    }

    if (modelNameContainer) {
        modelNameContainer.classList.toggle(
            "hidden",
            isOllama || isCerebras || isGroq || settingsMode === SETTINGS_MODE_BASIC,
        );
    }

    if (apiKeyContainer) {
        apiKeyContainer.classList.toggle(
            "hidden",
            isOllama || settingsMode === SETTINGS_MODE_BASIC,
        );
    }

    if (isOllama) {
        const settings = providerSettings["ollama" as Provider] || resolveProviderDefaults("ollama" as Provider);
        const baseUrl = settings.apiEndpoint || PROVIDER_DEFAULTS.ollama.apiEndpoint;

        fetchOllamaModels(baseUrl)
            .then((models) => {
                populateOllamaModelDropdown(models, settings.modelName);
            })
            .catch((error) => {
                displayStatus(`Could not fetch Ollama models: ${error.message}`, true);
            });
    }

    if (isCerebras && cerebrasModelSelect) {
        const settings = providerSettings["cerebras" as Provider] || resolveProviderDefaults("cerebras" as Provider);
        cerebrasModelSelect.value = settings.modelName || PROVIDER_DEFAULTS.cerebras.modelName;
    }

    if (isGroq && groqModelSelect) {
        const settings = providerSettings["groq" as Provider] || resolveProviderDefaults("groq" as Provider);
        groqModelSelect.value = settings.modelName || PROVIDER_DEFAULTS.groq.modelName;
    }
}

function updateSettingsModeUI(): void {
    const isBasic = settingsMode === SETTINGS_MODE_BASIC;

    if (basicSettingsDiv) {
        basicSettingsDiv.classList.toggle("hidden", !isBasic);
    }

    if (advancedSettingsDiv) {
        advancedSettingsDiv.classList.toggle("hidden", isBasic);
    }
}

async function loadSettings(): Promise<void> {
    console.log("options.ts: Attempting to load settings...");

    try {
        const result = await getStorage([
            "apiKey",
            "apiEndpoint",
            "apiType",
            "modelName",
            "providerSettings",
            "translationInstructions",
            STORAGE_KEYS.SETTINGS_MODE,
            STORAGE_KEYS.BASIC_TARGET_LANGUAGE,
            STORAGE_KEYS.ADVANCED_TARGET_LANGUAGE,
            STORAGE_KEYS.EXTRA_INSTRUCTIONS,
            STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION,
        ]);

        console.log("options.ts: Raw settings loaded from storage:", result);

        settingsMode = (result.settingsMode as SettingsMode) || SETTINGS_MODE_BASIC;
        basicTargetLanguage = result.basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT;
        advancedTargetLanguage = result.advancedTargetLanguage || ADVANCED_TARGET_LANGUAGE_DEFAULT;
        extraInstructions = result.extraInstructions || "";

        if (result.translationInstructions && !result.extraInstructions) {
            const oldInstructions = result.translationInstructions;
            if (!oldInstructions.startsWith("Translate the following text to")) {
                extraInstructions = oldInstructions;
                console.log("options.ts: Migrated old translationInstructions to extraInstructions");
            }
        }

        const shouldPersistModeMigration =
            !result.settingsMode || !result.basicTargetLanguage;

        const needsPersistShowButtonSetting =
            typeof result.showTranslateButtonOnSelection !== "boolean";

        const showButtonSetting =
            typeof result.showTranslateButtonOnSelection === "boolean"
                ? result.showTranslateButtonOnSelection
                : true;

        if (shouldPersistModeMigration || needsPersistShowButtonSetting) {
            setStorage({
                [STORAGE_KEYS.SETTINGS_MODE]: settingsMode,
                [STORAGE_KEYS.BASIC_TARGET_LANGUAGE]: basicTargetLanguage,
                [STORAGE_KEYS.ADVANCED_TARGET_LANGUAGE]: advancedTargetLanguage,
                [STORAGE_KEYS.EXTRA_INSTRUCTIONS]: extraInstructions,
                [STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION]: showButtonSetting,
            }).catch((error) => {
                console.error("options.ts: Error persisting mode migration:", error);
            });
        }

        if (settingsModeSelect) {
            settingsModeSelect.value = settingsMode;
        }

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
            const current = result.showTranslateButtonOnSelection;
            showTranslateButtonOnSelectionInput.checked =
                typeof current === "boolean" ? current : true;
        }

        providerSettings = result.providerSettings || {};

        if (
            !result.providerSettings &&
            (result.apiKey || result.apiEndpoint || result.modelName)
        ) {
            const legacyProvider = (result.apiType as Provider) || "openai";
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
                "options.ts: Migrated legacy settings into providerSettings:",
                providerSettings,
            );
            setStorage({ providerSettings }).catch((error) => {
                console.error("options.ts: Error persisting provider settings migration:", error);
            });
        }

        for (const provider of PROVIDERS) {
            if (!providerSettings[provider]) {
                providerSettings[provider] = resolveProviderDefaults(provider);
            } else {
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

        let initialProvider: Provider =
            result.apiType && PROVIDERS.includes(result.apiType as Provider)
                ? (result.apiType as Provider)
                : "openai";

        if (
            settingsMode === SETTINGS_MODE_BASIC &&
            !BASIC_PROVIDERS.includes(initialProvider as any)
        ) {
            initialProvider = "openai";
        }

        apiTypeSelect.value = initialProvider;

        if (basicProviderSelect) {
            basicProviderSelect.value = BASIC_PROVIDERS.includes(initialProvider as any)
                ? initialProvider
                : "openai";
        }

        applyProviderToForm(initialProvider);

        if (settingsMode === SETTINGS_MODE_BASIC) {
            applyBasicSettingsToUI(initialProvider);
        }
    } catch (error) {
        console.error("options.ts: Error loading settings:", error);
        displayStatus(
            `Error loading settings: ${error instanceof Error ? error.message : String(error)}`,
            true,
        );
    }
}

function applyProviderToForm(provider: string): void {
    const settings = providerSettings[provider] || resolveProviderDefaults(provider);
    console.log(`options.ts: Applying settings for provider ${provider}: `, settings);

    apiKeyInput.value = settings.apiKey || "";
    apiEndpointInput.value = settings.apiEndpoint || "";
    modelNameInput.value = settings.modelName || "";

    updateProviderUI(provider);
}

function applyBasicSettingsToUI(provider: string): void {
    const settings = providerSettings[provider] || resolveProviderDefaults(provider);

    if (basicProviderSelect) {
        basicProviderSelect.value = BASIC_PROVIDERS.includes(provider as any)
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

function autoSaveSetting(): void {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(saveSetting, 300);
}

async function saveSetting(): Promise<void> {
    console.log("options.ts: saveSetting function called.");

    const isBasic = settingsMode === SETTINGS_MODE_BASIC;

    if (isBasic) {
        const selectedProvider = basicProviderSelect?.value || "openai";
        const provider = BASIC_PROVIDERS.includes(selectedProvider as any)
            ? (selectedProvider as Provider)
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

        try {
            await setStorage({
                providerSettings,
                apiType: provider,
                [STORAGE_KEYS.SETTINGS_MODE]: settingsMode,
                [STORAGE_KEYS.BASIC_TARGET_LANGUAGE]: basicTargetLanguage,
            });
            displayStatus("Settings saved!", false);
        } catch (error) {
            console.error("options.ts: Error saving basic settings:", error);
            displayStatus(
                `Error saving: ${error instanceof Error ? error.message : String(error)}`,
                true,
            );
        }

        return;
    }

    const currentProvider = apiTypeSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();
    const modelName = modelNameInput.value.trim();

    advancedTargetLanguage = advancedTargetLanguageSelect?.value || ADVANCED_TARGET_LANGUAGE_DEFAULT;
    extraInstructions = extraInstructionsInput?.value.trim() || "";

    console.log(
        `options.ts: Saving for provider = ${currentProvider}: apiKey =***, apiEndpoint = ${apiEndpoint}, modelName = ${modelName}, targetLang = ${advancedTargetLanguage}`,
    );

    if (apiEndpoint) {
        try {
            new URL(apiEndpoint);
        } catch (_) {
            console.warn("options.ts: Invalid API Endpoint URL format.");
            displayStatus("Invalid API Endpoint URL format.", true);
            return;
        }
    }

    if (!providerSettings[currentProvider]) {
        providerSettings[currentProvider] = resolveProviderDefaults(currentProvider);
    }
    providerSettings[currentProvider] = {
        apiKey,
        apiEndpoint,
        modelName,
    };

    console.log(
        "options.ts: Attempting to save providerSettings to chrome.storage.sync...",
    );

    try {
        await setStorage({
            providerSettings,
            apiType: currentProvider as Provider,
            [STORAGE_KEYS.SETTINGS_MODE]: settingsMode,
            [STORAGE_KEYS.BASIC_TARGET_LANGUAGE]: basicTargetLanguage,
            [STORAGE_KEYS.ADVANCED_TARGET_LANGUAGE]: advancedTargetLanguage,
            [STORAGE_KEYS.EXTRA_INSTRUCTIONS]: extraInstructions,
        });
        console.log("options.ts: Provider settings saved successfully.");
        displayStatus("Settings saved!", false);
    } catch (error) {
        console.error("options.ts: Error saving settings:", error);
        displayStatus(
            `Error saving: ${error instanceof Error ? error.message : String(error)}`,
            true,
        );
    }
}

let statusTimeout: ReturnType<typeof setTimeout> | null = null;
function displayStatus(message: string, isError = false): void {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "#dc2626" : "#16a34a";
    statusMessage.classList.remove("opacity-0");

    if (statusTimeout) {
        clearTimeout(statusTimeout);
    }
    statusTimeout = setTimeout(() => {
        statusMessage.classList.add("opacity-0");
    }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("options.ts: DOMContentLoaded event fired.");

    populateBasicLanguageDropdown();
    populateAdvancedLanguageDropdown();
    loadSettings();

    if (settingsModeSelect) {
        settingsModeSelect.addEventListener("change", (event) => {
            const value = (event.target as HTMLSelectElement).value;
            settingsMode =
                value === SETTINGS_MODE_ADVANCED ? SETTINGS_MODE_ADVANCED : SETTINGS_MODE_BASIC;

            const isBasic = settingsMode === SETTINGS_MODE_BASIC;

            let activeProvider = apiTypeSelect.value;
            if (isBasic && !BASIC_PROVIDERS.includes(activeProvider as any)) {
                activeProvider = "openai";
                apiTypeSelect.value = activeProvider;
            }

            if (basicProviderSelect) {
                basicProviderSelect.value = BASIC_PROVIDERS.includes(activeProvider as any)
                    ? activeProvider
                    : "openai";
            }

            applyProviderToForm(activeProvider);
            applyBasicSettingsToUI(activeProvider);
            updateProviderUI(activeProvider);
            updateSettingsModeUI();

            setStorage({
                [STORAGE_KEYS.SETTINGS_MODE]: settingsMode,
                [STORAGE_KEYS.BASIC_TARGET_LANGUAGE]: basicTargetLanguage,
                [STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION]:
                    showTranslateButtonOnSelectionInput?.checked ?? true,
            }).catch((error) => {
                console.error("options.ts: Error saving settings mode:", error);
            });

            autoSaveSetting();
        });
    }

    if (basicProviderSelect) {
        basicProviderSelect.addEventListener("change", () => {
            const provider = basicProviderSelect.value;
            const safeProvider = BASIC_PROVIDERS.includes(provider as any)
                ? (provider as Provider)
                : "openai";

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
            basicTargetLanguage =
                (event.target as HTMLSelectElement).value || BASIC_TARGET_LANGUAGE_DEFAULT;
            autoSaveSetting();
        });
    }

    if (advancedTargetLanguageSelect) {
        advancedTargetLanguageSelect.addEventListener("change", (event) => {
            advancedTargetLanguage =
                (event.target as HTMLSelectElement).value || ADVANCED_TARGET_LANGUAGE_DEFAULT;
            autoSaveSetting();
        });
        console.log("options.ts: Change listener added to advanced-target-language select.");
    }

    if (extraInstructionsInput) {
        extraInstructionsInput.addEventListener("input", () => {
            extraInstructions = extraInstructionsInput.value.trim();
            autoSaveSetting();
        });
        console.log("options.ts: Input listener added to extra-instructions textarea.");
    }

    if (showTranslateButtonOnSelectionInput) {
        showTranslateButtonOnSelectionInput.addEventListener("change", () => {
            setStorage({
                [STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION]:
                    showTranslateButtonOnSelectionInput.checked,
            }).catch((error) => {
                console.error("options.ts: Error saving show button setting:", error);
            });
            displayStatus("Settings saved!", false);
        });
    }

    if (apiKeyInput) {
        apiKeyInput.addEventListener("input", autoSaveSetting);
        console.log("options.ts: Auto-save listener added to api-key input.");
    }

    if (apiEndpointInput) {
        apiEndpointInput.addEventListener("input", autoSaveSetting);
        console.log("options.ts: Auto-save listener added to api-endpoint input.");
    }

    if (apiTypeSelect) {
        apiTypeSelect.addEventListener("change", (event) => {
            const selectedApiType = (event.target as HTMLSelectElement).value;
            console.log("options.ts: Provider changed to:", selectedApiType);

            if (!providerSettings[selectedApiType]) {
                providerSettings[selectedApiType] = resolveProviderDefaults(selectedApiType);
            }

            applyProviderToForm(selectedApiType);

            console.log("options.ts: Saving selection change to storage.");
            setStorage({
                providerSettings,
                apiType: selectedApiType as Provider,
                [STORAGE_KEYS.SETTINGS_MODE]: settingsMode,
                [STORAGE_KEYS.BASIC_TARGET_LANGUAGE]: basicTargetLanguage,
            })
                .then(() => {
                    console.log("options.ts: Provider selection saved.");
                    displayStatus("Provider switched.", false);
                })
                .catch((error) => {
                    console.error(
                        "options.ts: Error saving apiType on change:",
                        error,
                    );
                    displayStatus(
                        `Error saving provider selection: ${error instanceof Error ? error.message : String(error)}`,
                        true,
                    );
                });
        });
        console.log("options.ts: Change event listener added to api-type select.");
    }

    if (modelNameInput) {
        modelNameInput.addEventListener("input", autoSaveSetting);
        console.log("options.ts: Auto-save listener added to model-name input.");
    }

    if (fillDefaultEndpointButton) {
        fillDefaultEndpointButton.addEventListener("click", () => {
            console.log("options.ts: Fill Default Endpoint button clicked.");
            const selectedApiType = apiTypeSelect.value;
            const defaults = resolveProviderDefaults(selectedApiType);

            if (defaults.apiEndpoint) {
                apiEndpointInput.value = defaults.apiEndpoint;
                console.log(
                    `options.ts: Filled endpoint with default for ${selectedApiType}: ${defaults.apiEndpoint}`,
                );
                autoSaveSetting();
            } else {
                console.warn(
                    `options.ts: No default endpoint found for provider: ${selectedApiType}`,
                );
                displayStatus(
                    `No default endpoint available for ${selectedApiType}.`,
                    true,
                );
            }
        });
        console.log(
            "options.ts: Click event listener added to fill default endpoint button.",
        );
    } else {
        console.error("options.ts: Could not find fill default endpoint button element!");
    }

    if (fillDefaultModelButton) {
        fillDefaultModelButton.addEventListener("click", () => {
            console.log("options.ts: Fill Default Model button clicked.");
            const selectedApiType = apiTypeSelect.value;
            const defaults = resolveProviderDefaults(selectedApiType);

            if (defaults.modelName) {
                modelNameInput.value = defaults.modelName;
                console.log(
                    `options.ts: Filled model name with default for ${selectedApiType}: ${defaults.modelName}`,
                );
                autoSaveSetting();
            } else {
                console.warn(
                    `options.ts: No default model found for provider: ${selectedApiType}`,
                );
                displayStatus(`No default model available for ${selectedApiType}.`, true);
            }
        });
        console.log(
            "options.ts: Click event listener added to fill default model button.",
        );
    } else {
        console.error("options.ts: Could not find fill default model button element!");
    }

    if (ollamaModelSelect) {
        ollamaModelSelect.addEventListener("change", (event) => {
            const selectedModel = (event.target as HTMLSelectElement).value;
            console.log("options.ts: Ollama model selected:", selectedModel);

            if (selectedModel && providerSettings["ollama"]) {
                providerSettings["ollama"].modelName = selectedModel;
                modelNameInput.value = selectedModel;
                autoSaveSetting();
            }
        });
        console.log("options.ts: Change event listener added to Ollama model select.");
    }

    if (refreshOllamaModelsButton) {
        refreshOllamaModelsButton.addEventListener("click", async () => {
            console.log("options.ts: Refresh Ollama models button clicked.");

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
                displayStatus(
                    `Error: ${error instanceof Error ? error.message : String(error)}`,
                    true,
                );
            }
        });
        console.log(
            "options.ts: Click event listener added to refresh Ollama models button.",
        );
    }

    if (cerebrasModelSelect) {
        cerebrasModelSelect.addEventListener("change", (event) => {
            const selectedModel = (event.target as HTMLSelectElement).value;
            console.log("options.ts: Cerebras model selected:", selectedModel);

            if (selectedModel) {
                if (!providerSettings["cerebras"]) {
                    providerSettings["cerebras"] = resolveProviderDefaults("cerebras");
                }
                providerSettings["cerebras"].modelName = selectedModel;
                modelNameInput.value = selectedModel;
                autoSaveSetting();
            }
        });
        console.log("options.ts: Change event listener added to Cerebras model select.");
    }

    if (groqModelSelect) {
        groqModelSelect.addEventListener("change", (event) => {
            const selectedModel = (event.target as HTMLSelectElement).value;
            console.log("options.ts: Groq model selected:", selectedModel);

            if (selectedModel) {
                if (!providerSettings["groq"]) {
                    providerSettings["groq"] = resolveProviderDefaults("groq");
                }
                providerSettings["groq"].modelName = selectedModel;
                modelNameInput.value = selectedModel;
                autoSaveSetting();
            }
        });
        console.log("options.ts: Change event listener added to Groq model select.");
    }
});

console.log("options.ts: Script loaded.");
