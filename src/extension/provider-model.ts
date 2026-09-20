import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI, type OpenAIProviderSettings } from "@ai-sdk/openai";
import { PROVIDER_DEFAULTS, type Provider } from "../shared/constants/providers";
import {
    normalizeProviderBaseUrl,
    resolveProviderHeaders,
} from "../shared/provider-behavior";

type ProviderFetch = NonNullable<OpenAIProviderSettings["fetch"]>;

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function prepareRequest(
    provider: Provider,
    modelName: string,
    body: Record<string, unknown>,
) {
    const recommendedModel = modelName === PROVIDER_DEFAULTS[provider].modelName;
    const request = { ...body };

    // Defaults apply to the recommended models; explicit Advanced overrides win.
    if (request.reasoning_effort == null && recommendedModel) {
        switch (provider) {
            case "openai":
            case "deepseek":
            case "qwen":
            case "ollama":
                request.reasoning_effort = "none";
                break;
            case "groq":
            case "cerebras":
            case "grok":
                request.reasoning_effort = "low";
                break;
        }
    }

    if (provider === "deepseek" && modelName === "deepseek-flash") {
        const effort = request.reasoning_effort;
        if (typeof effort === "string") {
            request.thinking = { type: effort === "none" ? "disabled" : "enabled" };
            if (effort === "none") delete request.reasoning_effort;
        }
    }

    if (provider === "qwen" && /^qwen3\.[78]-flash(?:-|$)/.test(modelName)) {
        const effort = request.reasoning_effort;
        if (typeof effort === "string") {
            request.enable_thinking = effort !== "none";
            // These Chat Completions models expose a thinking toggle, not OpenAI effort levels.
            delete request.reasoning_effort;
        }
    }

    if (provider === "openrouter" && modelName === "openrouter/auto") {
        // USD per million tokens. Explicit model selections are not restricted.
        request.provider = { max_price: { prompt: 1, completion: 5 } };
    }

    return request;
}

export function resolveProviderModel(
    provider: Provider,
    apiKey: string,
    apiEndpoint: string,
    modelName: string,
    fetchImplementation: ProviderFetch = globalThis.fetch,
) {
    const baseURL = normalizeProviderBaseUrl(provider, apiEndpoint) || undefined;
    if (provider === "anthropic") {
        return createAnthropic({ apiKey, baseURL, fetch: fetchImplementation })(modelName);
    }
    if (provider === "google") {
        return createGoogleGenerativeAI({
            apiKey,
            baseURL,
            fetch: fetchImplementation,
        })(modelName);
    }

    const openai = createOpenAI({
        apiKey: apiKey || "ollama",
        baseURL,
        headers: resolveProviderHeaders(provider),
        // The OpenAI adapter does not serialize other vendors' thinking/routing fields.
        fetch: Object.assign(
            (url: Parameters<ProviderFetch>[0], init?: Parameters<ProviderFetch>[1]) => {
                if (typeof init?.body !== "string") {
                    return fetchImplementation(url, init);
                }
                const body: unknown = JSON.parse(init.body);
                if (!isObject(body)) return fetchImplementation(url, init);
                return fetchImplementation(url, {
                    ...init,
                    body: JSON.stringify(prepareRequest(provider, modelName, body)),
                });
            },
            { preconnect: fetchImplementation.preconnect },
        ),
    });
    return openai.chat(modelName);
}
