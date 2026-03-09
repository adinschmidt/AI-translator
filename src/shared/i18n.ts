export const UI_LANGUAGE_STORAGE_KEY = "uiLanguage";
export const UI_LANGUAGE_DEFAULT = "default";

export const UI_LANGUAGE_OPTIONS = [
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

export type SupportedUILanguage = (typeof UI_LANGUAGE_OPTIONS)[number]["value"];
export type UILanguagePreference = typeof UI_LANGUAGE_DEFAULT | SupportedUILanguage;

const SUPPORTED_UI_LANGUAGE_SET = new Set<SupportedUILanguage>(
    UI_LANGUAGE_OPTIONS.map((item) => item.value),
);

type MessageCatalog = Record<string, string>;

const catalogCache = new Map<SupportedUILanguage, MessageCatalog>();
let defaultCatalog: MessageCatalog | null = null;
let activeCatalog: MessageCatalog | null = null;

let activeLocale: SupportedUILanguage = "en";
let activePreference: UILanguagePreference = UI_LANGUAGE_DEFAULT;
let activeLoadPromise: Promise<void> | null = null;
let initSettledPromise: Promise<void> = Promise.resolve();

function applySubstitutions(message: string, substitutions?: string | string[]): string {
    if (substitutions === undefined) {
        return message;
    }

    const items = Array.isArray(substitutions) ? substitutions : [substitutions];
    let resolved = message;
    for (let i = 0; i < items.length; i++) {
        const token = new RegExp(`\\$${i + 1}`, "g");
        resolved = resolved.replace(token, String(items[i] ?? ""));
    }

    return resolved;
}

function isSupportedUILanguage(value: string): value is SupportedUILanguage {
    return SUPPORTED_UI_LANGUAGE_SET.has(value as SupportedUILanguage);
}

export function normalizeUILanguagePreference(value: unknown): UILanguagePreference {
    if (typeof value !== "string") {
        return UI_LANGUAGE_DEFAULT;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === UI_LANGUAGE_DEFAULT) {
        return UI_LANGUAGE_DEFAULT;
    }

    if (isSupportedUILanguage(normalized)) {
        return normalized;
    }

    return UI_LANGUAGE_DEFAULT;
}

export function resolveSupportedUILanguage(languageLike: string): SupportedUILanguage {
    const normalized = (languageLike || "").trim().toLowerCase().replace("_", "-");
    if (isSupportedUILanguage(normalized)) {
        return normalized;
    }

    const base = normalized.split("-")[0];
    if (isSupportedUILanguage(base)) {
        return base;
    }

    return "en";
}

export function getBrowserUILanguage(): SupportedUILanguage {
    const uiLanguage = chrome.i18n?.getUILanguage?.() || "en";
    return resolveSupportedUILanguage(uiLanguage);
}

export function resolveLocaleFromPreference(
    preference: UILanguagePreference,
): SupportedUILanguage {
    if (preference === UI_LANGUAGE_DEFAULT) {
        return getBrowserUILanguage();
    }

    return isSupportedUILanguage(preference) ? preference : "en";
}

export function getActiveUILanguagePreference(): UILanguagePreference {
    return activePreference;
}

export function getActiveUILocale(): SupportedUILanguage {
    return activeLocale;
}

/**
 * Returns a promise that resolves once the most recent i18n initialization has
 * settled.  Callers that need an up-to-date locale should `await` this before
 * reading `getActiveUILocale()` to avoid the race where the fire-and-forget
 * `initializeI18nFromStorage()` at module load has not yet completed.
 */
export function ensureI18nReady(): Promise<void> {
    return initSettledPromise;
}

async function loadCatalog(locale: SupportedUILanguage): Promise<MessageCatalog> {
    const cached = catalogCache.get(locale);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(
            chrome.runtime.getURL(`_locales/${locale}/messages.json`),
        );
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const raw = (await response.json()) as Record<string, { message?: string }>;
        const catalog: MessageCatalog = {};
        for (const [key, value] of Object.entries(raw)) {
            if (typeof value?.message === "string") {
                catalog[key] = value.message;
            }
        }

        catalogCache.set(locale, catalog);
        return catalog;
    } catch (error) {
        console.warn(`Failed loading locale catalog "${locale}"`, error);
        const empty: MessageCatalog = {};
        catalogCache.set(locale, empty);
        return empty;
    }
}

async function ensureDefaultCatalog(): Promise<void> {
    if (defaultCatalog) {
        return;
    }

    defaultCatalog = await loadCatalog("en");
}

async function readStoredPreference(): Promise<UILanguagePreference> {
    return new Promise((resolve) => {
        if (!chrome.storage?.sync) {
            resolve(UI_LANGUAGE_DEFAULT);
            return;
        }

        chrome.storage.sync.get([UI_LANGUAGE_STORAGE_KEY], (result) => {
            if (chrome.runtime.lastError) {
                resolve(UI_LANGUAGE_DEFAULT);
                return;
            }

            resolve(normalizeUILanguagePreference(result?.[UI_LANGUAGE_STORAGE_KEY]));
        });
    });
}

export async function initializeI18n(
    preference?: UILanguagePreference,
): Promise<UILanguagePreference> {
    // Wrap the entire flow — including the storage read — in a single promise
    // and assign it *before* any awaits so that `ensureI18nReady()` callers
    // block on the full initialization, not just the catalog-load tail.
    const fullInit = (async () => {
        const nextPreference =
            preference === undefined
                ? await readStoredPreference()
                : normalizeUILanguagePreference(preference);
        const nextLocale = resolveLocaleFromPreference(nextPreference);

        await ensureDefaultCatalog();
        activeCatalog =
            nextLocale === "en" ? defaultCatalog : await loadCatalog(nextLocale);
        activePreference = nextPreference;
        activeLocale = nextLocale;
    })();

    activeLoadPromise = fullInit;
    initSettledPromise = fullInit;

    await fullInit;
    activeLoadPromise = null;
    return activePreference;
}

export async function initializeI18nFromStorage(): Promise<UILanguagePreference> {
    return initializeI18n(undefined);
}

export function getI18nMessage(key: string, substitutions?: string | string[]): string {
    const fromCatalog = activeCatalog?.[key] || defaultCatalog?.[key] || "";
    if (fromCatalog) {
        return applySubstitutions(fromCatalog, substitutions);
    }

    if (chrome.i18n?.getMessage) {
        const fallback =
            substitutions === undefined
                ? chrome.i18n.getMessage(key)
                : chrome.i18n.getMessage(key, substitutions);
        if (fallback) {
            return fallback;
        }
    }

    return "";
}

export function getI18nMessageOrFallback(
    key: string,
    fallback: string,
    substitutions?: string | string[],
): string {
    return getI18nMessage(key, substitutions) || fallback;
}
