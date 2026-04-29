import {
    PROVIDERS,
    PROVIDER_DEFAULTS,
    canonicalizeProviderModelName,
    resolveProviderDefaults,
    type Provider,
    type ProviderSettings,
} from "./constants/providers";
import {
    BASIC_TARGET_LANGUAGE_DEFAULT,
    ADVANCED_TARGET_LANGUAGE_DEFAULT,
    DEFAULT_TRANSLATION_INSTRUCTIONS,
    DEBUG_MODE_DEFAULT,
    REDACTION_MODE_DEFAULT,
    SETTINGS_MODE_BASIC,
    type RedactionMode,
    type SettingsMode,
} from "./constants/settings";
import {
    buildBasicTranslationInstructions,
    buildTranslationInstructionsWithDetection,
    getBasicTargetLanguageLabel,
} from "./constants/languages";
import type {
    EffectiveProviderSettings,
    ProviderSettingsMap,
    StorageGetResult,
} from "./storage";

export interface ProviderSettingsNormalizationResult {
    providerSettings: ProviderSettingsMap;
    migratedLegacyProviderSettings: boolean;
    normalizedProviderSettings: boolean;
}

export interface TranslationProfileOptions {
    targetLanguage?: string | null;
    detectedLanguage?: string | null;
    detectedLanguageName?: string | null;
    locale?: string;
    useDetectedLanguageInstructions?: boolean;
}

export interface TranslationProfile {
    mode: SettingsMode;
    targetLanguage: string;
    targetLanguageLabel: string;
    provider: EffectiveProviderSettings;
    debugMode: boolean;
    redactionMode: RedactionMode;
}

function isProvider(value: unknown): value is Provider {
    return typeof value === "string" && PROVIDERS.includes(value as Provider);
}

export function resolveActiveProvider(storage: StorageGetResult): Provider {
    return isProvider(storage.apiType) ? storage.apiType : "openai";
}

export function resolveSettingsMode(storage: StorageGetResult): SettingsMode {
    return storage.settingsMode || SETTINGS_MODE_BASIC;
}

export function resolveTargetLanguage(
    storage: StorageGetResult,
    mode: SettingsMode = resolveSettingsMode(storage),
    override?: string | null,
): string {
    if (override?.trim()) {
        return override.trim();
    }

    return mode === SETTINGS_MODE_BASIC
        ? storage.basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT
        : storage.advancedTargetLanguage || ADVANCED_TARGET_LANGUAGE_DEFAULT;
}

export function resolveEffectiveProviderSettings(
    storage: StorageGetResult,
    mode: SettingsMode,
    targetLanguage?: string,
): EffectiveProviderSettings {
    const activeProvider = resolveActiveProvider(storage);
    const providerSettings = storage.providerSettings || {};
    const perProvider = providerSettings[activeProvider];

    const effective: EffectiveProviderSettings = perProvider
        ? {
              apiKey: perProvider.apiKey || "",
              apiEndpoint:
                  perProvider.apiEndpoint ||
                  PROVIDER_DEFAULTS[activeProvider].apiEndpoint,
              modelName: canonicalizeProviderModelName(
                  activeProvider,
                  perProvider.modelName || PROVIDER_DEFAULTS[activeProvider].modelName,
              ),
              translationInstructions:
                  perProvider.translationInstructions ||
                  DEFAULT_TRANSLATION_INSTRUCTIONS,
              apiType: activeProvider,
          }
        : {
              apiKey: storage.apiKey || "",
              apiEndpoint:
                  storage.apiEndpoint || PROVIDER_DEFAULTS[activeProvider].apiEndpoint,
              modelName: canonicalizeProviderModelName(
                  activeProvider,
                  storage.modelName || PROVIDER_DEFAULTS[activeProvider].modelName,
              ),
              translationInstructions: DEFAULT_TRANSLATION_INSTRUCTIONS,
              apiType: activeProvider,
          };

    if (mode === SETTINGS_MODE_BASIC && targetLanguage) {
        const languageValue = targetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT;
        const languageLabel = getBasicTargetLanguageLabel(languageValue);
        effective.apiEndpoint =
            PROVIDER_DEFAULTS[activeProvider].apiEndpoint || effective.apiEndpoint;
        effective.modelName = PROVIDER_DEFAULTS[activeProvider].modelName;
        effective.translationInstructions =
            buildBasicTranslationInstructions(languageLabel);
    }

    return effective;
}

export function resolveTranslationProfile(
    storage: StorageGetResult,
    options: TranslationProfileOptions = {},
): TranslationProfile {
    const mode = resolveSettingsMode(storage);
    const targetLanguage = resolveTargetLanguage(storage, mode, options.targetLanguage);
    const targetLanguageLabel = getBasicTargetLanguageLabel(
        targetLanguage,
        options.locale || "en",
    );
    const provider = resolveEffectiveProviderSettings(
        storage,
        mode,
        options.targetLanguage || undefined,
    );

    if (options.useDetectedLanguageInstructions) {
        const extraInstructions =
            mode === SETTINGS_MODE_BASIC ? "" : storage.extraInstructions || "";
        provider.translationInstructions = buildTranslationInstructionsWithDetection(
            options.detectedLanguage || null,
            options.detectedLanguageName || null,
            targetLanguageLabel,
            extraInstructions,
        );

        if (mode === SETTINGS_MODE_BASIC) {
            provider.apiEndpoint =
                PROVIDER_DEFAULTS[provider.apiType].apiEndpoint ||
                provider.apiEndpoint;
            provider.modelName = PROVIDER_DEFAULTS[provider.apiType].modelName;
        }
    }

    return {
        mode,
        targetLanguage,
        targetLanguageLabel,
        provider,
        debugMode: storage.debugMode ?? DEBUG_MODE_DEFAULT,
        redactionMode: storage.redactionMode || REDACTION_MODE_DEFAULT,
    };
}

function hasLegacyProviderSettings(storage: StorageGetResult): boolean {
    return Boolean(storage.apiKey || storage.apiEndpoint || storage.modelName);
}

function resolveLegacyProviderSettings(storage: StorageGetResult): {
    provider: Provider;
    settings: ProviderSettings;
} {
    const provider = resolveActiveProvider(storage);
    return {
        provider,
        settings: {
            apiKey: storage.apiKey || "",
            apiEndpoint: storage.apiEndpoint || PROVIDER_DEFAULTS[provider].apiEndpoint,
            modelName:
                canonicalizeProviderModelName(
                    provider,
                    storage.modelName || PROVIDER_DEFAULTS[provider].modelName,
                ) || "",
        },
    };
}

export function normalizeProviderSettingsMap(
    storage: StorageGetResult,
): ProviderSettingsNormalizationResult {
    const providerSettings: ProviderSettingsMap = {
        ...(storage.providerSettings || {}),
    };
    let migratedLegacyProviderSettings = false;
    let normalizedProviderSettings = false;

    if (!storage.providerSettings && hasLegacyProviderSettings(storage)) {
        const legacy = resolveLegacyProviderSettings(storage);
        providerSettings[legacy.provider] = legacy.settings;
        migratedLegacyProviderSettings = true;
    }

    for (const provider of PROVIDERS) {
        if (!providerSettings[provider]) {
            providerSettings[provider] = resolveProviderDefaults(provider);
            continue;
        }

        const base = resolveProviderDefaults(provider);
        const resolvedModelName = providerSettings[provider].modelName || base.modelName;
        const canonicalModelName = canonicalizeProviderModelName(
            provider,
            resolvedModelName,
        );
        if (canonicalModelName !== resolvedModelName) {
            normalizedProviderSettings = true;
        }

        providerSettings[provider] = {
            apiKey: providerSettings[provider].apiKey || "",
            apiEndpoint: providerSettings[provider].apiEndpoint || base.apiEndpoint,
            modelName: canonicalModelName,
            translationInstructions:
                providerSettings[provider].translationInstructions ||
                DEFAULT_TRANSLATION_INSTRUCTIONS,
        };
    }

    return {
        providerSettings,
        migratedLegacyProviderSettings,
        normalizedProviderSettings,
    };
}
