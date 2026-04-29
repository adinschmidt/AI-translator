import type { EffectiveProviderSettings } from "../shared/storage";
import type { Provider } from "../shared/constants/providers";
import { PROVIDER_DEFAULTS } from "../shared/constants/providers";
import {
    shouldRetrySelectedTextWithoutStreaming,
    shouldUseStreamingForSelectedText,
} from "../shared/provider-behavior";

export interface SelectedTextTranslationRequest {
    tabId: number;
    requestId: string;
    textToTranslate: string;
    settings: EffectiveProviderSettings;
    mode: string;
    debugModeEnabled: boolean;
    detectedLanguage: string | null;
    detectedLanguageName: string | null;
    targetLanguageName: string | null;
    restoreTranslatedOutput: (translatedText: string) => string;
    debugContexts: {
        nonStreaming: string;
        streaming: string;
    };
}

export interface SelectedTextTranslationErrorMeta {
    tabId: number;
    provider: Provider;
    model: string;
    isStreaming: boolean;
    mode: string;
}

export interface SelectedTextTranslationAdapters {
    notifyLoading: (request: SelectedTextTranslationRequest) => void;
    notifySuccess: (
        request: SelectedTextTranslationRequest,
        translatedText: string,
    ) => void;
    notifyError: (
        request: SelectedTextTranslationRequest,
        error: unknown,
        context: string,
        meta: SelectedTextTranslationErrorMeta,
    ) => void;
    stream: (request: SelectedTextTranslationRequest) => Promise<string | null>;
    translate: (request: SelectedTextTranslationRequest) => Promise<string>;
}

export function resolveSelectedModelName(settings: EffectiveProviderSettings): string {
    return (
        settings.modelName ||
        PROVIDER_DEFAULTS[settings.apiType]?.modelName ||
        PROVIDER_DEFAULTS.openai.modelName
    );
}

export function hasUsableProviderSettings(settings: EffectiveProviderSettings): boolean {
    return Boolean(
        settings.apiEndpoint && (settings.apiKey || settings.apiType === "ollama"),
    );
}

export async function runSelectedTextTranslationRequest(
    request: SelectedTextTranslationRequest,
    adapters: SelectedTextTranslationAdapters,
): Promise<void> {
    const provider = request.settings.apiType;
    const selectedModelName = resolveSelectedModelName(request.settings);

    adapters.notifyLoading(request);

    if (!shouldUseStreamingForSelectedText(provider, selectedModelName)) {
        try {
            const translation = await adapters.translate(request);
            adapters.notifySuccess(request, request.restoreTranslatedOutput(translation));
        } catch (error) {
            adapters.notifyError(request, error, request.debugContexts.nonStreaming, {
                tabId: request.tabId,
                provider,
                model: selectedModelName,
                isStreaming: false,
                mode: request.mode,
            });
        }
        return;
    }

    try {
        const translation = await adapters.stream(request);
        if (translation === null) {
            return;
        }
        adapters.notifySuccess(request, translation);
    } catch (error) {
        let finalError = error;
        if (shouldRetrySelectedTextWithoutStreaming(error, provider, selectedModelName)) {
            console.warn(
                "Streaming selected translation failed; retrying without streaming.",
            );
            try {
                const fallbackTranslation = await adapters.translate(request);
                adapters.notifySuccess(
                    request,
                    request.restoreTranslatedOutput(fallbackTranslation),
                );
                return;
            } catch (fallbackError) {
                console.error("Selected-text fallback translation error:", fallbackError);
                finalError = fallbackError;
            }
        }

        adapters.notifyError(request, finalError, request.debugContexts.streaming, {
            tabId: request.tabId,
            provider,
            model: selectedModelName,
            isStreaming: true,
            mode: request.mode,
        });
    }
}
