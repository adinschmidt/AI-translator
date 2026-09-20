import { describe, expect, test } from "bun:test";
import { generateText, streamText } from "ai";
import type { OpenAIProviderSettings } from "@ai-sdk/openai";
import { resolveProviderModel } from "./provider-model";
import { PROVIDER_DEFAULTS, type Provider, type ReasoningLevel } from "../shared/constants/providers";
import { resolveEffectiveProviderSettings } from "../shared/translation-profile";

type ProviderFetch = NonNullable<OpenAIProviderSettings["fetch"]>;

async function captureRequest(provider: Provider, modelName: string, reasoning?: ReasoningLevel, streaming = false) {
    let request: Record<string, unknown> = {};
    const fetchMock = Object.assign(async (_url: Parameters<ProviderFetch>[0], init?: Parameters<ProviderFetch>[1]) => {
        request = JSON.parse(String(init?.body));
        if (streaming) {
            const chunk = (delta: object, finish_reason: string | null) => JSON.stringify({
                id: "test", object: "chat.completion.chunk", created: 1, model: modelName,
                choices: [{ index: 0, delta, finish_reason }],
            });
            return new Response(`data: ${chunk({ content: "Bonjour" }, null)}\n\ndata: ${chunk({}, "stop")}\n\ndata: [DONE]\n\n`, {
                headers: { "Content-Type": "text/event-stream" },
            });
        }
        return Response.json({
            id: "test", object: "chat.completion", created: 1, model: modelName,
            choices: [{ index: 0, message: { role: "assistant", content: "Bonjour" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
        });
    }, { preconnect: globalThis.fetch.preconnect }) satisfies ProviderFetch;
    const model = resolveProviderModel(provider, "test-key", PROVIDER_DEFAULTS[provider].apiEndpoint, modelName, fetchMock);
    const options = { model, prompt: "Translate hello to French", reasoning, maxRetries: 0 };
    const result = streaming ? streamText(options) : await generateText(options);
    expect(await result.text).toBe("Bonjour");
    return request;
}

describe("translation provider requests", () => {
    test("recommended models send economical reasoning settings without output caps", async () => {
        for (const provider of ["openai", "groq", "grok", "cerebras", "ollama"] as const) {
            const request = await captureRequest(provider, PROVIDER_DEFAULTS[provider].modelName);
            expect(request.reasoning_effort).toBe(provider === "openai" || provider === "ollama" ? "none" : "low");
            expect(request.max_tokens).toBeUndefined();
            expect(request.max_completion_tokens).toBeUndefined();
        }
    });

    test("DeepSeek and Qwen serialize thinking toggles for both response modes", async () => {
        for (const streaming of [false, true]) {
            const deepseek = await captureRequest("deepseek", "deepseek-flash", undefined, streaming);
            expect(deepseek.thinking).toEqual({ type: "disabled" });
            expect(deepseek.reasoning_effort).toBeUndefined();
            const qwen = await captureRequest("qwen", "qwen3.8-flash", undefined, streaming);
            expect(qwen.enable_thinking).toBe(false);
            expect(qwen.reasoning_effort).toBeUndefined();
        }
        const deepseek = await captureRequest("deepseek", "deepseek-flash", "high");
        expect(deepseek.thinking).toEqual({ type: "enabled" });
        expect(deepseek.reasoning_effort).toBe("high");
        const qwen = await captureRequest("qwen", "qwen3.8-flash", "high");
        expect(qwen.enable_thinking).toBe(true);
        expect(qwen.reasoning_effort).toBeUndefined();
    });

    test("explicit overrides win and custom models keep provider defaults", async () => {
        const override = await captureRequest("grok", "grok-4.6", "high");
        expect(override.reasoning_effort).toBe("high");
        const custom = await captureRequest("openai", "custom-model");
        expect(custom.reasoning_effort).toBeUndefined();
    });

    test("OpenRouter caps automatic routing without restricting an explicit model", async () => {
        const auto = await captureRequest("openrouter", "openrouter/auto");
        expect(auto.provider).toEqual({ max_price: { prompt: 1, completion: 5 } });
        const selected = await captureRequest("openrouter", "anthropic/claude-sonnet-5");
        expect(selected.provider).toBeUndefined();
    });

    test("Basic requests use current defaults even with a saved older model", () => {
        const saved = { apiType: "openai" as const, basicTargetLanguage: "fr", providerSettings: {
            openai: { apiKey: "key", apiEndpoint: "https://example.com/v1", modelName: "gpt-5-mini" },
        } };
        const basic = resolveEffectiveProviderSettings(saved, "basic");
        expect(basic.modelName).toBe("gpt-5.6-luna");
        expect(basic.apiEndpoint).toBe(PROVIDER_DEFAULTS.openai.apiEndpoint);
        expect(basic.translationInstructions).toContain("French");
        expect(resolveEffectiveProviderSettings(saved, "advanced").modelName).toBe("gpt-5-mini");
    });
});
