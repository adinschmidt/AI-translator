import type { Provider, ProviderSettings } from "./constants/providers";
import type { SettingsMode } from "./constants/settings";
import { PROVIDERS, PROVIDER_DEFAULTS } from "./constants/providers";
import {
    DEFAULT_TRANSLATION_INSTRUCTIONS,
    BASIC_TARGET_LANGUAGE_DEFAULT,
} from "./constants/settings";
import {
    getBasicTargetLanguageLabel,
    buildBasicTranslationInstructions,
} from "./constants/languages";

export type { Provider, ProviderSettings, SettingsMode };

export const STORAGE_KEYS = {
    SETTINGS_MODE: "settingsMode",
    BASIC_TARGET_LANGUAGE: "basicTargetLanguage",
    ADVANCED_TARGET_LANGUAGE: "advancedTargetLanguage",
    EXTRA_INSTRUCTIONS: "extraInstructions",
    SHOW_TRANSLATE_BUTTON_ON_SELECTION: "showTranslateButtonOnSelection",
    API_KEY: "apiKey",
    API_ENDPOINT: "apiEndpoint",
    API_TYPE: "apiType",
    MODEL_NAME: "modelName",
    PROVIDER_SETTINGS: "providerSettings",
    TRANSLATION_INSTRUCTIONS: "translationInstructions",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export interface ProviderSettingsMap {
    [provider: string]: ProviderSettings;
}

export interface SyncStorage {
    settingsMode: SettingsMode;
    basicTargetLanguage: string;
    advancedTargetLanguage: string;
    extraInstructions: string;
    showTranslateButtonOnSelection: boolean;
    apiKey: string;
    apiEndpoint: string;
    apiType: Provider;
    modelName: string;
    providerSettings: ProviderSettingsMap;
    translationInstructions?: string;
}

export interface SyncStorageGetKeys {
    [key: string]: any;
}

export interface StorageGetResult {
    settingsMode?: SettingsMode;
    basicTargetLanguage?: string;
    advancedTargetLanguage?: string;
    extraInstructions?: string;
    showTranslateButtonOnSelection?: boolean;
    apiKey?: string;
    apiEndpoint?: string;
    apiType?: Provider;
    modelName?: string;
    providerSettings?: ProviderSettingsMap;
    translationInstructions?: string;
}

export function getStorage<K extends keyof StorageGetResult>(
    keys: K[],
): Promise<Pick<StorageGetResult, K>> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(keys, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(result as Pick<StorageGetResult, K>);
        });
    });
}

export function getStorageAll(): Promise<StorageGetResult> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(result as StorageGetResult);
        });
    });
}

export function setStorage(data: Partial<SyncStorage>): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set(data, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

export function removeStorage(keys: StorageKey[]): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.remove(keys, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

export function clearStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.clear(() => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

export function onStorageChanged(
    callback: (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string,
    ) => void,
): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync") {
            callback(changes, areaName);
        }
    });
}

export interface EffectiveProviderSettings {
    apiKey: string;
    apiEndpoint: string;
    modelName: string;
    translationInstructions: string;
    apiType: Provider;
}

export function getEffectiveProviderSettings(
    storage: StorageGetResult,
    mode: SettingsMode,
    targetLanguage?: string,
): EffectiveProviderSettings {
    let activeProvider: Provider =
        storage.apiType &&
        (storage.providerSettings?.[storage.apiType as Provider] ||
            PROVIDERS.includes(storage.apiType))
            ? (storage.apiType as Provider)
            : "openai";

    const providerSettings = storage.providerSettings || {};

    const perProvider = providerSettings[activeProvider];

    if (perProvider) {
        const effective: EffectiveProviderSettings = {
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
                perProvider.translationInstructions || DEFAULT_TRANSLATION_INSTRUCTIONS,
            apiType: activeProvider,
        };

        if (mode === "basic" && targetLanguage) {
            const languageValue = targetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT;
            const languageLabel = getBasicTargetLanguageLabel(languageValue);
            effective.apiEndpoint =
                PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint || effective.apiEndpoint;
            effective.modelName = PROVIDER_DEFAULTS[activeProvider]?.modelName;
            effective.translationInstructions =
                buildBasicTranslationInstructions(languageLabel);
        }

        return effective;
    }

    const effective: EffectiveProviderSettings = {
        apiKey: storage.apiKey || "",
        apiEndpoint:
            storage.apiEndpoint || PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint || "",
        modelName:
            storage.modelName || PROVIDER_DEFAULTS[activeProvider]?.modelName || "",
        translationInstructions: DEFAULT_TRANSLATION_INSTRUCTIONS,
        apiType: activeProvider,
    };

    if (mode === "basic" && targetLanguage) {
        const languageValue = targetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT;
        const languageLabel = getBasicTargetLanguageLabel(languageValue);
        effective.apiEndpoint =
            PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint || effective.apiEndpoint;
        effective.modelName = PROVIDER_DEFAULTS[activeProvider]?.modelName;
        effective.translationInstructions =
            buildBasicTranslationInstructions(languageLabel);
    }

    return effective;
}
