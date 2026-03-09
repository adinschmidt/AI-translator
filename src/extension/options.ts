import {
    getStorage,
    setStorage,
    STORAGE_KEYS,
    type ProviderSettingsMap,
} from "../shared/storage";
import {
    PROVIDERS,
    PROVIDER_DEFAULTS,
    PROVIDER_DISPLAY_NAMES,
    CEREBRAS_SUPPORTED_MODELS,
    canonicalizeProviderModelName,
    resolveProviderDefaults,
    type Provider,
} from "../shared/constants/providers";
import {
    SETTINGS_MODE_BASIC,
    SETTINGS_MODE_ADVANCED,
    BASIC_TARGET_LANGUAGE_DEFAULT,
    ADVANCED_TARGET_LANGUAGE_DEFAULT,
    KEEP_SELECTION_POPUP_OPEN_DEFAULT,
    DEBUG_MODE_DEFAULT,
    UI_THEME_LIGHT,
    UI_THEME_DARK,
    UI_THEME_SYSTEM,
    UI_THEME_DEFAULT,
    DEFAULT_TRANSLATION_INSTRUCTIONS,
    REDACTION_MODE_DEFAULT,
    type RedactionMode,
    type SettingsMode,
    type UITheme,
} from "../shared/constants/settings";
import {
    BASIC_TARGET_LANGUAGES,
    getBasicTargetLanguageLabel,
    buildBasicTranslationInstructions,
} from "../shared/constants/languages";
import {
    getI18nMessageOrFallback,
    getActiveUILocale,
    getActiveUILanguagePreference,
    initializeI18n,
    initializeI18nFromStorage,
    normalizeUILanguagePreference,
    UI_LANGUAGE_DEFAULT,
    UI_LANGUAGE_OPTIONS,
    type UILanguagePreference,
} from "../shared/i18n";

const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const apiEndpointInput = document.getElementById("api-endpoint") as HTMLInputElement;
const apiTypeSelect = document.getElementById("api-type") as HTMLSelectElement;
const statusMessage = document.getElementById("status-message") as HTMLElement;
const fillDefaultEndpointButton = document.getElementById(
    "fill-default-endpoint",
) as HTMLButtonElement;
const modelNameInput = document.getElementById("model-name") as HTMLInputElement;
const refreshModelsButton = document.getElementById(
    "refresh-models",
) as HTMLButtonElement;
const fillDefaultModelButton = document.getElementById(
    "fill-default-model",
) as HTMLButtonElement;
const modelListStatus = document.getElementById("model-list-status") as HTMLElement;
const modelOptionsContainer = document.getElementById(
    "model-options-container",
) as HTMLElement;
const modelOptionsList = document.getElementById(
    "model-options-list",
) as HTMLUListElement;
const modelOptionsEmpty = document.getElementById("model-options-empty") as HTMLElement;
const modelNameCombobox = document.getElementById("model-name-combobox") as HTMLElement;
const ollamaModelNote = document.getElementById("ollama-model-note") as HTMLElement;

const advancedTargetLanguageSelect = document.getElementById(
    "advanced-target-language",
) as HTMLSelectElement;
const advancedTargetLanguageCustomContainer = document.getElementById(
    "advanced-target-language-custom-container",
) as HTMLElement;
const advancedTargetLanguageCustomInput = document.getElementById(
    "advanced-target-language-custom",
) as HTMLInputElement;
const extraInstructionsInput = document.getElementById(
    "extra-instructions",
) as HTMLTextAreaElement;

const advancedModeToggle = document.getElementById(
    "advanced-mode-toggle",
) as HTMLInputElement;
const uiLanguageSelect = document.getElementById("ui-language") as HTMLSelectElement;
const uiThemeInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[name="ui-theme"]'),
);
const basicSettingsDiv = document.getElementById("basic-settings") as HTMLElement;
const advancedSettingsDiv = document.getElementById("advanced-settings") as HTMLElement;
const basicProviderSelect = document.getElementById(
    "basic-provider",
) as HTMLSelectElement;
const basicApiKeyInput = document.getElementById("basic-api-key") as HTMLInputElement;
const basicTargetLanguageSelect = document.getElementById(
    "basic-target-language",
) as HTMLSelectElement;
const basicTargetLanguageCustomContainer = document.getElementById(
    "basic-target-language-custom-container",
) as HTMLElement;
const basicTargetLanguageCustomInput = document.getElementById(
    "basic-target-language-custom",
) as HTMLInputElement;

const showTranslateButtonOnSelectionInput = document.getElementById(
    "show-translate-button-on-selection",
) as HTMLInputElement;
const keepSelectionPopupOpenInput = document.getElementById(
    "keep-selection-popup-open",
) as HTMLInputElement;
const debugModeInput = document.getElementById("debug-mode") as HTMLInputElement;
const redactSensitiveDataInput = document.getElementById(
    "redact-sensitive-data",
) as HTMLInputElement;

const apiKeyContainer = document
    .getElementById("api-key")
    ?.closest(".mb-4") as HTMLElement;
const modelNameContainer = document.getElementById("model-name-container") as HTMLElement;
const providerKeyDocsLink = document.getElementById(
    "provider-key-docs-link",
) as HTMLAnchorElement | null;
const helpDocsLink = document.getElementById(
    "help-docs-link",
) as HTMLAnchorElement | null;

const DOCS_BASE_URL = "https://adinschmidt.com/AI-translator";
const CUSTOM_TARGET_LANGUAGE_OPTION_VALUE = "__custom__";
const PROVIDER_DOC_ANCHORS: Record<Provider, string> = {
    openai: "openai",
    anthropic: "anthropic-claude",
    google: "google-gemini",
    groq: "groq",
    grok: "grok-xai",
    openrouter: "openrouter",
    deepseek: "deepseek",
    mistral: "mistral-ai",
    qwen: "qwen-alibaba-dashscope",
    cerebras: "cerebras",
    ollama: "ollama-local",
};

const MODEL_FETCHABLE_PROVIDERS = new Set<Provider>(PROVIDERS);
const OPENAI_COMPATIBLE_MODEL_ENDPOINT_PROVIDERS = new Set<Provider>([
    "openai",
    "groq",
    "grok",
    "openrouter",
    "deepseek",
    "mistral",
    "qwen",
    "cerebras",
]);

const PROVIDER_FALLBACK_MODELS: Record<Provider, string[]> = {
    openai: [PROVIDER_DEFAULTS.openai.modelName],
    anthropic: [PROVIDER_DEFAULTS.anthropic.modelName],
    google: [PROVIDER_DEFAULTS.google.modelName],
    groq: [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "moonshotai/kimi-k2-instruct",
        "qwen/qwen3-32b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "groq/compound",
        "groq/compound-mini",
        "allam-2-7b",
    ],
    grok: [PROVIDER_DEFAULTS.grok.modelName],
    openrouter: [PROVIDER_DEFAULTS.openrouter.modelName],
    deepseek: [PROVIDER_DEFAULTS.deepseek.modelName],
    mistral: [PROVIDER_DEFAULTS.mistral.modelName],
    qwen: [PROVIDER_DEFAULTS.qwen.modelName],
    cerebras: [...CEREBRAS_SUPPORTED_MODELS],
    ollama: [PROVIDER_DEFAULTS.ollama.modelName],
};

interface ProviderModelOptionsState {
    models: string[];
    source: "dynamic" | "fallback";
    statusText: string;
}

let providerSettings: ProviderSettingsMap = {};
let settingsMode: SettingsMode = SETTINGS_MODE_BASIC;
let basicTargetLanguage = BASIC_TARGET_LANGUAGE_DEFAULT;
let advancedTargetLanguage = ADVANCED_TARGET_LANGUAGE_DEFAULT;
let extraInstructions = "";
let debugModeEnabled = DEBUG_MODE_DEFAULT;
let redactionEnabled = REDACTION_MODE_DEFAULT === "auto";
let uiTheme: UITheme = UI_THEME_DEFAULT;
let uiLanguagePreference: UILanguagePreference = UI_LANGUAGE_DEFAULT;
let systemThemeMediaQuery: MediaQueryList | null = null;
let providerModelOptionsState: Partial<Record<Provider, ProviderModelOptionsState>> = {};
let activeModelFetchRequestId = 0;
let isModelDropdownOpen = false;
let activeModelOptionIndex = -1;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function t(key: string, fallback: string, substitutions?: string | string[]): string {
    return getI18nMessageOrFallback(key, fallback, substitutions);
}

function resolveDocsLocale(): string {
    return getActiveUILocale() || "en";
}

function getDocsUrl(path: string): string {
    const locale = resolveDocsLocale();
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const localizedPath =
        locale === "en" ? normalizedPath : `/${locale}${normalizedPath}`;
    return `${DOCS_BASE_URL}${localizedPath}`;
}

function populateUILanguageDropdown(): void {
    if (!uiLanguageSelect) {
        return;
    }

    uiLanguageSelect.textContent = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = UI_LANGUAGE_DEFAULT;
    defaultOption.textContent = t(
        "optionsUiLanguageDefaultOption",
        "Default (Browser language)",
    );
    uiLanguageSelect.appendChild(defaultOption);

    for (const option of UI_LANGUAGE_OPTIONS) {
        const languageOption = document.createElement("option");
        languageOption.value = option.value;
        languageOption.textContent = option.label;
        uiLanguageSelect.appendChild(languageOption);
    }
}

function setUILanguageSelectValue(value: UILanguagePreference): void {
    if (!uiLanguageSelect) {
        return;
    }

    uiLanguageSelect.value = normalizeUILanguagePreference(value);
}

async function applyUILanguagePreference(
    preference: UILanguagePreference,
): Promise<void> {
    uiLanguagePreference = normalizeUILanguagePreference(preference);
    await initializeI18n(uiLanguagePreference);

    localizeOptionsPage();
    populateUILanguageDropdown();
    setUILanguageSelectValue(uiLanguagePreference);
    refreshTargetLanguageDropdownLabels();
}

function refreshTargetLanguageDropdownLabels(): void {
    const currentBasicValue = resolveTargetLanguageFromControls(
        basicTargetLanguageSelect,
        basicTargetLanguageCustomInput,
        BASIC_TARGET_LANGUAGE_DEFAULT,
    );
    const currentAdvancedValue = resolveTargetLanguageFromControls(
        advancedTargetLanguageSelect,
        advancedTargetLanguageCustomInput,
        ADVANCED_TARGET_LANGUAGE_DEFAULT,
    );

    populateBasicLanguageDropdown();
    populateAdvancedLanguageDropdown();

    basicTargetLanguage = applyTargetLanguageToControls(
        currentBasicValue,
        basicTargetLanguageSelect,
        basicTargetLanguageCustomInput,
        basicTargetLanguageCustomContainer,
        BASIC_TARGET_LANGUAGE_DEFAULT,
    );

    advancedTargetLanguage = applyTargetLanguageToControls(
        currentAdvancedValue,
        advancedTargetLanguageSelect,
        advancedTargetLanguageCustomInput,
        advancedTargetLanguageCustomContainer,
        ADVANCED_TARGET_LANGUAGE_DEFAULT,
    );
}

function localizeOptionsPage(): void {
    document.documentElement.lang = getActiveUILocale();

    const textElements = document.querySelectorAll<HTMLElement>("[data-i18n]");
    for (const element of textElements) {
        const key = element.dataset.i18n;
        if (!key) {
            continue;
        }

        const fallback = element.textContent || "";
        element.textContent = t(key, fallback);
    }

    const htmlElements = document.querySelectorAll<HTMLElement>("[data-i18n-html]");
    for (const element of htmlElements) {
        const key = element.dataset.i18nHtml;
        if (!key) {
            continue;
        }

        const fallback = element.innerHTML;
        element.innerHTML = t(key, fallback);
    }

    const placeholderElements = document.querySelectorAll<HTMLElement>(
        "[data-i18n-placeholder]",
    );
    for (const element of placeholderElements) {
        const key = element.dataset.i18nPlaceholder;
        if (!key) {
            continue;
        }

        const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
        const fallback = inputElement.getAttribute("placeholder") || "";
        inputElement.setAttribute("placeholder", t(key, fallback));
    }

    const ariaElements = document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]");
    for (const element of ariaElements) {
        const key = element.dataset.i18nAriaLabel;
        if (!key) {
            continue;
        }

        const fallback = element.getAttribute("aria-label") || "";
        element.setAttribute("aria-label", t(key, fallback));
    }

    const titleElement = document.querySelector("title");
    if (titleElement && titleElement.dataset.i18n) {
        const fallback = titleElement.textContent || "";
        titleElement.textContent = t(titleElement.dataset.i18n, fallback);
    }
}

function updateDocsLinks(): void {
    if (helpDocsLink) {
        helpDocsLink.href = getDocsUrl("/getting-started");
    }

    if (apiTypeSelect) {
        updateProviderDocsLink(apiTypeSelect.value || "openai");
    }
}

function normalizeUITheme(value: unknown): UITheme {
    return value === UI_THEME_LIGHT ||
        value === UI_THEME_DARK ||
        value === UI_THEME_SYSTEM
        ? value
        : UI_THEME_DEFAULT;
}

function resolveUITheme(theme: UITheme): typeof UI_THEME_LIGHT | typeof UI_THEME_DARK {
    if (theme === UI_THEME_SYSTEM) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? UI_THEME_DARK
            : UI_THEME_LIGHT;
    }

    return theme;
}

function applyTheme(theme: UITheme): void {
    const resolvedTheme = resolveUITheme(theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.resolvedTheme = resolvedTheme;
}

function updateThemeSelectionUI(theme: UITheme): void {
    for (const input of uiThemeInputs) {
        input.checked = input.value === theme;
    }
}

function ensureSystemThemeWatcher(): void {
    if (systemThemeMediaQuery || !window.matchMedia) {
        return;
    }

    systemThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const onSystemThemeChange = () => {
        if (uiTheme === UI_THEME_SYSTEM) {
            applyTheme(uiTheme);
        }
    };

    if (typeof systemThemeMediaQuery.addEventListener === "function") {
        systemThemeMediaQuery.addEventListener("change", onSystemThemeChange);
        return;
    }

    if (typeof systemThemeMediaQuery.addListener === "function") {
        systemThemeMediaQuery.addListener(onSystemThemeChange);
    }
}

function resolveBuiltInTargetLanguageValue(
    value: string | null | undefined,
): string | null {
    const normalizedValue = value?.trim().toLowerCase();
    if (!normalizedValue) {
        return null;
    }

    for (const language of BASIC_TARGET_LANGUAGES) {
        if (language.value.toLowerCase() === normalizedValue) {
            return language.value;
        }

        if (language.label.toLowerCase() === normalizedValue) {
            return language.value;
        }
    }

    return null;
}

function populateTargetLanguageDropdown(selectEl: HTMLSelectElement): void {
    selectEl.textContent = "";

    for (const lang of BASIC_TARGET_LANGUAGES) {
        const option = document.createElement("option");
        option.value = lang.value;
        option.textContent = lang.label;
        selectEl.appendChild(option);
    }

    const customOption = document.createElement("option");
    customOption.value = CUSTOM_TARGET_LANGUAGE_OPTION_VALUE;
    customOption.textContent = t("optionsCustomOptionLabel", "Custom…");
    selectEl.appendChild(customOption);
}

function populateProviderDropdown(select: HTMLSelectElement | null): void {
    if (!select) return;
    select.textContent = "";
    for (const id of PROVIDERS) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = PROVIDER_DISPLAY_NAMES[id];
        select.appendChild(option);
    }
}

function populateBasicLanguageDropdown(): void {
    if (!basicTargetLanguageSelect) {
        return;
    }

    populateTargetLanguageDropdown(basicTargetLanguageSelect);
}

function populateAdvancedLanguageDropdown(): void {
    if (!advancedTargetLanguageSelect) {
        return;
    }

    populateTargetLanguageDropdown(advancedTargetLanguageSelect);
}

function setCustomTargetLanguageVisibility(
    container: HTMLElement | null,
    selectEl: HTMLSelectElement | null,
): void {
    if (!container || !selectEl) {
        return;
    }

    const isCustom = selectEl.value === CUSTOM_TARGET_LANGUAGE_OPTION_VALUE;
    container.classList.toggle("hidden", !isCustom);
}

function normalizeStoredTargetLanguage(
    value: string | null | undefined,
    fallback: string,
): string {
    const normalized = value?.trim() || "";
    return normalized || fallback;
}

function resolveTargetLanguageFromControls(
    selectEl: HTMLSelectElement | null,
    customInput: HTMLInputElement | null,
    fallback: string,
): string {
    if (!selectEl) {
        return fallback;
    }

    if (selectEl.value === CUSTOM_TARGET_LANGUAGE_OPTION_VALUE) {
        const customValue = customInput?.value.trim() || "";
        return customValue || fallback;
    }

    return selectEl.value || fallback;
}

function applyTargetLanguageToControls(
    value: string,
    selectEl: HTMLSelectElement | null,
    customInput: HTMLInputElement | null,
    customContainer: HTMLElement | null,
    fallback: string,
): string {
    const normalizedValue = normalizeStoredTargetLanguage(value, fallback);
    const builtInValue = resolveBuiltInTargetLanguageValue(normalizedValue);
    const isBuiltIn = builtInValue !== null;

    if (selectEl) {
        selectEl.value = builtInValue || CUSTOM_TARGET_LANGUAGE_OPTION_VALUE;
    }

    if (customInput) {
        customInput.value = isBuiltIn ? "" : normalizedValue;
    }

    setCustomTargetLanguageVisibility(customContainer, selectEl);

    return builtInValue || normalizedValue;
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

function normalizeModelList(models: string[]): string[] {
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const model of models) {
        const normalized = model.trim();
        if (!normalized || seen.has(normalized)) {
            continue;
        }
        seen.add(normalized);
        deduped.push(normalized);
    }
    return deduped;
}

function truncateErrorDetails(details: string, maxLength = 180): string {
    const normalized = details.replace(/\s+/g, " ").trim();
    if (!normalized) {
        return "";
    }
    if (normalized.length <= maxLength) {
        return normalized;
    }
    return `${normalized.slice(0, maxLength - 1)}…`;
}

async function fetchJsonOrThrow(url: string, init?: RequestInit): Promise<any> {
    const response = await fetch(url, init);
    if (!response.ok) {
        const details = truncateErrorDetails(await response.text());
        throw new Error(
            details
                ? `HTTP ${response.status}: ${response.statusText} (${details})`
                : `HTTP ${response.status}: ${response.statusText}`,
        );
    }
    return response.json();
}

function resolveModelIdentifier(item: any): string {
    if (typeof item === "string") {
        return item;
    }

    if (typeof item?.id === "string" && item.id.trim()) {
        return item.id;
    }

    if (typeof item?.name === "string" && item.name.trim()) {
        return item.name;
    }

    return "";
}

function resolveStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
}

function resolveModelCapabilityHints(item: any): string[] {
    const hints = [
        ...resolveStringArray(item?.modalities),
        ...resolveStringArray(item?.input_modalities),
        ...resolveStringArray(item?.output_modalities),
        ...resolveStringArray(item?.supported_modalities),
        ...resolveStringArray(item?.architecture?.modalities),
        ...resolveStringArray(item?.architecture?.input_modalities),
        ...resolveStringArray(item?.architecture?.output_modalities),
        ...resolveStringArray(item?.capabilities?.modalities),
        ...resolveStringArray(item?.capabilities?.input_modalities),
        ...resolveStringArray(item?.capabilities?.output_modalities),
    ];

    return hints;
}

function resolveSupportedGenerationMethods(item: any): string[] {
    return resolveStringArray(item?.supportedGenerationMethods);
}

function hasTextGenerationMethod(item: any): boolean {
    const methods = resolveSupportedGenerationMethods(item);
    if (methods.length === 0) {
        return false;
    }

    return methods.some((method) => {
        return (
            method.includes("generatecontent") ||
            method.includes("chat") ||
            method.includes("message") ||
            method.includes("completion")
        );
    });
}

function looksLikeNonTextModelIdentifier(modelId: string): boolean {
    const normalized = modelId.trim().toLowerCase();
    if (!normalized) {
        return false;
    }

    return (
        normalized.includes("whisper") ||
        normalized.includes("transcribe") ||
        normalized.includes("transcription") ||
        normalized.includes("tts") ||
        normalized.includes("text-to-speech") ||
        normalized.includes("speech-to-text") ||
        normalized.includes("embedding") ||
        normalized.includes("moderation")
    );
}

function isTextCapableModel(item: any): boolean {
    const capabilityHints = resolveModelCapabilityHints(item);
    if (capabilityHints.length > 0) {
        const hasTextHint = capabilityHints.some((hint) => {
            return (
                hint === "text" ||
                hint.includes("text") ||
                hint.includes("chat") ||
                hint.includes("language")
            );
        });

        if (hasTextHint) {
            return true;
        }

        const hasExplicitNonTextHint = capabilityHints.some((hint) => {
            return (
                hint.includes("audio") ||
                hint.includes("speech") ||
                hint.includes("transcription") ||
                hint.includes("tts") ||
                hint.includes("embedding") ||
                hint.includes("moderation")
            );
        });

        if (hasExplicitNonTextHint) {
            return false;
        }
    }

    if (hasTextGenerationMethod(item)) {
        return true;
    }

    const modelId = resolveModelIdentifier(item);
    if (modelId && looksLikeNonTextModelIdentifier(modelId)) {
        return false;
    }

    return true;
}

function parseOpenAICompatibleModels(data: any): string[] {
    const dataItems: any[] = Array.isArray(data?.data) ? data.data : [];

    if (dataItems.length > 0) {
        return normalizeModelList(
            dataItems
                .filter((item) => isTextCapableModel(item))
                .map((item) => resolveModelIdentifier(item))
                .filter((model): model is string => typeof model === "string"),
        );
    }

    const modelItems: any[] = Array.isArray(data?.models) ? data.models : [];

    return normalizeModelList(
        modelItems
            .filter((item) => isTextCapableModel(item))
            .map((item) => resolveModelIdentifier(item))
            .filter((model): model is string => typeof model === "string"),
    );
}

function parseAnthropicModels(data: any): string[] {
    const fromData: any[] = Array.isArray(data?.data) ? data.data : [];
    return normalizeModelList(
        fromData
            .filter((item) => isTextCapableModel(item))
            .map((item) => resolveModelIdentifier(item))
            .filter((model): model is string => typeof model === "string"),
    );
}

function parseGoogleModels(data: any): string[] {
    const models = Array.isArray(data?.models) ? data.models : [];
    const normalized = models
        .filter((item: any) => {
            const methods = resolveSupportedGenerationMethods(item);
            if (methods.length > 0) {
                return methods.includes("generatecontent");
            }

            return isTextCapableModel(item);
        })
        .map((item: any) => {
            const name = resolveModelIdentifier(item);
            return name.replace(/^models\//, "");
        });
    return normalizeModelList(normalized);
}

function buildModelsPathFromOpenAICompatibleEndpoint(pathname: string): string {
    let path = pathname.replace(/\/+$/, "");
    path = path.replace(/\/chat\/completions$/i, "");
    path = path.replace(/\/completions$/i, "");
    path = path.replace(/\/responses$/i, "");

    if (!path || path === "/") {
        path = "/v1";
    }

    if (!path.endsWith("/models")) {
        path = `${path}/models`;
    }

    return path;
}

function buildModelsPathFromAnthropicEndpoint(pathname: string): string {
    let path = pathname.replace(/\/+$/, "");
    path = path.replace(/\/messages$/i, "");

    if (!path || path === "/") {
        path = "/v1";
    }

    if (!path.endsWith("/models")) {
        path = `${path}/models`;
    }

    return path;
}

function buildModelsPathFromGoogleEndpoint(pathname: string): string {
    let path = pathname.replace(/\/+$/, "");
    path = path.replace(/\/models\/[^/]+:[^/]+$/i, "");

    if (!path || path === "/") {
        path = "/v1beta";
    }

    if (!path.endsWith("/models")) {
        path = `${path}/models`;
    }

    return path;
}

function buildModelsUrl(
    endpoint: string,
    provider: Provider,
    pathResolver: (pathname: string) => string,
): string {
    const fallbackEndpoint = PROVIDER_DEFAULTS[provider].apiEndpoint;
    const endpointToUse = endpoint.trim() || fallbackEndpoint;

    let parsed: URL;
    try {
        parsed = new URL(endpointToUse);
    } catch {
        return "";
    }

    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = pathResolver(parsed.pathname || "/");
    return parsed.toString();
}

function buildOpenAICompatibleModelsUrl(endpoint: string, provider: Provider): string {
    return buildModelsUrl(
        endpoint,
        provider,
        buildModelsPathFromOpenAICompatibleEndpoint,
    );
}

function buildAnthropicModelsUrl(endpoint: string): string {
    return buildModelsUrl(endpoint, "anthropic", buildModelsPathFromAnthropicEndpoint);
}

function buildGoogleModelsUrl(endpoint: string): string {
    return buildModelsUrl(endpoint, "google", buildModelsPathFromGoogleEndpoint);
}

function getProviderDisplayName(provider: Provider): string {
    return PROVIDER_DISPLAY_NAMES[provider] || provider;
}

function resolveModelFetchSettings(provider: Provider): {
    apiKey: string;
    apiEndpoint: string;
    modelName: string;
} {
    const settings = providerSettings[provider] || resolveProviderDefaults(provider);
    const isActiveProvider = apiTypeSelect.value === provider;

    return {
        apiKey: isActiveProvider ? apiKeyInput.value.trim() : settings.apiKey || "",
        apiEndpoint: isActiveProvider
            ? apiEndpointInput.value.trim()
            : settings.apiEndpoint || "",
        modelName: isActiveProvider
            ? canonicalizeProviderModelName(provider, modelNameInput.value.trim())
            : canonicalizeProviderModelName(provider, settings.modelName || ""),
    };
}

function resolveFallbackModels(provider: Provider, currentModel = ""): string[] {
    const defaults = PROVIDER_DEFAULTS[provider]?.modelName || "";
    const fallback = PROVIDER_FALLBACK_MODELS[provider] || [];
    const canonicalCurrent = canonicalizeProviderModelName(provider, currentModel);
    return normalizeModelList([...fallback, defaults, canonicalCurrent].filter(Boolean));
}

function setModelListStatus(message: string): void {
    if (!modelListStatus) {
        return;
    }
    modelListStatus.textContent = message;
}

function getModelOptionButtons(): HTMLButtonElement[] {
    if (!modelOptionsList) {
        return [];
    }

    return Array.from(
        modelOptionsList.querySelectorAll<HTMLButtonElement>(".model-option-button"),
    );
}

function setModelDropdownExpanded(isExpanded: boolean): void {
    if (!modelNameInput) {
        return;
    }

    modelNameInput.setAttribute("aria-expanded", isExpanded ? "true" : "false");
}

function setActiveModelOption(index: number): void {
    const buttons = getModelOptionButtons();
    if (buttons.length === 0) {
        activeModelOptionIndex = -1;
        return;
    }

    let nextIndex = index;
    if (nextIndex < 0) {
        nextIndex = buttons.length - 1;
    } else if (nextIndex >= buttons.length) {
        nextIndex = 0;
    }

    activeModelOptionIndex = nextIndex;
    for (let i = 0; i < buttons.length; i++) {
        const isActive = i === activeModelOptionIndex;
        buttons[i].classList.toggle("is-active", isActive);
        buttons[i].setAttribute("aria-selected", isActive ? "true" : "false");
    }

    buttons[activeModelOptionIndex].scrollIntoView({ block: "nearest" });
}

function clearActiveModelOption(): void {
    const buttons = getModelOptionButtons();
    activeModelOptionIndex = -1;
    for (const button of buttons) {
        button.classList.remove("is-active");
        button.setAttribute("aria-selected", "false");
    }
}

function closeModelDropdown(): void {
    isModelDropdownOpen = false;
    clearActiveModelOption();
    if (modelOptionsContainer) {
        modelOptionsContainer.classList.add("hidden");
    }
    setModelDropdownExpanded(false);
}

function openModelDropdown(provider: Provider): void {
    if (settingsMode !== SETTINGS_MODE_ADVANCED) {
        return;
    }

    isModelDropdownOpen = true;
    renderModelOptions(provider, modelNameInput.value);
}

function renderModelOptions(provider: Provider, query: string): void {
    if (!modelOptionsContainer || !modelOptionsList || !modelOptionsEmpty) {
        return;
    }

    const state = providerModelOptionsState[provider];
    const options = state?.models || resolveFallbackModels(provider, query);
    const trimmedQuery = query.trim();
    const normalizedQuery = trimmedQuery.toLowerCase();
    const filteredOptions = normalizedQuery
        ? options.filter((model) => model.toLowerCase().includes(normalizedQuery))
        : options;

    modelOptionsList.textContent = "";
    modelOptionsEmpty.textContent = "";
    modelOptionsEmpty.classList.add("hidden");

    if (filteredOptions.length > 0) {
        for (const model of filteredOptions.slice(0, 100)) {
            const item = document.createElement("li");
            item.className = "model-options-item";
            const button = document.createElement("button");
            button.type = "button";
            button.className = "model-option-button";
            button.textContent = model;
            button.setAttribute("role", "option");
            button.setAttribute("aria-selected", "false");
            button.addEventListener("mouseenter", () => {
                const buttons = getModelOptionButtons();
                const index = buttons.indexOf(button);
                if (index >= 0) {
                    setActiveModelOption(index);
                }
            });
            button.addEventListener("click", () => {
                modelNameInput.value = model;
                autoSaveSetting();
                closeModelDropdown();
            });
            item.appendChild(button);
            modelOptionsList.appendChild(item);
        }

        if (filteredOptions.length > 100) {
            modelOptionsEmpty.textContent = t(
                "optionsModelStatusShowingFirstN",
                "Showing the first $1 models. Keep typing to narrow results.",
                "100",
            );
            modelOptionsEmpty.classList.remove("hidden");
        }
    }

    if (trimmedQuery) {
        const item = document.createElement("li");
        item.className = "model-options-item";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "model-option-button is-custom";
        button.textContent = t(
            "optionsModelStatusUseCustomModelName",
            'Use custom model name: "$1"',
            trimmedQuery,
        );
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", "false");
        button.addEventListener("click", () => {
            modelNameInput.value = trimmedQuery;
            autoSaveSetting();
            closeModelDropdown();
        });
        item.appendChild(button);
        modelOptionsList.appendChild(item);
    }

    if (!modelOptionsList.hasChildNodes()) {
        modelOptionsEmpty.textContent = t(
            "optionsModelStatusNoModelsAvailable",
            "No models available. Enter a custom model name.",
        );
        modelOptionsEmpty.classList.remove("hidden");
    }

    const shouldShowDropdown =
        isModelDropdownOpen && settingsMode === SETTINGS_MODE_ADVANCED;
    modelOptionsContainer.classList.toggle("hidden", !shouldShowDropdown);
    setModelDropdownExpanded(shouldShowDropdown);

    if (!shouldShowDropdown) {
        clearActiveModelOption();
        return;
    }

    const buttons = getModelOptionButtons();
    if (buttons.length === 0) {
        activeModelOptionIndex = -1;
        return;
    }

    if (activeModelOptionIndex >= buttons.length) {
        activeModelOptionIndex = buttons.length - 1;
    }

    if (activeModelOptionIndex >= 0) {
        setActiveModelOption(activeModelOptionIndex);
    } else {
        clearActiveModelOption();
    }
}

async function fetchProviderModels(
    provider: Provider,
    apiEndpoint: string,
    apiKey: string,
): Promise<string[]> {
    if (provider === "ollama") {
        return fetchOllamaModels(apiEndpoint || PROVIDER_DEFAULTS.ollama.apiEndpoint);
    }

    if (!apiKey) {
        throw new Error(
            t("optionsModelErrorAddApiKey", "Add an API key to fetch live models."),
        );
    }

    if (provider === "anthropic") {
        const modelsUrl = buildAnthropicModelsUrl(apiEndpoint);
        if (!modelsUrl) {
            throw new Error(
                t("optionsModelErrorInvalidEndpointUrl", "Invalid endpoint URL."),
            );
        }
        const data = await fetchJsonOrThrow(modelsUrl, {
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
        });
        return parseAnthropicModels(data);
    }

    if (provider === "google") {
        const modelsUrl = buildGoogleModelsUrl(apiEndpoint);
        if (!modelsUrl) {
            throw new Error(
                t("optionsModelErrorInvalidEndpointUrl", "Invalid endpoint URL."),
            );
        }
        const url = new URL(modelsUrl);
        url.searchParams.set("key", apiKey);
        const data = await fetchJsonOrThrow(url.toString());
        return parseGoogleModels(data);
    }

    if (OPENAI_COMPATIBLE_MODEL_ENDPOINT_PROVIDERS.has(provider)) {
        const modelsUrl = buildOpenAICompatibleModelsUrl(apiEndpoint, provider);
        if (!modelsUrl) {
            throw new Error(
                t("optionsModelErrorInvalidEndpointUrl", "Invalid endpoint URL."),
            );
        }
        const data = await fetchJsonOrThrow(modelsUrl, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        return parseOpenAICompatibleModels(data);
    }

    throw new Error(
        t(
            "optionsModelErrorNotConfiguredForProvider",
            "Model fetching is not configured for $1.",
            provider,
        ),
    );
}

async function refreshModelOptionsForProvider(
    provider: Provider,
    forceRefresh = false,
): Promise<void> {
    const existingState = providerModelOptionsState[provider];
    if (!forceRefresh && existingState) {
        if (apiTypeSelect.value === provider) {
            setModelListStatus(existingState.statusText);
            renderModelOptions(provider, modelNameInput.value);
            if (refreshModelsButton) {
                refreshModelsButton.disabled = false;
            }
        }
        return;
    }

    const requestId = ++activeModelFetchRequestId;
    if (apiTypeSelect.value === provider) {
        setModelListStatus(t("optionsModelStatusLoadingModels", "Loading models..."));
        if (refreshModelsButton) {
            refreshModelsButton.disabled = true;
        }
    }

    const settings = resolveModelFetchSettings(provider);
    const fallbackModels = resolveFallbackModels(provider, settings.modelName);

    let nextState: ProviderModelOptionsState;
    try {
        if (!MODEL_FETCHABLE_PROVIDERS.has(provider)) {
            throw new Error(
                t(
                    "optionsModelErrorLiveDiscoveryUnavailable",
                    "Live model discovery is not available for this provider.",
                ),
            );
        }

        const dynamicModels = normalizeModelList(
            (
                await fetchProviderModels(provider, settings.apiEndpoint, settings.apiKey)
            ).map((model) => canonicalizeProviderModelName(provider, model)),
        );

        if (dynamicModels.length === 0) {
            throw new Error(
                t(
                    "optionsModelErrorProviderReturnedNoModels",
                    "Provider returned no models.",
                ),
            );
        }

        nextState = {
            models: normalizeModelList([...dynamicModels, settings.modelName]),
            source: "dynamic",
            statusText: t(
                "optionsModelStatusLoadedFromProvider",
                "Loaded $1 model(s) from $2.",
                [String(dynamicModels.length), getProviderDisplayName(provider)],
            ),
        };
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        nextState = {
            models: fallbackModels,
            source: "fallback",
            statusText: fallbackModels.length
                ? t(
                      "optionsModelStatusFallbackWithSuggestions",
                      "$1 Showing built-in suggestions.",
                      reason,
                  )
                : t(
                      "optionsModelStatusFallbackCustomOnly",
                      "$1 Enter a custom model name.",
                      reason,
                  ),
        };
        console.warn(
            `options.ts: Falling back to built-in models for provider ${provider}:`,
            reason,
        );
    }

    providerModelOptionsState[provider] = nextState;

    if (requestId !== activeModelFetchRequestId) {
        return;
    }

    if (apiTypeSelect.value === provider) {
        setModelListStatus(nextState.statusText);
        renderModelOptions(provider, modelNameInput.value);
        if (refreshModelsButton) {
            refreshModelsButton.disabled = false;
        }
    }
}

function invalidateModelOptionsForProvider(provider: Provider): void {
    delete providerModelOptionsState[provider];
}

function updateProviderDocsLink(provider: string): void {
    if (!providerKeyDocsLink) {
        return;
    }

    const anchor = PROVIDER_DOC_ANCHORS[provider as Provider] || "general-setup";
    providerKeyDocsLink.href = `${getDocsUrl("/providers")}#${anchor}`;
}

function updateProviderUI(provider: string): void {
    updateProviderDocsLink(provider);

    const safeProvider: Provider =
        provider && PROVIDERS.includes(provider as Provider)
            ? (provider as Provider)
            : "openai";
    const isOllama = safeProvider === "ollama";
    const isBasicMode = settingsMode === SETTINGS_MODE_BASIC;

    if (modelNameContainer) {
        modelNameContainer.classList.toggle("hidden", isBasicMode);
    }

    if (apiKeyContainer) {
        apiKeyContainer.classList.toggle("hidden", isOllama || isBasicMode);
    }

    if (ollamaModelNote) {
        ollamaModelNote.classList.toggle("hidden", !isOllama || isBasicMode);
    }

    if (modelOptionsContainer) {
        modelOptionsContainer.classList.toggle(
            "hidden",
            isBasicMode || !isModelDropdownOpen,
        );
    }

    if (isBasicMode) {
        setModelListStatus("");
        closeModelDropdown();
        return;
    }

    void refreshModelOptionsForProvider(safeProvider, false);
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
            STORAGE_KEYS.KEEP_SELECTION_POPUP_OPEN,
            STORAGE_KEYS.DEBUG_MODE,
            STORAGE_KEYS.REDACTION_MODE,
            STORAGE_KEYS.UI_THEME,
            STORAGE_KEYS.UI_LANGUAGE,
        ]);

        console.log("options.ts: Raw settings loaded from storage:", result);

        settingsMode = (result.settingsMode as SettingsMode) || SETTINGS_MODE_BASIC;
        basicTargetLanguage = result.basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT;
        advancedTargetLanguage =
            result.advancedTargetLanguage || ADVANCED_TARGET_LANGUAGE_DEFAULT;
        extraInstructions = result.extraInstructions || "";
        uiTheme = normalizeUITheme(result.uiTheme);
        applyTheme(uiTheme);
        updateThemeSelectionUI(uiTheme);

        if (result.translationInstructions && !result.extraInstructions) {
            const oldInstructions = result.translationInstructions;
            if (!oldInstructions.startsWith("Translate the following text to")) {
                extraInstructions = oldInstructions;
                console.log(
                    "options.ts: Migrated old translationInstructions to extraInstructions",
                );
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

        const needsPersistKeepPopupSetting =
            typeof result.keepSelectionPopupOpen !== "boolean";

        const keepPopupSetting =
            typeof result.keepSelectionPopupOpen === "boolean"
                ? result.keepSelectionPopupOpen
                : KEEP_SELECTION_POPUP_OPEN_DEFAULT;

        const needsPersistDebugModeSetting = typeof result.debugMode !== "boolean";
        debugModeEnabled =
            typeof result.debugMode === "boolean" ? result.debugMode : DEBUG_MODE_DEFAULT;
        const needsPersistRedactionModeSetting =
            typeof result.redactionMode === "undefined";
        redactionEnabled =
            result.redactionMode !== "off"; // "auto" or undefined → true
        const needsPersistUIThemeSetting =
            normalizeUITheme(result.uiTheme) !== result.uiTheme;
        const normalizedUILanguage = normalizeUILanguagePreference(result.uiLanguage);
        const needsPersistUILanguageSetting = normalizedUILanguage !== result.uiLanguage;
        uiLanguagePreference = normalizedUILanguage;
        if (uiLanguagePreference !== getActiveUILanguagePreference()) {
            await applyUILanguagePreference(uiLanguagePreference);
            updateDocsLinks();
        } else {
            setUILanguageSelectValue(uiLanguagePreference);
        }

        if (
            shouldPersistModeMigration ||
            needsPersistShowButtonSetting ||
            needsPersistKeepPopupSetting ||
            needsPersistDebugModeSetting ||
            needsPersistRedactionModeSetting ||
            needsPersistUIThemeSetting ||
            needsPersistUILanguageSetting
        ) {
            setStorage({
                [STORAGE_KEYS.SETTINGS_MODE]: settingsMode,
                [STORAGE_KEYS.BASIC_TARGET_LANGUAGE]: basicTargetLanguage,
                [STORAGE_KEYS.ADVANCED_TARGET_LANGUAGE]: advancedTargetLanguage,
                [STORAGE_KEYS.EXTRA_INSTRUCTIONS]: extraInstructions,
                [STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION]: showButtonSetting,
                [STORAGE_KEYS.KEEP_SELECTION_POPUP_OPEN]: keepPopupSetting,
                [STORAGE_KEYS.DEBUG_MODE]: debugModeEnabled,
                [STORAGE_KEYS.REDACTION_MODE]: redactionEnabled ? "auto" : "off",
                [STORAGE_KEYS.UI_THEME]: uiTheme,
                [STORAGE_KEYS.UI_LANGUAGE]: uiLanguagePreference,
            }).catch((error) => {
                console.error("options.ts: Error persisting mode migration:", error);
            });
        }

        if (advancedModeToggle) {
            advancedModeToggle.checked = settingsMode === SETTINGS_MODE_ADVANCED;
        }

        populateBasicLanguageDropdown();
        populateAdvancedLanguageDropdown();

        basicTargetLanguage = applyTargetLanguageToControls(
            basicTargetLanguage,
            basicTargetLanguageSelect,
            basicTargetLanguageCustomInput,
            basicTargetLanguageCustomContainer,
            BASIC_TARGET_LANGUAGE_DEFAULT,
        );

        advancedTargetLanguage = applyTargetLanguageToControls(
            advancedTargetLanguage,
            advancedTargetLanguageSelect,
            advancedTargetLanguageCustomInput,
            advancedTargetLanguageCustomContainer,
            ADVANCED_TARGET_LANGUAGE_DEFAULT,
        );

        if (extraInstructionsInput) {
            extraInstructionsInput.value = extraInstructions;
        }

        updateSettingsModeUI();

        if (showTranslateButtonOnSelectionInput) {
            const current = result.showTranslateButtonOnSelection;
            showTranslateButtonOnSelectionInput.checked =
                typeof current === "boolean" ? current : true;
        }

        if (keepSelectionPopupOpenInput) {
            const current = result.keepSelectionPopupOpen;
            keepSelectionPopupOpenInput.checked =
                typeof current === "boolean"
                    ? current
                    : KEEP_SELECTION_POPUP_OPEN_DEFAULT;
        }

        if (debugModeInput) {
            debugModeInput.checked = debugModeEnabled;
        }

        if (redactSensitiveDataInput) {
            redactSensitiveDataInput.checked = redactionEnabled;
        }

        providerSettings = result.providerSettings || {};
        let shouldPersistProviderSettingsNormalization = false;

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
                    canonicalizeProviderModelName(
                        legacyProvider,
                        result.modelName ||
                            PROVIDER_DEFAULTS[legacyProvider]?.modelName ||
                            "",
                    ) || "",
            };
            console.log(
                "options.ts: Migrated legacy settings into providerSettings:",
                providerSettings,
            );
            setStorage({ providerSettings }).catch((error) => {
                console.error(
                    "options.ts: Error persisting provider settings migration:",
                    error,
                );
            });
        }

        for (const provider of PROVIDERS) {
            if (!providerSettings[provider]) {
                providerSettings[provider] = resolveProviderDefaults(provider);
            } else {
                const base = resolveProviderDefaults(provider);
                const resolvedModelName =
                    providerSettings[provider].modelName || base.modelName;
                const canonicalModelName = canonicalizeProviderModelName(
                    provider,
                    resolvedModelName,
                );
                if (canonicalModelName !== resolvedModelName) {
                    shouldPersistProviderSettingsNormalization = true;
                }

                providerSettings[provider] = {
                    apiKey: providerSettings[provider].apiKey || "",
                    apiEndpoint:
                        providerSettings[provider].apiEndpoint || base.apiEndpoint,
                    modelName: canonicalModelName,
                    translationInstructions:
                        providerSettings[provider].translationInstructions ||
                        DEFAULT_TRANSLATION_INSTRUCTIONS,
                };
            }
        }

        if (shouldPersistProviderSettingsNormalization) {
            setStorage({ providerSettings }).catch((error) => {
                console.error(
                    "options.ts: Error persisting canonicalized provider settings:",
                    error,
                );
            });
        }

        let initialProvider: Provider =
            result.apiType && PROVIDERS.includes(result.apiType as Provider)
                ? (result.apiType as Provider)
                : "openai";

        apiTypeSelect.value = initialProvider;

        if (basicProviderSelect) {
            basicProviderSelect.value = initialProvider;
        }

        applyProviderToForm(initialProvider);

        if (settingsMode === SETTINGS_MODE_BASIC) {
            applyBasicSettingsToUI(initialProvider);
        }
    } catch (error) {
        console.error("options.ts: Error loading settings:", error);
        displayStatus(
            t(
                "optionsStatusErrorLoadingSettings",
                "Error loading settings: $1",
                error instanceof Error ? error.message : String(error),
            ),
            true,
        );
    }
}

function applyProviderToForm(provider: string): void {
    const settings = providerSettings[provider] || resolveProviderDefaults(provider);
    const safeProvider: Provider =
        provider && PROVIDERS.includes(provider as Provider)
            ? (provider as Provider)
            : "openai";
    const normalizedModelName = canonicalizeProviderModelName(
        safeProvider,
        settings.modelName || "",
    );

    if (normalizedModelName && normalizedModelName !== settings.modelName) {
        providerSettings[safeProvider] = {
            ...settings,
            modelName: normalizedModelName,
        };
    }

    console.log(`options.ts: Applying settings for provider ${provider}: `, settings);

    apiKeyInput.value = settings.apiKey || "";
    apiEndpointInput.value = settings.apiEndpoint || "";
    modelNameInput.value = normalizedModelName || settings.modelName || "";

    renderModelOptions(safeProvider, modelNameInput.value);
    updateProviderUI(provider);
}

function applyBasicSettingsToUI(provider: string): void {
    const settings = providerSettings[provider] || resolveProviderDefaults(provider);

    if (basicProviderSelect) {
        basicProviderSelect.value = PROVIDERS.includes(provider as Provider) ? provider : "openai";
    }

    if (basicApiKeyInput) {
        basicApiKeyInput.value = settings.apiKey || "";
    }

    basicTargetLanguage = applyTargetLanguageToControls(
        basicTargetLanguage,
        basicTargetLanguageSelect,
        basicTargetLanguageCustomInput,
        basicTargetLanguageCustomContainer,
        BASIC_TARGET_LANGUAGE_DEFAULT,
    );
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
        const provider: Provider = PROVIDERS.includes(selectedProvider as Provider)
            ? (selectedProvider as Provider)
            : "openai";

        const apiKey = basicApiKeyInput?.value.trim() || "";
        const defaults = resolveProviderDefaults(provider);
        const targetLanguageValue = resolveTargetLanguageFromControls(
            basicTargetLanguageSelect,
            basicTargetLanguageCustomInput,
            BASIC_TARGET_LANGUAGE_DEFAULT,
        );
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
                [STORAGE_KEYS.DEBUG_MODE]: debugModeInput?.checked ?? debugModeEnabled,
                [STORAGE_KEYS.REDACTION_MODE]: redactSensitiveDataInput?.checked ? "auto" : "off",
                [STORAGE_KEYS.UI_THEME]: uiTheme,
            });
            displayStatus(t("optionsStatusSettingsSaved", "Settings saved!"), false);
        } catch (error) {
            console.error("options.ts: Error saving basic settings:", error);
            displayStatus(
                t(
                    "optionsStatusErrorSaving",
                    "Error saving: $1",
                    error instanceof Error ? error.message : String(error),
                ),
                true,
            );
        }

        return;
    }

    const currentProvider = apiTypeSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();
    const rawModelName = modelNameInput.value.trim();
    const modelName = canonicalizeProviderModelName(
        currentProvider as Provider,
        rawModelName,
    );

    if (modelName !== rawModelName) {
        modelNameInput.value = modelName;
    }

    advancedTargetLanguage = resolveTargetLanguageFromControls(
        advancedTargetLanguageSelect,
        advancedTargetLanguageCustomInput,
        ADVANCED_TARGET_LANGUAGE_DEFAULT,
    );
    extraInstructions = extraInstructionsInput?.value.trim() || "";

    console.log(
        `options.ts: Saving for provider = ${currentProvider}: apiKey =***, apiEndpoint = ${apiEndpoint}, modelName = ${modelName}, targetLang = ${advancedTargetLanguage}`,
    );

    if (apiEndpoint) {
        try {
            new URL(apiEndpoint);
        } catch (_) {
            console.warn("options.ts: Invalid API Endpoint URL format.");
            displayStatus(
                t(
                    "optionsStatusInvalidEndpointFormat",
                    "Invalid API Endpoint URL format.",
                ),
                true,
            );
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
            [STORAGE_KEYS.DEBUG_MODE]: debugModeInput?.checked ?? debugModeEnabled,
            [STORAGE_KEYS.REDACTION_MODE]: redactSensitiveDataInput?.checked ? "auto" : "off",
            [STORAGE_KEYS.UI_THEME]: uiTheme,
        });
        console.log("options.ts: Provider settings saved successfully.");
        displayStatus(t("optionsStatusSettingsSaved", "Settings saved!"), false);
    } catch (error) {
        console.error("options.ts: Error saving settings:", error);
        displayStatus(
            t(
                "optionsStatusErrorSaving",
                "Error saving: $1",
                error instanceof Error ? error.message : String(error),
            ),
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

document.addEventListener("DOMContentLoaded", async () => {
    console.log("options.ts: DOMContentLoaded event fired.");

    await initializeI18nFromStorage();
    uiLanguagePreference = getActiveUILanguagePreference();
    populateUILanguageDropdown();
    setUILanguageSelectValue(uiLanguagePreference);
    localizeOptionsPage();
    populateUILanguageDropdown();
    setUILanguageSelectValue(uiLanguagePreference);
    updateDocsLinks();
    ensureSystemThemeWatcher();
    applyTheme(uiTheme);
    updateThemeSelectionUI(uiTheme);

    populateProviderDropdown(basicProviderSelect);
    populateProviderDropdown(apiTypeSelect);
    populateBasicLanguageDropdown();
    populateAdvancedLanguageDropdown();
    loadSettings();

    if (advancedModeToggle) {
        advancedModeToggle.addEventListener("change", () => {
            settingsMode = advancedModeToggle.checked
                ? SETTINGS_MODE_ADVANCED
                : SETTINGS_MODE_BASIC;

            const activeProvider = apiTypeSelect.value;

            if (basicProviderSelect) {
                basicProviderSelect.value = PROVIDERS.includes(activeProvider as Provider)
                    ? activeProvider
                    : "openai";
            }

            applyProviderToForm(activeProvider);
            applyBasicSettingsToUI(activeProvider);
            updateSettingsModeUI();

            setStorage({
                [STORAGE_KEYS.SETTINGS_MODE]: settingsMode,
                [STORAGE_KEYS.BASIC_TARGET_LANGUAGE]: basicTargetLanguage,
                [STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION]:
                    showTranslateButtonOnSelectionInput?.checked ?? true,
                [STORAGE_KEYS.KEEP_SELECTION_POPUP_OPEN]:
                    keepSelectionPopupOpenInput?.checked ??
                    KEEP_SELECTION_POPUP_OPEN_DEFAULT,
                [STORAGE_KEYS.DEBUG_MODE]: debugModeInput?.checked ?? debugModeEnabled,
                [STORAGE_KEYS.REDACTION_MODE]: redactSensitiveDataInput?.checked ? "auto" : "off",
                [STORAGE_KEYS.UI_THEME]: uiTheme,
            }).catch((error) => {
                console.error("options.ts: Error saving settings mode:", error);
            });

            autoSaveSetting();
        });
    }

    if (basicProviderSelect) {
        basicProviderSelect.addEventListener("change", () => {
            const provider = basicProviderSelect.value;
            const safeProvider: Provider = PROVIDERS.includes(provider as Provider)
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
        basicTargetLanguageSelect.addEventListener("change", () => {
            setCustomTargetLanguageVisibility(
                basicTargetLanguageCustomContainer,
                basicTargetLanguageSelect,
            );
            basicTargetLanguage = resolveTargetLanguageFromControls(
                basicTargetLanguageSelect,
                basicTargetLanguageCustomInput,
                BASIC_TARGET_LANGUAGE_DEFAULT,
            );
            autoSaveSetting();
        });
    }

    if (basicTargetLanguageCustomInput) {
        basicTargetLanguageCustomInput.addEventListener("input", () => {
            if (
                basicTargetLanguageSelect?.value !== CUSTOM_TARGET_LANGUAGE_OPTION_VALUE
            ) {
                return;
            }

            basicTargetLanguage = resolveTargetLanguageFromControls(
                basicTargetLanguageSelect,
                basicTargetLanguageCustomInput,
                BASIC_TARGET_LANGUAGE_DEFAULT,
            );
            autoSaveSetting();
        });
    }

    if (advancedTargetLanguageSelect) {
        advancedTargetLanguageSelect.addEventListener("change", () => {
            setCustomTargetLanguageVisibility(
                advancedTargetLanguageCustomContainer,
                advancedTargetLanguageSelect,
            );
            advancedTargetLanguage = resolveTargetLanguageFromControls(
                advancedTargetLanguageSelect,
                advancedTargetLanguageCustomInput,
                ADVANCED_TARGET_LANGUAGE_DEFAULT,
            );
            autoSaveSetting();
        });
        console.log(
            "options.ts: Change listener added to advanced-target-language select.",
        );
    }

    if (advancedTargetLanguageCustomInput) {
        advancedTargetLanguageCustomInput.addEventListener("input", () => {
            if (
                advancedTargetLanguageSelect?.value !==
                CUSTOM_TARGET_LANGUAGE_OPTION_VALUE
            ) {
                return;
            }

            advancedTargetLanguage = resolveTargetLanguageFromControls(
                advancedTargetLanguageSelect,
                advancedTargetLanguageCustomInput,
                ADVANCED_TARGET_LANGUAGE_DEFAULT,
            );
            autoSaveSetting();
        });
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
            displayStatus(t("optionsStatusSettingsSaved", "Settings saved!"), false);
        });
    }

    if (keepSelectionPopupOpenInput) {
        keepSelectionPopupOpenInput.addEventListener("change", () => {
            setStorage({
                [STORAGE_KEYS.KEEP_SELECTION_POPUP_OPEN]:
                    keepSelectionPopupOpenInput.checked,
            }).catch((error) => {
                console.error(
                    "options.ts: Error saving popup persistence setting:",
                    error,
                );
            });
            displayStatus(t("optionsStatusSettingsSaved", "Settings saved!"), false);
        });
    }

    if (debugModeInput) {
        debugModeInput.addEventListener("change", () => {
            debugModeEnabled = debugModeInput.checked;
            setStorage({
                [STORAGE_KEYS.DEBUG_MODE]: debugModeEnabled,
            }).catch((error) => {
                console.error("options.ts: Error saving debug mode setting:", error);
            });
            displayStatus(t("optionsStatusSettingsSaved", "Settings saved!"), false);
        });
    }

    if (redactSensitiveDataInput) {
        redactSensitiveDataInput.addEventListener("change", () => {
            redactionEnabled = redactSensitiveDataInput.checked;
            setStorage({
                [STORAGE_KEYS.REDACTION_MODE]: redactionEnabled ? "auto" : "off",
            }).catch((error) => {
                console.error(
                    "options.ts: Error saving redaction mode setting:",
                    error,
                );
            });
            displayStatus(t("optionsStatusSettingsSaved", "Settings saved!"), false);
        });
    }

    if (uiThemeInputs.length > 0) {
        for (const input of uiThemeInputs) {
            input.addEventListener("change", () => {
                if (!input.checked) {
                    return;
                }

                uiTheme = normalizeUITheme(input.value);
                applyTheme(uiTheme);
                updateThemeSelectionUI(uiTheme);

                setStorage({
                    [STORAGE_KEYS.UI_THEME]: uiTheme,
                }).catch((error) => {
                    console.error("options.ts: Error saving theme setting:", error);
                });

                displayStatus(t("optionsStatusThemeUpdated", "Theme updated!"), false);
            });
        }
    }

    if (uiLanguageSelect) {
        uiLanguageSelect.addEventListener("change", async () => {
            const selected = normalizeUILanguagePreference(uiLanguageSelect.value);

            try {
                await setStorage({
                    [STORAGE_KEYS.UI_LANGUAGE]: selected,
                });

                await applyUILanguagePreference(selected);
                updateDocsLinks();

                displayStatus(
                    t("optionsStatusLanguageUpdated", "Language updated!"),
                    false,
                );
            } catch (error) {
                console.error("options.ts: Error saving UI language setting:", error);
                displayStatus(
                    t(
                        "optionsStatusErrorSavingLanguage",
                        "Error saving language setting: $1",
                        error instanceof Error ? error.message : String(error),
                    ),
                    true,
                );
            }
        });
    }

    if (apiKeyInput) {
        apiKeyInput.addEventListener("input", () => {
            autoSaveSetting();
            if (settingsMode === SETTINGS_MODE_ADVANCED) {
                const provider = apiTypeSelect.value as Provider;
                invalidateModelOptionsForProvider(provider);
                renderModelOptions(provider, modelNameInput.value);
                setModelListStatus(
                    t(
                        "optionsModelStatusCredentialsChanged",
                        "Credentials changed. Click Refresh Models to load live models.",
                    ),
                );
            }
        });
        apiKeyInput.addEventListener("change", () => {
            if (settingsMode !== SETTINGS_MODE_ADVANCED) {
                return;
            }
            const provider = apiTypeSelect.value as Provider;
            void refreshModelOptionsForProvider(provider, true);
        });
        console.log("options.ts: Auto-save listener added to api-key input.");
    }

    if (apiEndpointInput) {
        apiEndpointInput.addEventListener("input", () => {
            autoSaveSetting();
            if (settingsMode === SETTINGS_MODE_ADVANCED) {
                const provider = apiTypeSelect.value as Provider;
                invalidateModelOptionsForProvider(provider);
                renderModelOptions(provider, modelNameInput.value);
                setModelListStatus(
                    t(
                        "optionsModelStatusEndpointChanged",
                        "Endpoint changed. Click Refresh Models to load models from this endpoint.",
                    ),
                );
            }
        });
        apiEndpointInput.addEventListener("change", () => {
            if (settingsMode !== SETTINGS_MODE_ADVANCED) {
                return;
            }
            const provider = apiTypeSelect.value as Provider;
            void refreshModelOptionsForProvider(provider, true);
        });
        console.log("options.ts: Auto-save listener added to api-endpoint input.");
    }

    if (apiTypeSelect) {
        apiTypeSelect.addEventListener("change", (event) => {
            const selectedApiType = (event.target as HTMLSelectElement).value;
            console.log("options.ts: Provider changed to:", selectedApiType);

            if (!providerSettings[selectedApiType]) {
                providerSettings[selectedApiType] =
                    resolveProviderDefaults(selectedApiType);
            }

            applyProviderToForm(selectedApiType);

            console.log("options.ts: Saving selection change to storage.");
            setStorage({
                providerSettings,
                apiType: selectedApiType as Provider,
                [STORAGE_KEYS.SETTINGS_MODE]: settingsMode,
                [STORAGE_KEYS.BASIC_TARGET_LANGUAGE]: basicTargetLanguage,
                [STORAGE_KEYS.UI_THEME]: uiTheme,
            })
                .then(() => {
                    console.log("options.ts: Provider selection saved.");
                    displayStatus(
                        t("optionsStatusProviderSwitched", "Provider switched."),
                        false,
                    );
                })
                .catch((error) => {
                    console.error("options.ts: Error saving apiType on change:", error);
                    displayStatus(
                        t(
                            "optionsStatusErrorSavingProviderSelection",
                            "Error saving provider selection: $1",
                            error instanceof Error ? error.message : String(error),
                        ),
                        true,
                    );
                });
        });
        console.log("options.ts: Change event listener added to api-type select.");
    }

    if (modelNameInput) {
        modelNameInput.addEventListener("input", () => {
            autoSaveSetting();
            const provider = apiTypeSelect.value as Provider;
            openModelDropdown(provider);
        });
        modelNameInput.addEventListener("focus", () => {
            const provider = apiTypeSelect.value as Provider;
            openModelDropdown(provider);
        });
        modelNameInput.addEventListener("click", () => {
            const provider = apiTypeSelect.value as Provider;
            openModelDropdown(provider);
        });
        modelNameInput.addEventListener("keydown", (event) => {
            if (settingsMode !== SETTINGS_MODE_ADVANCED) {
                return;
            }

            const provider = apiTypeSelect.value as Provider;
            const buttons = getModelOptionButtons();

            if (event.key === "ArrowDown") {
                event.preventDefault();
                openModelDropdown(provider);
                setActiveModelOption(
                    activeModelOptionIndex < 0 ? 0 : activeModelOptionIndex + 1,
                );
                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                openModelDropdown(provider);
                const dropdownButtons = getModelOptionButtons();
                setActiveModelOption(
                    activeModelOptionIndex < 0
                        ? dropdownButtons.length - 1
                        : activeModelOptionIndex - 1,
                );
                return;
            }

            if (event.key === "Enter" && isModelDropdownOpen) {
                if (
                    activeModelOptionIndex >= 0 &&
                    activeModelOptionIndex < buttons.length
                ) {
                    event.preventDefault();
                    buttons[activeModelOptionIndex].click();
                    return;
                }

                if (modelNameInput.value.trim()) {
                    closeModelDropdown();
                }
                return;
            }

            if (event.key === "Escape" && isModelDropdownOpen) {
                event.preventDefault();
                closeModelDropdown();
            }
        });
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
                invalidateModelOptionsForProvider(selectedApiType as Provider);
                setModelListStatus(
                    t(
                        "optionsModelStatusEndpointResetDefault",
                        "Endpoint reset to default. Click Refresh Models to load live models.",
                    ),
                );
                autoSaveSetting();
            } else {
                console.warn(
                    `options.ts: No default endpoint found for provider: ${selectedApiType}`,
                );
                displayStatus(
                    t(
                        "optionsStatusNoDefaultEndpointForProvider",
                        "No default endpoint available for $1.",
                        selectedApiType,
                    ),
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
                renderModelOptions(selectedApiType as Provider, modelNameInput.value);
                autoSaveSetting();
            } else {
                console.warn(
                    `options.ts: No default model found for provider: ${selectedApiType}`,
                );
                displayStatus(
                    t(
                        "optionsStatusNoDefaultModelForProvider",
                        "No default model available for $1.",
                        selectedApiType,
                    ),
                    true,
                );
            }
        });
        console.log(
            "options.ts: Click event listener added to fill default model button.",
        );
    } else {
        console.error("options.ts: Could not find fill default model button element!");
    }

    if (refreshModelsButton) {
        refreshModelsButton.addEventListener("click", async () => {
            if (settingsMode !== SETTINGS_MODE_ADVANCED) {
                return;
            }

            const provider = apiTypeSelect.value as Provider;
            console.log(
                "options.ts: Refresh models button clicked for provider:",
                provider,
            );
            invalidateModelOptionsForProvider(provider);
            await refreshModelOptionsForProvider(provider, true);
        });
        console.log("options.ts: Click event listener added to refresh models button.");
    }

    document.addEventListener("mousedown", (event) => {
        const target = event.target as Node | null;
        if (!target || !modelNameCombobox || modelNameCombobox.contains(target)) {
            return;
        }

        closeModelDropdown();
    });

    document.addEventListener("focusin", (event) => {
        const target = event.target as Node | null;
        if (!target || !modelNameCombobox || modelNameCombobox.contains(target)) {
            return;
        }

        closeModelDropdown();
    });
});

console.log("options.ts: Script loaded.");
