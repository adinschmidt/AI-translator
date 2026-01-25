export const PROVIDERS = [
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
] as const;

export type Provider = (typeof PROVIDERS)[number];

export const BASIC_PROVIDERS = ["openai", "anthropic", "google"] as const;

export type BasicProvider = (typeof BASIC_PROVIDERS)[number];

export const PROVIDER_DEFAULTS = {
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
        modelName: "gemini-flash-lite-latest",
    },
    groq: {
        apiEndpoint: "https://api.groq.com/openai/v1/chat/completions",
        modelName: "kimi-k2-instruct",
    },
    grok: {
        apiEndpoint: "https://api.x.ai/v1/chat/completions",
        modelName: "grok-4-1-fast-non-reasoning",
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
} as const;

export type ProviderSettings = {
    apiKey: string;
    apiEndpoint: string;
    modelName: string;
    translationInstructions?: string;
    apiType?: string;
};

export function resolveProviderDefaults(provider: string): ProviderSettings {
    const defaults = PROVIDER_DEFAULTS[provider as Provider] || {};
    return {
        apiKey: "",
        apiEndpoint: defaults.apiEndpoint || "",
        modelName: defaults.modelName || "",
        apiType: provider,
    };
}
