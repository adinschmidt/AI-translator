import {
    CEREBRAS_SUPPORTED_MODELS,
    PROVIDER_DEFAULTS,
    type Provider,
} from "./constants/providers";
import { isInstructModelName } from "./constants/settings";

export const MODEL_FETCHABLE_PROVIDERS = new Set<Provider>(
    Object.keys(PROVIDER_DEFAULTS) as Provider[],
);

export const OPENAI_COMPATIBLE_MODEL_ENDPOINT_PROVIDERS = new Set<Provider>([
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

export function normalizeProviderModelList(models: string[]): string[] {
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

export function resolveProviderFallbackModels(
    provider: Provider,
    currentModel = "",
    canonicalizeModelName: (provider: Provider, modelName: string) => string,
): string[] {
    const defaults = PROVIDER_DEFAULTS[provider]?.modelName || "";
    const fallback = PROVIDER_FALLBACK_MODELS[provider] || [];
    const canonicalCurrent = canonicalizeModelName(provider, currentModel);
    return normalizeProviderModelList(
        [...fallback, defaults, canonicalCurrent].filter(Boolean),
    );
}

export function normalizeProviderBaseUrl(
    provider: Provider,
    apiEndpoint: string,
): string {
    const fallback = PROVIDER_DEFAULTS[provider]?.apiEndpoint || "";
    const endpoint = (apiEndpoint || fallback).trim();
    if (!endpoint) {
        return "";
    }

    let base = endpoint.replace(/\/+$/, "");

    if (provider === "anthropic") {
        if (base.endsWith("/messages")) {
            base = base.slice(0, -"/messages".length);
        }
        return base;
    }

    if (provider === "google") {
        const modelsIndex = base.indexOf("/models/");
        if (modelsIndex !== -1) {
            base = base.slice(0, modelsIndex);
        }
        if (base.endsWith(":generateContent")) {
            base = base.replace(/:generateContent$/, "");
        }
        return base;
    }

    if (base.endsWith("/chat/completions")) {
        base = base.slice(0, -"/chat/completions".length);
    }

    if (provider === "ollama" && !base.endsWith("/v1")) {
        base = `${base}/v1`;
    }

    return base;
}

export function resolveProviderHeaders(
    provider: Provider,
): Record<string, string> | undefined {
    if (provider !== "openrouter") {
        return undefined;
    }

    return {
        "HTTP-Referer": "https://github.com/",
        "X-Title": "AI Translator Extension",
    };
}

export function resolveProviderMaxTokens(
    provider: Provider,
    isFullPage: boolean,
): number | undefined {
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

export function shouldStripProviderReasoning(provider: Provider): boolean {
    return provider === "groq" || provider === "cerebras";
}

function isCerebrasQwenModelName(modelName: unknown): boolean {
    return typeof modelName === "string" && modelName.toLowerCase().includes("qwen");
}

export function shouldUseStreamingForSelectedText(
    provider: Provider,
    modelName: string,
): boolean {
    if (
        provider === "cerebras" &&
        isCerebrasQwenModelName(modelName) &&
        isInstructModelName(modelName)
    ) {
        return false;
    }

    return true;
}

export function shouldRetrySelectedTextWithoutStreaming(
    error: unknown,
    provider: Provider,
    modelName: string,
): boolean {
    const message = String((error as any)?.message || error || "").toLowerCase();
    if (message.includes("no translation text")) {
        return true;
    }

    if (
        provider === "cerebras" &&
        isCerebrasQwenModelName(modelName) &&
        isInstructModelName(modelName)
    ) {
        return true;
    }

    return false;
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

function resolveModelCapabilityHints(item: any): string[] {
    return [
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
        return normalizeProviderModelList(
            dataItems
                .filter((item) => isTextCapableModel(item))
                .map((item) => resolveModelIdentifier(item))
                .filter((model): model is string => typeof model === "string"),
        );
    }

    const modelItems: any[] = Array.isArray(data?.models) ? data.models : [];

    return normalizeProviderModelList(
        modelItems
            .filter((item) => isTextCapableModel(item))
            .map((item) => resolveModelIdentifier(item))
            .filter((model): model is string => typeof model === "string"),
    );
}

function parseAnthropicModels(data: any): string[] {
    const fromData: any[] = Array.isArray(data?.data) ? data.data : [];
    return normalizeProviderModelList(
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
    return normalizeProviderModelList(normalized);
}

export function parseProviderModels(provider: Provider, data: any): string[] {
    if (provider === "anthropic") {
        return parseAnthropicModels(data);
    }

    if (provider === "google") {
        return parseGoogleModels(data);
    }

    return parseOpenAICompatibleModels(data);
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

export function buildProviderModelsUrl(
    endpoint: string,
    provider: Provider,
): string {
    if (provider === "anthropic") {
        return buildModelsUrl(endpoint, provider, buildModelsPathFromAnthropicEndpoint);
    }

    if (provider === "google") {
        return buildModelsUrl(endpoint, provider, buildModelsPathFromGoogleEndpoint);
    }

    if (OPENAI_COMPATIBLE_MODEL_ENDPOINT_PROVIDERS.has(provider)) {
        return buildModelsUrl(
            endpoint,
            provider,
            buildModelsPathFromOpenAICompatibleEndpoint,
        );
    }

    return "";
}

export function providerRequiresModelApiKey(provider: Provider): boolean {
    return provider !== "openrouter" && provider !== "ollama";
}
