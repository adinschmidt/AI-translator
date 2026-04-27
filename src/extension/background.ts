import { generateText, streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

import {
    STORAGE_KEYS,
    getStorage,
    getEffectiveProviderSettings,
    type StorageGetResult,
    type EffectiveProviderSettings,
} from "../shared/storage";
import {
    type MessageListener,
    type PortMessageListener,
    type PortOnMessageEvent,
    type SendResponse,
    type ContentToBackgroundMessage,
    type BackgroundToContentMessage,
    type DisplayTranslationMessage,
    type StartHTMLTranslationPortMessage,
    type HtmlTranslationResultPortMessage,
    HTML_TRANSLATION_PORT_NAME,
    STREAM_PORT_NAME,
} from "../shared/messaging";
import {
    SETTINGS_MODE_BASIC,
    SETTINGS_MODE_ADVANCED,
    BASIC_TARGET_LANGUAGE_DEFAULT,
    ADVANCED_TARGET_LANGUAGE_DEFAULT,
    DEBUG_MODE_DEFAULT,
    UI_THEME_DEFAULT,
    DEFAULT_TRANSLATION_INSTRUCTIONS,
    DEFAULT_SYSTEM_PROMPT,
    INSTRUCT_SYSTEM_PROMPT,
    HTML_PRESERVING_SYSTEM_PROMPT,
    HTML_PRESERVING_STRICT_PROMPT,
    CHARS_PER_TOKEN_ESTIMATE,
    MAX_BATCH_INPUT_TOKENS,
    MAX_BATCH_UNITS,
    MAX_BATCH_INPUT_CHARS,
    MAX_BATCH_OUTPUT_TOKENS,
    HTML_UNIT_SEPARATOR,
    MAX_UNIT_TOKENS,
    STREAM_UPDATE_THROTTLE_MS,
    STREAM_KEEP_ALIVE_INTERVAL_MS,
    RATE_LIMIT_MAX_RETRIES,
    RATE_LIMIT_BASE_DELAY_MS,
    RATE_LIMIT_MAX_DELAY_MS,
    RATE_LIMIT_BACKOFF_MULTIPLIER,
    buildStandardPrompt,
    buildInstructPrompt,
    createRequestId,
    isInstructModelName,
    stripThinkBlocks,
    REDACTION_MODE_DEFAULT,
    type RedactionMode,
} from "../shared/constants/settings";
import {
    PROVIDERS,
    PROVIDER_DEFAULTS,
    type Provider,
} from "../shared/constants/providers";
import {
    getBasicTargetLanguageLabel,
    buildBasicTranslationInstructions,
    buildTranslationInstructionsWithDetection,
} from "../shared/constants/languages";
import {
    ensureI18nReady,
    getActiveUILocale,
    getI18nMessageOrFallback,
    initializeI18nFromStorage,
    UI_LANGUAGE_DEFAULT,
    UI_LANGUAGE_STORAGE_KEY,
} from "../shared/i18n";
import {
    protectHtmlAttributeValues,
    redactSensitiveHTML,
    restoreHtmlAttributeValues,
} from "../shared/sensitive";

/**
 * Apply redaction to text/HTML based on the user's redaction-mode setting and
 * return the (possibly redacted) text.  Logs a summary when items are found.
 */
function applyRedaction(text: string, mode: RedactionMode): string {
    const r = redactSensitiveHTML(text, mode);
    if (r.redactionCount > 0) {
        console.log(
            `[AI Translator] Redacted ${r.redactionCount} sensitive item(s): ${r.typesDetected.join(", ")}`,
        );
        return r.redactedText;
    }
    return text;
}

interface PreparedTranslationInput {
    text: string;
    restoreTranslatedOutput: (translatedText: string) => string;
}

function prepareTranslationInput(
    text: string,
    redactionMode: RedactionMode,
): PreparedTranslationInput {
    const { protectedHtml, replacements } = protectHtmlAttributeValues(text);
    return {
        text: applyRedaction(protectedHtml, redactionMode),
        restoreTranslatedOutput: (translatedText: string) =>
            restoreHtmlAttributeValues(translatedText, replacements),
    };
}

interface StreamState {
    requestId: string;
    controller: AbortController;
    port: chrome.runtime.Port;
    throttleTimer: ReturnType<typeof setTimeout> | null;
    pendingText: string;
    keepAliveTimer: ReturnType<typeof setInterval>;
}

interface HTMLUnit {
    id: string | number;
    html: string;
}

interface HTMLTranslationResult {
    id: string | number;
    translatedHtml: string;
    error?: string;
}

interface BatchMeta {
    batchIndex: number;
    batchCount: number;
    batchSize: number;
    subBatchIndex?: number;
    subBatchCount?: number;
    subBatchSize?: number;
}

type OnBatchResultsCallback = (
    results: HTMLTranslationResult[],
    meta?: BatchMeta,
) => void;

const activeStreams = new Map<number, StreamState>();

function t(key: string, fallback: string, substitutions?: string | string[]): string {
    return getI18nMessageOrFallback(key, fallback, substitutions);
}

function createLocalizedContextMenus(): void {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "translateSelectedText",
            title: t("contextMenuTranslateSelectedText", "Translate Selected Text"),
            contexts: ["selection"],
        });

        chrome.contextMenus.create({
            id: "translateFullPage",
            title: t("contextMenuTranslateEntirePage", "Translate Entire Page"),
            contexts: ["page", "selection"],
        });

        console.log("AI Translator context menus created.");
    });
}

async function refreshLocalizedContextMenus(): Promise<void> {
    await initializeI18nFromStorage();
    createLocalizedContextMenus();
}

void initializeI18nFromStorage();

// Rate limit detection and retry helpers
function isRateLimitError(error: any): boolean {
    if (!error) return false;

    // Check HTTP status code
    const status = error.status || error.statusCode || error.code;
    if (status === 429 || status === "429") return true;

    // Check error message patterns
    const message = String(error.message || error.error || error || "").toLowerCase();
    if (message.includes("rate limit") || message.includes("rate_limit")) return true;
    if (message.includes("too many requests")) return true;
    if (message.includes("quota exceeded")) return true;
    if (message.includes("tokens per minute")) return true;
    if (message.includes("requests per minute")) return true;
    if (message.includes("tpm") || message.includes("rpm")) return true;

    // Check nested error (AI SDK wraps errors)
    if (error.cause && isRateLimitError(error.cause)) return true;
    if (error.lastError && isRateLimitError(error.lastError)) return true;

    return false;
}

function parseRetryAfterHint(error: any): number | null {
    const message = String(error?.message || error || "");

    // Parse "try again in X.XXs" or "try again in X seconds"
    const match = message.match(/try again in (\d+(?:\.\d+)?)\s*s/i);
    if (match) {
        const seconds = parseFloat(match[1]);
        if (!isNaN(seconds) && seconds > 0 && seconds < 300) {
            return Math.ceil(seconds * 1000);
        }
    }

    // Check Retry-After header value if present
    const retryAfter = error?.headers?.["retry-after"] || error?.retryAfter;
    if (retryAfter) {
        const seconds = parseFloat(retryAfter);
        if (!isNaN(seconds) && seconds > 0 && seconds < 300) {
            return Math.ceil(seconds * 1000);
        }
    }

    return null;
}

function calculateBackoffDelay(attempt: number, hintMs: number | null): number {
    // If we have a hint from the API, use it (with small buffer)
    if (hintMs !== null) {
        return Math.min(hintMs + 500, RATE_LIMIT_MAX_DELAY_MS);
    }

    // Exponential backoff with jitter
    const baseDelay =
        RATE_LIMIT_BASE_DELAY_MS * Math.pow(RATE_LIMIT_BACKOFF_MULTIPLIER, attempt);
    const jitter = Math.random() * 0.3 * baseDelay; // 0-30% jitter
    return Math.min(baseDelay + jitter, RATE_LIMIT_MAX_DELAY_MS);
}

function isAbortError(error: any): boolean {
    return (
        error?.name === "AbortError" ||
        error?.code === "ABORT_ERR" ||
        error?.cancelled === true
    );
}

function throwIfAborted(signal?: AbortSignal | null): void {
    if (signal?.aborted) {
        const error = new Error("Translation cancelled.");
        (error as any).name = "AbortError";
        (error as any).cancelled = true;
        throw error;
    }
}

async function sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
    throwIfAborted(signal);
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timeoutId);
            const error = new Error("Translation cancelled.");
            (error as any).name = "AbortError";
            (error as any).cancelled = true;
            reject(error);
        };
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}

async function withRateLimitRetry<T>(
    fn: () => Promise<T>,
    context: string = "API call",
    signal?: AbortSignal | null,
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= RATE_LIMIT_MAX_RETRIES; attempt++) {
        throwIfAborted(signal);
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (isAbortError(error) || signal?.aborted) {
                throw error;
            }

            if (!isRateLimitError(error)) {
                // Not a rate limit error, don't retry
                throw error;
            }

            if (attempt === RATE_LIMIT_MAX_RETRIES) {
                // Exhausted all retries
                console.error(
                    `${context}: Rate limit exhausted after ${attempt + 1} attempts`,
                );
                throw error;
            }

            const hintMs = parseRetryAfterHint(error);
            const delayMs = calculateBackoffDelay(attempt, hintMs);

            console.warn(
                `${context}: Rate limit hit (attempt ${attempt + 1}/${RATE_LIMIT_MAX_RETRIES + 1}), ` +
                    `retrying in ${Math.round(delayMs / 1000)}s...`,
            );

            await sleep(delayMs, signal);
        }
    }

    throw lastError;
}

function normalizeOpenAIBaseUrl(apiEndpoint: string, provider: Provider): string {
    const fallback = PROVIDER_DEFAULTS[provider]?.apiEndpoint || "";
    const endpoint = (apiEndpoint || fallback).trim();
    if (!endpoint) {
        return "";
    }

    let base = endpoint.replace(/\/+$/, "");
    if (base.endsWith("/chat/completions")) {
        base = base.slice(0, -"/chat/completions".length);
    }

    if (provider === "ollama" && !base.endsWith("/v1")) {
        base = `${base}/v1`;
    }

    return base;
}

function normalizeAnthropicBaseUrl(apiEndpoint: string): string {
    const fallback = PROVIDER_DEFAULTS.anthropic.apiEndpoint || "";
    const endpoint = (apiEndpoint || fallback).trim();
    if (!endpoint) {
        return "";
    }

    let base = endpoint.replace(/\/+$/, "");
    if (base.endsWith("/messages")) {
        base = base.slice(0, -"/messages".length);
    }

    return base;
}

function normalizeGoogleBaseUrl(apiEndpoint: string): string {
    const fallback = PROVIDER_DEFAULTS.google.apiEndpoint || "";
    const endpoint = (apiEndpoint || fallback).trim();
    if (!endpoint) {
        return "";
    }

    let base = endpoint.replace(/\/+$/, "");
    const modelsIndex = base.indexOf("/models/");
    if (modelsIndex !== -1) {
        base = base.slice(0, modelsIndex);
    }

    if (base.endsWith(":generateContent")) {
        base = base.replace(/:generateContent$/, "");
    }

    return base;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCerebrasQwenModelName(modelName: unknown): boolean {
    return typeof modelName === "string" && modelName.toLowerCase().includes("qwen");
}

function extractTextParts(value: unknown): string[] {
    if (typeof value === "string") {
        return [value];
    }

    if (Array.isArray(value)) {
        return value.flatMap(extractTextParts);
    }

    if (!isRecord(value)) {
        return [];
    }

    const parts: string[] = [];
    parts.push(...extractTextParts(value.text));
    parts.push(...extractTextParts(value.content));
    return parts;
}

function pickFirstUsableTranslation(provider: Provider, candidates: string[]): string {
    for (const candidate of candidates) {
        if (!candidate || candidate.trim() === "") {
            continue;
        }

        const cleaned = shouldStripThinkBlocks(provider)
            ? stripThinkBlocks(candidate)
            : candidate;

        if (cleaned && cleaned.trim() !== "") {
            return cleaned.trim();
        }
    }

    return "";
}

function extractFallbackTranslationFromResponseBody(
    responseBody: unknown,
    provider: Provider,
): string {
    if (!isRecord(responseBody)) {
        return "";
    }

    const candidates: string[] = [];

    const outputText = extractTextParts(responseBody.output_text);
    if (outputText.length > 0) {
        candidates.push(...outputText);
    }

    const choicesValue = responseBody.choices;
    if (Array.isArray(choicesValue)) {
        for (const choiceValue of choicesValue) {
            if (!isRecord(choiceValue)) {
                continue;
            }

            const message = isRecord(choiceValue.message) ? choiceValue.message : null;
            if (!message) {
                continue;
            }

            candidates.push(...extractTextParts(message.content));

            // If the provider emits think-tagged reasoning in non-standard fields,
            // recover only the final answer section after stripping think blocks.
            const reasoningContentParts = extractTextParts(message.reasoning_content);
            if (reasoningContentParts.length > 0) {
                const reasoningCandidate = reasoningContentParts.join("\n");
                if (/<\/?think\b/i.test(reasoningCandidate)) {
                    candidates.push(reasoningCandidate);
                }
            }
        }
    }

    return pickFirstUsableTranslation(provider, candidates);
}

function extractThinkTaggedFallback(provider: Provider, text: string): string {
    if (!shouldStripThinkBlocks(provider) || !/<\/?think\b/i.test(text)) {
        return "";
    }

    return pickFirstUsableTranslation(provider, [text]);
}

function parseProviderErrorDetail(value: unknown): string | null {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const nested = parseProviderErrorDetail(item);
            if (nested) {
                return nested;
            }
        }
        return null;
    }

    if (!isRecord(value)) {
        return null;
    }

    const directKeys = [
        "message",
        "detail",
        "description",
        "error_description",
        "reason",
    ];
    for (const key of directKeys) {
        const nested = parseProviderErrorDetail(value[key]);
        if (nested) {
            return nested;
        }
    }

    if (value.error !== undefined) {
        const nested = parseProviderErrorDetail(value.error);
        if (nested) {
            return nested;
        }
    }

    if (value.errors !== undefined) {
        const nested = parseProviderErrorDetail(value.errors);
        if (nested) {
            return nested;
        }
    }

    return null;
}

function truncateLogString(value: string, maxLength: number = 800): string {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength)}…`;
}

function safeStringifyForDebug(value: unknown, maxLength: number = 1500): string {
    if (value === undefined) {
        return "";
    }

    try {
        return truncateLogString(JSON.stringify(value, null, 2), maxLength);
    } catch {
        return truncateLogString(String(value), maxLength);
    }
}

function getTranslationErrorMessage(error: unknown): string {
    const rawMessage = (error as any)?.message;
    if (typeof rawMessage === "string" && rawMessage.trim() !== "") {
        return t("contentTranslationErrorPrefix", "Translation Error: $1", rawMessage);
    }

    return t("contentTranslationErrorUnknown", "Translation Error: Unknown error");
}

function buildDebugErrorDetails(
    error: unknown,
    context: string,
    meta: Record<string, unknown> = {},
): string {
    const e = error as any;
    const lines: string[] = [`Context: ${context}`];

    const filteredMeta = Object.fromEntries(
        Object.entries(meta).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(filteredMeta).length > 0) {
        lines.push(`Meta: ${safeStringifyForDebug(filteredMeta, 700)}`);
    }

    if (e?.name) {
        lines.push(`Name: ${String(e.name)}`);
    }

    if (e?.message) {
        lines.push(`Message: ${String(e.message)}`);
    } else {
        lines.push(`Message: ${String(error || "Unknown error")}`);
    }

    if (e?.cause !== undefined) {
        const cause = e.cause;
        if (cause instanceof Error) {
            if (cause.name) {
                lines.push(`Cause Name: ${cause.name}`);
            }
            lines.push(`Cause Message: ${cause.message}`);
            if (cause.stack) {
                lines.push(
                    `Cause Stack: ${truncateLogString(String(cause.stack), 1000)}`,
                );
            }
        } else {
            lines.push(`Cause: ${safeStringifyForDebug(cause, 1200)}`);
        }
    }

    if (e?.stack) {
        lines.push(`Stack: ${truncateLogString(String(e.stack), 1500)}`);
    }

    return truncateLogString(lines.join("\n"), 3500);
}

function summarizeApiError(error: unknown): {
    userMessage: string;
    debug: {
        name?: string;
        message: string;
        statusCode?: number;
        isRetryable?: boolean;
        data?: unknown;
        responseBody?: unknown;
    };
} {
    const e = error as any;
    const statusCode =
        typeof e?.statusCode === "number"
            ? e.statusCode
            : typeof e?.status === "number"
              ? e.status
              : undefined;

    const baseMessage = String(e?.message || error || "Unknown error");
    const dataDetail = parseProviderErrorDetail(e?.data);

    let parsedResponseBody: unknown = undefined;
    if (typeof e?.responseBody === "string" && e.responseBody.trim() !== "") {
        try {
            parsedResponseBody = JSON.parse(e.responseBody);
        } catch {
            parsedResponseBody = truncateLogString(e.responseBody);
        }
    } else if (e?.responseBody !== undefined) {
        parsedResponseBody = e.responseBody;
    }

    const responseDetail = parseProviderErrorDetail(parsedResponseBody);
    const detail = dataDetail || responseDetail || null;

    const detailParts: string[] = [];
    if (statusCode !== undefined) {
        detailParts.push(`status ${statusCode}`);
    }
    if (detail) {
        detailParts.push(detail);
    }

    const userMessage =
        detailParts.length > 0
            ? `${baseMessage} (${detailParts.join("; ")})`
            : baseMessage;

    return {
        userMessage,
        debug: {
            name: e?.name,
            message: baseMessage,
            statusCode,
            isRetryable: typeof e?.isRetryable === "boolean" ? e.isRetryable : undefined,
            data: e?.data,
            responseBody: parsedResponseBody,
        },
    };
}

function resolveProviderModel(
    provider: Provider,
    apiKey: string,
    apiEndpoint: string,
    modelName: string,
): any {
    if (provider === "anthropic") {
        const anthropic = createAnthropic({
            apiKey,
            baseURL: normalizeAnthropicBaseUrl(apiEndpoint) || undefined,
        });
        return anthropic(modelName);
    }

    if (provider === "google") {
        const google = createGoogleGenerativeAI({
            apiKey,
            baseURL: normalizeGoogleBaseUrl(apiEndpoint) || undefined,
        });
        return google(modelName);
    }

    const baseURL = normalizeOpenAIBaseUrl(apiEndpoint, provider);
    const headers =
        provider === "openrouter"
            ? {
                  "HTTP-Referer": "https://github.com/",
                  "X-Title": "AI Translator Extension",
              }
            : undefined;
    const openai = createOpenAI({
        apiKey: apiKey || "ollama",
        baseURL: baseURL || undefined,
        headers,
    });
    return openai(modelName);
}

function resolveMaxTokens(provider: Provider, isFullPage: boolean): number | undefined {
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

function shouldStripThinkBlocks(provider: Provider): boolean {
    return provider === "groq" || provider === "cerebras";
}

function shouldUseStreamingForSelectedText(
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

function shouldRetrySelectedTextWithoutStreaming(
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

function startStreamKeepAlive(): ReturnType<typeof setInterval> {
    return setInterval(() => {
        chrome.runtime.getPlatformInfo(() => {});
    }, STREAM_KEEP_ALIVE_INTERVAL_MS);
}

function cancelActiveStream(tabId: number, requestId: string | null = null): void {
    const existing = activeStreams.get(tabId);
    if (!existing) {
        return;
    }

    if (requestId && existing.requestId !== requestId) {
        return;
    }

    if (existing.throttleTimer) {
        clearTimeout(existing.throttleTimer);
    }

    if (existing.keepAliveTimer) {
        clearInterval(existing.keepAliveTimer);
    }

    if (existing.controller) {
        existing.controller.abort();
    }

    if (existing.port) {
        try {
            existing.port.disconnect();
        } catch (error) {
            console.warn("Could not disconnect stream port:", error);
        }
    }

    activeStreams.delete(tabId);
}

function sendStreamUpdate(
    streamState: StreamState,
    text: string,
    detectedLanguageName: string | null,
    targetLanguageName: string | null,
): void {
    if (!streamState.port) {
        return;
    }

    try {
        streamState.port.postMessage({
            action: "streamTranslationUpdate",
            requestId: streamState.requestId,
            text,
            detectedLanguageName,
            targetLanguageName,
        });
    } catch (error) {
        console.warn("Failed to post stream update:", error);
    }
}

function scheduleStreamUpdate(
    streamState: StreamState,
    text: string,
    detectedLanguageName: string | null,
    targetLanguageName: string | null,
): void {
    streamState.pendingText = text;

    if (streamState.throttleTimer) {
        return;
    }

    streamState.throttleTimer = setTimeout(() => {
        streamState.throttleTimer = null;
        sendStreamUpdate(
            streamState,
            streamState.pendingText,
            detectedLanguageName,
            targetLanguageName,
        );
    }, STREAM_UPDATE_THROTTLE_MS);
}

function flushStreamUpdate(
    streamState: StreamState,
    text: string,
    detectedLanguageName: string | null,
    targetLanguageName: string | null,
): void {
    if (streamState.throttleTimer) {
        clearTimeout(streamState.throttleTimer);
        streamState.throttleTimer = null;
    }

    sendStreamUpdate(streamState, text, detectedLanguageName, targetLanguageName);
}

function ensureContentScriptInjected(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabId },
                files: ["purify.min.js", "content.js"],
            },
            () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                chrome.scripting.insertCSS(
                    {
                        target: { tabId: tabId },
                        files: ["styles.css"],
                    },
                    () => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }
                        setTimeout(() => resolve(), 100);
                    },
                );
            },
        );
    });
}

function notifyContentScript(
    tabId: number,
    text: string,
    isFullPage: boolean,
    isError: boolean = false,
    isLoading: boolean = false,
    requestId: string | null = null,
    debugInfo: string | null = null,
): void {
    const action = isFullPage
        ? isLoading
            ? "showLoadingIndicator"
            : "startElementTranslation"
        : "displayTranslation";
    const message: any = { action };

    if (action === "displayTranslation") {
        message.text = text;
        message.isStreaming = false;
        message.isLoading = isLoading;
        message.isError = isError;
        if (debugInfo) {
            message.debugInfo = debugInfo;
        }
    } else if (action === "startElementTranslation") {
        message.isError = isError;
        if (isError) {
            message.errorMessage = text;
            if (debugInfo) {
                message.debugInfo = debugInfo;
            }
        }
    } else if (action === "showLoadingIndicator") {
        message.isFullPage = true;
    }

    if (requestId) {
        message.requestId = requestId;
    }

    chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message || "";
            if (!errorMessage.includes("Receiving end does not exist")) {
                console.warn(
                    `Could not send message to tab ${tabId} for action ${message.action}: ${errorMessage}.`,
                );
            }
        } else if ((response as { status?: string })?.status === "received") {
            console.log(`Content script in tab ${tabId} acknowledged ${message.action}.`);
        }
    });
}

function notifyContentScriptWithDetection(
    tabId: number,
    text: string,
    isFullPage: boolean,
    isError: boolean,
    isLoading: boolean,
    detectedLanguageName: string | null,
    targetLanguageName: string | null,
    requestId: string | null = null,
    debugInfo: string | null = null,
): void {
    const action = isFullPage
        ? isLoading
            ? "showLoadingIndicator"
            : "startElementTranslation"
        : "displayTranslation";
    const message: any = {
        action,
        detectedLanguageName: detectedLanguageName || undefined,
        targetLanguageName: targetLanguageName || undefined,
    };

    if (action === "displayTranslation") {
        message.text = text;
        message.isStreaming = false;
        message.isLoading = isLoading;
        message.isError = isError;
        if (debugInfo) {
            message.debugInfo = debugInfo;
        }
    } else if (action === "startElementTranslation") {
        message.isError = isError;
        if (isError) {
            message.errorMessage = text;
            if (debugInfo) {
                message.debugInfo = debugInfo;
            }
        }
    } else if (action === "showLoadingIndicator") {
        message.isFullPage = true;
    }

    if (requestId) {
        message.requestId = requestId;
    }

    chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message || "";
            if (!errorMessage.includes("Receiving end does not exist")) {
                console.warn(
                    `Could not send message to tab ${tabId} for action ${message.action}: ${errorMessage}.`,
                );
            }
        } else if ((response as { status?: string })?.status === "received") {
            console.log(`Content script in tab ${tabId} acknowledged ${message.action}.`);
        }
    });
}

async function translateElementText(
    textToTranslate: string,
    elementPath: string,
    tabId: number,
): Promise<string> {
    console.log(
        `Translating element text (length: ${textToTranslate.length}) for path: ${elementPath}`,
    );

    const storage = await getStorage([
        STORAGE_KEYS.API_KEY,
        STORAGE_KEYS.API_ENDPOINT,
        STORAGE_KEYS.API_TYPE,
        STORAGE_KEYS.MODEL_NAME,
        STORAGE_KEYS.PROVIDER_SETTINGS,
        STORAGE_KEYS.SETTINGS_MODE,
        STORAGE_KEYS.BASIC_TARGET_LANGUAGE,
    ]);

    const mode = storage.settingsMode || SETTINGS_MODE_BASIC;
    const settings = getEffectiveProviderSettings(storage, mode);

    const {
        apiKey: finalKey,
        apiEndpoint: finalEndpoint,
        apiType: finalType,
        modelName: finalModel,
        translationInstructions: finalInstructions,
    } = settings;

    if (!finalEndpoint || (!finalKey && finalType !== "ollama")) {
        throw new Error(
            "API Key or Endpoint not set. Please configure in extension settings.",
        );
    }

    return translateTextApiCall(
        textToTranslate,
        finalKey,
        finalEndpoint,
        finalType,
        false,
        finalModel,
        finalInstructions,
    );
}

function estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

function batchHTMLUnits(units: HTMLUnit[]): HTMLUnit[][] {
    const batches: HTMLUnit[][] = [];
    let currentBatch: HTMLUnit[] = [];
    let currentTokens = 0;
    const separatorTokens = estimateTokens(HTML_UNIT_SEPARATOR);

    for (const unit of units) {
        const unitTokens = estimateTokens(unit.html);

        if (unitTokens > MAX_BATCH_INPUT_TOKENS) {
            if (currentBatch.length > 0) {
                batches.push(currentBatch);
                currentBatch = [];
                currentTokens = 0;
            }
            batches.push([unit]);
            continue;
        }

        const additionalTokens =
            currentBatch.length > 0 ? unitTokens + separatorTokens : unitTokens;

        if (
            currentBatch.length > 0 &&
            (currentTokens + additionalTokens > MAX_BATCH_INPUT_TOKENS ||
                currentBatch.length >= MAX_BATCH_UNITS)
        ) {
            batches.push(currentBatch);
            currentBatch = [unit];
            currentTokens = unitTokens;
        } else {
            currentBatch.push(unit);
            currentTokens += additionalTokens;
        }
    }

    if (currentBatch.length > 0) {
        batches.push(currentBatch);
    }

    return batches;
}

async function translateHTMLBatch(
    batch: HTMLUnit[],
    settings: EffectiveProviderSettings,
    isRetry: boolean = false,
    signal?: AbortSignal | null,
): Promise<HTMLTranslationResult[]> {
    throwIfAborted(signal);
    const { apiKey, apiEndpoint, apiType, modelName, translationInstructions } = settings;

    const combinedInput = batch.map((u) => u.html).join(HTML_UNIT_SEPARATOR);

    const systemPrompt = isRetry
        ? HTML_PRESERVING_STRICT_PROMPT
        : HTML_PRESERVING_SYSTEM_PROMPT;

    let userPrompt: string;
    if (batch.length === 1) {
        userPrompt =
            `${translationInstructions}\n\n` +
            `Translate the following HTML snippet. Preserve all HTML tags and attributes exactly.\n\n` +
            combinedInput;
    } else {
        userPrompt =
            `${translationInstructions}\n\n` +
            `Translate each of the following ${batch.length} HTML snippets. ` +
            `They are separated by "${HTML_UNIT_SEPARATOR.trim()}". ` +
            `Preserve all HTML tags and attributes exactly. ` +
            `Return the translations separated by the same marker.\n\n` +
            combinedInput;
    }

    const model = resolveProviderModel(apiType, apiKey, apiEndpoint, modelName);

    const result = await withRateLimitRetry(
        () =>
            generateText({
                model,
                system: systemPrompt,
                prompt: userPrompt,
                maxTokens: MAX_BATCH_OUTPUT_TOKENS,
                abortSignal: signal || undefined,
            }),
        `translateHTMLBatch (${batch.length} units)`,
        signal,
    );

    let outputText = result.text || "";

    if (shouldStripThinkBlocks(apiType)) {
        outputText = stripThinkBlocks(outputText);
    }

    const outputParts = outputText.split(HTML_UNIT_SEPARATOR.trim());

    if (outputParts.length !== batch.length) {
        const error = new Error(
            `translateHTMLBatch: output parts (${outputParts.length}) != batch size (${batch.length})`,
        );
        (error as any).code = "OUTPUT_PARTS_MISMATCH";
        throw error;
    }

    const results: HTMLTranslationResult[] = [];
    for (let i = 0; i < batch.length; i++) {
        const rawPart = outputParts[i];
        if (typeof rawPart !== "string") {
            results.push({
                id: batch[i].id,
                translatedHtml: "",
                error: "Missing translation output",
            });
            continue;
        }

        const translatedHtml = rawPart.trim();
        if (!translatedHtml) {
            results.push({
                id: batch[i].id,
                translatedHtml: "",
                error: "Empty translation output",
            });
            continue;
        }

        results.push({
            id: batch[i].id,
            translatedHtml,
        });
    }

    return results;
}

async function translateHTMLUnits(
    units: HTMLUnit[],
    targetLanguage: string | null = null,
    onBatchResults: OnBatchResultsCallback | null = null,
    signal?: AbortSignal | null,
): Promise<HTMLTranslationResult[]> {
    throwIfAborted(signal);
    if (!units || units.length === 0) {
        return [];
    }

    console.log(`translateHTMLUnits: ${units.length} units`);

    const storage = await getStorage([
        STORAGE_KEYS.API_KEY,
        STORAGE_KEYS.API_ENDPOINT,
        STORAGE_KEYS.API_TYPE,
        STORAGE_KEYS.MODEL_NAME,
        STORAGE_KEYS.PROVIDER_SETTINGS,
        STORAGE_KEYS.SETTINGS_MODE,
        STORAGE_KEYS.BASIC_TARGET_LANGUAGE,
        STORAGE_KEYS.ADVANCED_TARGET_LANGUAGE,
        STORAGE_KEYS.REDACTION_MODE,
    ]);

    const mode = storage.settingsMode || SETTINGS_MODE_BASIC;
    const settings = getEffectiveProviderSettings(
        storage,
        mode,
        targetLanguage || undefined,
    );

    if (!settings.apiEndpoint || (!settings.apiKey && settings.apiType !== "ollama")) {
        throw new Error(
            "API Key or Endpoint not set. Please configure in extension settings.",
        );
    }

    // Redact sensitive data in each HTML unit before sending to the API.
    const redactionMode: RedactionMode = storage.redactionMode || REDACTION_MODE_DEFAULT;
    const restoreByUnitId = new Map<
        string | number,
        (translatedHtml: string) => string
    >();
    for (const unit of units) {
        const prepared = prepareTranslationInput(unit.html, redactionMode);
        unit.html = prepared.text;
        restoreByUnitId.set(unit.id, prepared.restoreTranslatedOutput);
    }

    const batches = batchHTMLUnits(units);
    const totalBatches = batches.length;
    console.log(`translateHTMLUnits: created ${totalBatches} batches`);

    const reportBatchResults = (
        batchResults: HTMLTranslationResult[],
        meta: BatchMeta | undefined,
    ) => {
        if (typeof onBatchResults !== "function") {
            return;
        }
        if (!Array.isArray(batchResults) || batchResults.length === 0) {
            return;
        }
        try {
            onBatchResults(batchResults, meta);
        } catch (error) {
            console.warn("translateHTMLUnits: onBatchResults failed:", error);
        }
    };

    const buildBatchMeta = (
        batchIndex: number,
        batchCount: number,
        batch: HTMLUnit[],
        subBatchIndex: number | null = null,
    ): BatchMeta => {
        const meta: BatchMeta = {
            batchIndex,
            batchCount,
            batchSize: batch.length,
        };
        if (subBatchIndex !== null) {
            meta.subBatchIndex = subBatchIndex;
            meta.subBatchCount = 2;
            meta.subBatchSize = batch.length;
        }
        return meta;
    };

    const logBatchStart = (meta: BatchMeta) => {
        const subBatchLabel = meta.subBatchIndex
            ? ` part ${meta.subBatchIndex}/${meta.subBatchCount}`
            : "";
        console.log(
            `translateHTMLUnits: starting batch ${meta.batchIndex}/${meta.batchCount}${subBatchLabel} (${meta.batchSize} units)`,
        );
    };

    const logBatchComplete = (meta: BatchMeta, batchErrors: number) => {
        const subBatchLabel = meta.subBatchIndex
            ? ` part ${meta.subBatchIndex}/${meta.subBatchCount}`
            : "";
        console.log(
            `translateHTMLUnits: completed batch ${meta.batchIndex}/${meta.batchCount}${subBatchLabel} (${batchErrors} errors)`,
        );
    };

    const shouldSplitBatch = (error: any): boolean =>
        error?.code === "OUTPUT_PARTS_MISMATCH";

    const restoreBatchResults = (
        results: HTMLTranslationResult[],
    ): HTMLTranslationResult[] =>
        results.map((result) => {
            if (result.error || !result.translatedHtml) {
                return result;
            }
            const restoreTranslatedOutput = restoreByUnitId.get(result.id);
            if (!restoreTranslatedOutput) {
                return result;
            }
            return {
                ...result,
                translatedHtml: restoreTranslatedOutput(result.translatedHtml),
            };
        });

    const translateBatchWithFallback = async (
        batch: HTMLUnit[],
        batchIndex: number,
        batchCount: number,
        subBatchIndex: number | null = null,
    ): Promise<HTMLTranslationResult[]> => {
        throwIfAborted(signal);
        const meta = buildBatchMeta(batchIndex, batchCount, batch, subBatchIndex);
        logBatchStart(meta);
        try {
            const results = restoreBatchResults(
                await translateHTMLBatch(batch, settings, false, signal),
            );
            const batchErrors = results.filter((result) => result.error).length;
            logBatchComplete(meta, batchErrors);
            reportBatchResults(results, meta);
            return results;
        } catch (error) {
            if (isAbortError(error) || signal?.aborted) {
                throw error;
            }
            console.error("translateHTMLBatch error:", error);
            try {
                const results = restoreBatchResults(
                    await translateHTMLBatch(batch, settings, true, signal),
                );
                const batchErrors = results.filter((result) => result.error).length;
                logBatchComplete(meta, batchErrors);
                reportBatchResults(results, meta);
                return results;
            } catch (retryError) {
                if (isAbortError(retryError) || signal?.aborted) {
                    throw retryError;
                }
                if (shouldSplitBatch(error) || shouldSplitBatch(retryError)) {
                    if (batch.length === 1) {
                        const errorMessage =
                            (retryError as any)?.message || (error as any)?.message;
                        const singleResult: HTMLTranslationResult = {
                            id: batch[0].id,
                            translatedHtml: "",
                            error: errorMessage || "Translation failed",
                        };
                        logBatchComplete(meta, 1);
                        reportBatchResults([singleResult], meta);
                        return [singleResult];
                    }
                    const midpoint = Math.ceil(batch.length / 2);
                    console.warn(
                        `translateHTMLUnits: splitting batch ${batchIndex}/${batchCount} due to output mismatch`,
                    );
                    const firstHalf = await translateBatchWithFallback(
                        batch.slice(0, midpoint),
                        batchIndex,
                        batchCount,
                        1,
                    );
                    const secondHalf = await translateBatchWithFallback(
                        batch.slice(midpoint),
                        batchIndex,
                        batchCount,
                        2,
                    );
                    return [...firstHalf, ...secondHalf];
                }

                const errorMessage =
                    (retryError as any)?.message ||
                    (error as any)?.message ||
                    "Translation failed";
                const fallbackResults = batch.map(
                    (unit): HTMLTranslationResult => ({
                        id: unit.id,
                        translatedHtml: "",
                        error: errorMessage,
                    }),
                );
                logBatchComplete(meta, fallbackResults.length);
                reportBatchResults(fallbackResults, meta);
                return fallbackResults;
            }
        }
    };

    const allResults: HTMLTranslationResult[] = [];
    for (let index = 0; index < batches.length; index++) {
        throwIfAborted(signal);
        const batch = batches[index];
        const batchIndex = index + 1;
        const batchResults = await translateBatchWithFallback(
            batch,
            batchIndex,
            totalBatches,
        );
        allResults.push(...batchResults);
    }

    return allResults;
}

async function streamSelectedTranslation(
    tabId: number,
    requestId: string,
    textToTranslate: string,
    apiKey: string,
    apiEndpoint: string,
    apiType: Provider,
    modelName: string,
    translationInstructions: string,
    detectedLanguageName: string | null = null,
    targetLanguageName: string | null = null,
    restoreTranslatedOutput: ((translatedText: string) => string) | null = null,
): Promise<string | null> {
    cancelActiveStream(tabId);

    const userInstructions = translationInstructions || DEFAULT_TRANSLATION_INSTRUCTIONS;
    const provider = apiType && PROVIDERS.includes(apiType) ? apiType : "openai";
    const selectedModelName =
        modelName ||
        PROVIDER_DEFAULTS[provider]?.modelName ||
        PROVIDER_DEFAULTS.openai?.modelName;
    const shouldUseInstructPrompt =
        typeof selectedModelName === "string" && isInstructModelName(selectedModelName);
    const prompt = shouldUseInstructPrompt
        ? buildInstructPrompt(userInstructions, textToTranslate)
        : buildStandardPrompt(userInstructions, textToTranslate);
    const systemPrompt = shouldUseInstructPrompt
        ? INSTRUCT_SYSTEM_PROMPT
        : DEFAULT_SYSTEM_PROMPT;
    const maxTokens = resolveMaxTokens(provider, false);
    const model = resolveProviderModel(provider, apiKey, apiEndpoint, selectedModelName);

    const controller = new AbortController();
    const port = chrome.tabs.connect(tabId, { name: STREAM_PORT_NAME });
    const streamState: StreamState = {
        requestId,
        controller,
        port,
        throttleTimer: null,
        pendingText: "",
        keepAliveTimer: startStreamKeepAlive(),
    };

    activeStreams.set(tabId, streamState);

    port.onMessage.addListener((message: any) => {
        if (message?.action === "cancelStream" && message.requestId === requestId) {
            cancelActiveStream(tabId, requestId);
        }
    });

    port.onDisconnect.addListener(() => {
        cancelActiveStream(tabId, requestId);
    });

    try {
        const result = await streamText({
            model,
            system: systemPrompt,
            prompt,
            maxTokens: maxTokens ?? undefined,
            abortSignal: controller.signal,
        });

        let translation = "";
        let reasoningText = "";
        for await (const part of result.fullStream) {
            if (part.type === "text-delta") {
                translation += part.textDelta;
                const streamedText = pickFirstUsableTranslation(provider, [translation]);
                if (streamedText !== "") {
                    scheduleStreamUpdate(
                        streamState,
                        restoreTranslatedOutput
                            ? restoreTranslatedOutput(streamedText)
                            : streamedText,
                        detectedLanguageName,
                        targetLanguageName,
                    );
                }
            } else if (part.type === "reasoning" && typeof part.textDelta === "string") {
                reasoningText += part.textDelta;
            }
        }

        const finalText = pickFirstUsableTranslation(provider, [
            translation,
            extractThinkTaggedFallback(provider, reasoningText),
        ]);

        if (!finalText || finalText.trim() === "") {
            throw new Error("API returned no translation text.");
        }
        const restoredFinalText = restoreTranslatedOutput
            ? restoreTranslatedOutput(finalText)
            : finalText;
        flushStreamUpdate(
            streamState,
            restoredFinalText,
            detectedLanguageName,
            targetLanguageName,
        );
        return restoredFinalText;
    } catch (error) {
        if (controller.signal.aborted || (error as any)?.name === "AbortError") {
            return null;
        }
        const summary = summarizeApiError(error);
        console.error("AI SDK streaming translation error:", summary.debug);
        throw new Error(summary.userMessage, { cause: error as any });
    } finally {
        if (activeStreams.get(tabId) === streamState) {
            activeStreams.delete(tabId);
        }
        if (streamState.throttleTimer) {
            clearTimeout(streamState.throttleTimer);
        }
        if (streamState.keepAliveTimer) {
            clearInterval(streamState.keepAliveTimer);
        }
        if (streamState.port) {
            try {
                streamState.port.disconnect();
            } catch (error) {
                console.warn("Could not disconnect stream port:", error);
            }
        }
    }
}

async function translateTextApiCall(
    textToTranslate: string,
    apiKey: string,
    apiEndpoint: string,
    apiType: Provider,
    isFullPage: boolean,
    modelName: string,
    translationInstructions: string,
): Promise<string> {
    console.log(
        `Sending text to AI SDK (${apiType}). FullPage: ${isFullPage}. Text length: ${textToTranslate.length}`,
    );

    const userInstructions = translationInstructions || DEFAULT_TRANSLATION_INSTRUCTIONS;
    const provider = apiType && PROVIDERS.includes(apiType) ? apiType : "openai";
    const selectedModelName =
        modelName ||
        PROVIDER_DEFAULTS[provider]?.modelName ||
        PROVIDER_DEFAULTS.openai?.modelName;
    const shouldUseInstructPrompt =
        typeof selectedModelName === "string" && isInstructModelName(selectedModelName);
    const prompt = shouldUseInstructPrompt
        ? buildInstructPrompt(userInstructions, textToTranslate)
        : buildStandardPrompt(userInstructions, textToTranslate);
    const systemPrompt = shouldUseInstructPrompt
        ? INSTRUCT_SYSTEM_PROMPT
        : DEFAULT_SYSTEM_PROMPT;
    const model = resolveProviderModel(provider, apiKey, apiEndpoint, selectedModelName);
    const maxTokens = resolveMaxTokens(provider, isFullPage);

    try {
        const result = await withRateLimitRetry(
            () =>
                generateText({
                    model,
                    system: systemPrompt,
                    prompt,
                    maxTokens: maxTokens ?? undefined,
                }),
            "translateTextApiCall",
        );

        const fallbackFromBody = extractFallbackTranslationFromResponseBody(
            result.response?.body,
            provider,
        );

        const translation = pickFirstUsableTranslation(provider, [
            result.text || "",
            fallbackFromBody,
            extractThinkTaggedFallback(provider, result.reasoning || ""),
        ]);

        if (!translation || translation.trim() === "") {
            throw new Error("API returned no translation text.");
        }

        return translation.trim();
    } catch (error) {
        const summary = summarizeApiError(error);
        console.error("AI SDK translation error:", summary.debug);
        throw new Error(summary.userMessage, { cause: error as any });
    }
}

async function getSettingsAndTranslate(
    textToTranslate: string,
    tabId: number,
    isFullPage: boolean,
    requestId: string | null = null,
): Promise<void> {
    console.log("getSettingsAndTranslate called.", {
        textToTranslate,
        tabId,
        isFullPage,
    });

    const storage = await getStorage([
        STORAGE_KEYS.API_KEY,
        STORAGE_KEYS.API_ENDPOINT,
        STORAGE_KEYS.API_TYPE,
        STORAGE_KEYS.MODEL_NAME,
        STORAGE_KEYS.PROVIDER_SETTINGS,
        STORAGE_KEYS.SETTINGS_MODE,
        STORAGE_KEYS.BASIC_TARGET_LANGUAGE,
        STORAGE_KEYS.DEBUG_MODE,
        STORAGE_KEYS.REDACTION_MODE,
    ]);
    const debugModeEnabled =
        typeof storage.debugMode === "boolean" ? storage.debugMode : DEBUG_MODE_DEFAULT;

    // Redact sensitive data before it reaches any provider API.
    const redactionMode: RedactionMode = storage.redactionMode || REDACTION_MODE_DEFAULT;
    const preparedInput = prepareTranslationInput(textToTranslate, redactionMode);
    textToTranslate = preparedInput.text;

    const mode = storage.settingsMode || SETTINGS_MODE_BASIC;
    const settings = getEffectiveProviderSettings(storage, mode);

    const {
        apiKey: finalKey,
        apiEndpoint: finalEndpoint,
        apiType: finalType,
        modelName: finalModel,
        translationInstructions: finalInstructions,
    } = settings;
    const selectedModelName =
        finalModel ||
        PROVIDER_DEFAULTS[finalType]?.modelName ||
        PROVIDER_DEFAULTS.openai?.modelName;

    const resolvedRequestId = requestId || createRequestId();

    if (debugModeEnabled) {
        console.log("[AI Translator Debug] Translation request", {
            requestId: resolvedRequestId,
            tabId,
            isFullPage,
            provider: finalType,
            endpoint: finalEndpoint,
            model: selectedModelName,
            textLength: textToTranslate.length,
        });
    }

    if (!finalEndpoint || (!finalKey && finalType !== "ollama")) {
        const errorMsg = t(
            "errorApiKeyOrEndpointNotSet",
            "Translation Error: API Key or Endpoint not set. Please configure in extension settings.",
        );
        console.error(errorMsg);
        const debugInfo = debugModeEnabled
            ? buildDebugErrorDetails(new Error(errorMsg), "settings-validation", {
                  tabId,
                  isFullPage,
                  provider: finalType,
                  endpointConfigured: Boolean(finalEndpoint),
                  hasApiKey: Boolean(finalKey),
              })
            : null;
        notifyContentScript(
            tabId,
            errorMsg,
            isFullPage,
            true,
            false,
            resolvedRequestId,
            debugInfo,
        );
        return;
    }

    if (!isFullPage) {
        notifyContentScript(
            tabId,
            t("contentTranslating", "Translating..."),
            false,
            false,
            true,
            resolvedRequestId,
        );

        if (!shouldUseStreamingForSelectedText(finalType, selectedModelName)) {
            translateTextApiCall(
                textToTranslate,
                finalKey,
                finalEndpoint,
                finalType,
                false,
                selectedModelName,
                finalInstructions,
            )
                .then((translation) => {
                    notifyContentScript(
                        tabId,
                        preparedInput.restoreTranslatedOutput(translation),
                        false,
                        false,
                        false,
                        resolvedRequestId,
                    );
                })
                .catch((error) => {
                    console.error("Translation error:", error);
                    const errorMsg = getTranslationErrorMessage(error);
                    const debugInfo = debugModeEnabled
                        ? buildDebugErrorDetails(error, "selected-translation", {
                              tabId,
                              provider: finalType,
                              model: selectedModelName,
                              isStreaming: false,
                              mode,
                          })
                        : null;
                    if (debugModeEnabled) {
                        console.error(
                            "[AI Translator Debug] Selected translation failed",
                            {
                                requestId: resolvedRequestId,
                                debugInfo,
                            },
                        );
                    }
                    notifyContentScript(
                        tabId,
                        errorMsg,
                        false,
                        true,
                        false,
                        resolvedRequestId,
                        debugInfo,
                    );
                });
            return;
        }

        streamSelectedTranslation(
            tabId,
            resolvedRequestId,
            textToTranslate,
            finalKey,
            finalEndpoint,
            finalType,
            selectedModelName,
            finalInstructions,
            null,
            null,
            preparedInput.restoreTranslatedOutput,
        )
            .then((translation) => {
                if (translation === null) {
                    return;
                }
                notifyContentScript(
                    tabId,
                    translation,
                    false,
                    false,
                    false,
                    resolvedRequestId,
                );
            })
            .catch(async (error) => {
                if (
                    shouldRetrySelectedTextWithoutStreaming(
                        error,
                        finalType,
                        selectedModelName,
                    )
                ) {
                    console.warn(
                        "Streaming selected translation failed; retrying without streaming.",
                    );
                    try {
                        const fallbackTranslation = await translateTextApiCall(
                            textToTranslate,
                            finalKey,
                            finalEndpoint,
                            finalType,
                            false,
                            selectedModelName,
                            finalInstructions,
                        );
                        notifyContentScript(
                            tabId,
                            preparedInput.restoreTranslatedOutput(fallbackTranslation),
                            false,
                            false,
                            false,
                            resolvedRequestId,
                        );
                        return;
                    } catch (fallbackError) {
                        console.error(
                            "Selected-text fallback translation error:",
                            fallbackError,
                        );
                        error = fallbackError;
                    }
                }

                console.error("Translation error:", error);
                const errorMsg = getTranslationErrorMessage(error);
                const debugInfo = debugModeEnabled
                    ? buildDebugErrorDetails(error, "selected-translation-stream", {
                          tabId,
                          provider: finalType,
                          model: selectedModelName,
                          isStreaming: true,
                          mode,
                      })
                    : null;
                if (debugModeEnabled) {
                    console.error(
                        "[AI Translator Debug] Streaming selected translation failed",
                        {
                            requestId: resolvedRequestId,
                            debugInfo,
                        },
                    );
                }
                notifyContentScript(
                    tabId,
                    errorMsg,
                    false,
                    true,
                    false,
                    resolvedRequestId,
                    debugInfo,
                );
            });
        return;
    }

    console.log(
        "Attempting to call translateTextApiCall with resolved provider settings.",
    );

    translateTextApiCall(
        textToTranslate,
        finalKey,
        finalEndpoint,
        finalType,
        isFullPage,
        finalModel,
        finalInstructions,
    )
        .then((translation) => {
            console.log("Translation received (length):", translation.length);
            notifyContentScript(
                tabId,
                preparedInput.restoreTranslatedOutput(translation),
                isFullPage,
                false,
                false,
                resolvedRequestId,
            );
        })
        .catch((error) => {
            console.error("Translation error:", error);
            const errorMsg = getTranslationErrorMessage(error);
            const debugInfo = debugModeEnabled
                ? buildDebugErrorDetails(error, "full-page-translation", {
                      tabId,
                      provider: finalType,
                      model: selectedModelName,
                      mode,
                  })
                : null;
            if (debugModeEnabled) {
                console.error("[AI Translator Debug] Full-page translation failed", {
                    requestId: resolvedRequestId,
                    debugInfo,
                });
            }
            notifyContentScript(
                tabId,
                errorMsg,
                isFullPage,
                true,
                false,
                resolvedRequestId,
                debugInfo,
            );
        });
}

async function getSettingsAndTranslateWithDetection(
    textToTranslate: string,
    tabId: number,
    isFullPage: boolean,
    detectedLanguage: string | null,
    detectedLanguageName: string | null,
    requestId: string | null = null,
): Promise<void> {
    console.log("getSettingsAndTranslateWithDetection called.", {
        textToTranslate,
        tabId,
        isFullPage,
        detectedLanguage,
        detectedLanguageName,
    });

    // Ensure the fire-and-forget i18n initialization has settled before reading
    // the active locale.  Without this, the first request after an MV3
    // service-worker wake can resolve display names against the default "en"
    // locale instead of the user's chosen UI language.
    await ensureI18nReady();

    const storage = await getStorage([
        STORAGE_KEYS.API_KEY,
        STORAGE_KEYS.API_ENDPOINT,
        STORAGE_KEYS.API_TYPE,
        STORAGE_KEYS.MODEL_NAME,
        STORAGE_KEYS.PROVIDER_SETTINGS,
        STORAGE_KEYS.SETTINGS_MODE,
        STORAGE_KEYS.BASIC_TARGET_LANGUAGE,
        STORAGE_KEYS.ADVANCED_TARGET_LANGUAGE,
        STORAGE_KEYS.EXTRA_INSTRUCTIONS,
        STORAGE_KEYS.DEBUG_MODE,
        STORAGE_KEYS.REDACTION_MODE,
    ]);
    const debugModeEnabled =
        typeof storage.debugMode === "boolean" ? storage.debugMode : DEBUG_MODE_DEFAULT;

    // Redact sensitive data before it reaches any provider API.
    const redactionMode: RedactionMode = storage.redactionMode || REDACTION_MODE_DEFAULT;
    const preparedInput = prepareTranslationInput(textToTranslate, redactionMode);
    textToTranslate = preparedInput.text;

    const mode = storage.settingsMode || SETTINGS_MODE_BASIC;
    const settings = getEffectiveProviderSettings(storage, mode);

    const {
        apiKey: finalKey,
        apiEndpoint: finalEndpoint,
        apiType: finalType,
        modelName: finalModel,
    } = settings;
    const selectedModelName =
        finalModel ||
        PROVIDER_DEFAULTS[finalType]?.modelName ||
        PROVIDER_DEFAULTS.openai?.modelName;

    let targetLanguageLabel: string;
    let finalInstructions: string;

    if (mode === SETTINGS_MODE_BASIC) {
        const languageValue =
            storage.basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT;
        targetLanguageLabel = getBasicTargetLanguageLabel(
            languageValue,
            getActiveUILocale(),
        );
        settings.apiEndpoint =
            PROVIDER_DEFAULTS[finalType]?.apiEndpoint || settings.apiEndpoint;
        settings.modelName = PROVIDER_DEFAULTS[finalType]?.modelName;
        finalInstructions = buildTranslationInstructionsWithDetection(
            detectedLanguage,
            detectedLanguageName,
            targetLanguageLabel,
            "",
        );
    } else {
        const languageValue =
            storage.advancedTargetLanguage || ADVANCED_TARGET_LANGUAGE_DEFAULT;
        targetLanguageLabel = getBasicTargetLanguageLabel(
            languageValue,
            getActiveUILocale(),
        );
        finalInstructions = buildTranslationInstructionsWithDetection(
            detectedLanguage,
            detectedLanguageName,
            targetLanguageLabel,
            storage.extraInstructions || "",
        );
    }

    const resolvedRequestId = requestId || createRequestId();

    if (debugModeEnabled) {
        console.log("[AI Translator Debug] Translation request (detection)", {
            requestId: resolvedRequestId,
            tabId,
            isFullPage,
            provider: finalType,
            endpoint: finalEndpoint,
            model: selectedModelName,
            detectedLanguage,
            detectedLanguageName,
            targetLanguageLabel,
            textLength: textToTranslate.length,
        });
    }

    if (!finalEndpoint || (!finalKey && finalType !== "ollama")) {
        const errorMsg = t(
            "errorApiKeyOrEndpointNotSet",
            "Translation Error: API Key or Endpoint not set. Please configure in extension settings.",
        );
        console.error(errorMsg);
        const debugInfo = debugModeEnabled
            ? buildDebugErrorDetails(
                  new Error(errorMsg),
                  "settings-validation-detection",
                  {
                      tabId,
                      isFullPage,
                      provider: finalType,
                      endpointConfigured: Boolean(finalEndpoint),
                      hasApiKey: Boolean(finalKey),
                      detectedLanguage,
                      targetLanguageLabel,
                  },
              )
            : null;
        notifyContentScriptWithDetection(
            tabId,
            errorMsg,
            isFullPage,
            true,
            false,
            detectedLanguageName,
            targetLanguageLabel,
            resolvedRequestId,
            debugInfo,
        );
        return;
    }

    if (!isFullPage) {
        notifyContentScriptWithDetection(
            tabId,
            t("contentTranslating", "Translating..."),
            false,
            false,
            true,
            detectedLanguageName,
            targetLanguageLabel,
            resolvedRequestId,
        );

        if (!shouldUseStreamingForSelectedText(finalType, selectedModelName)) {
            translateTextApiCall(
                textToTranslate,
                finalKey,
                finalEndpoint,
                finalType,
                false,
                selectedModelName,
                finalInstructions,
            )
                .then((translation) => {
                    notifyContentScriptWithDetection(
                        tabId,
                        preparedInput.restoreTranslatedOutput(translation),
                        false,
                        false,
                        false,
                        detectedLanguageName,
                        targetLanguageLabel,
                        resolvedRequestId,
                    );
                })
                .catch((error) => {
                    console.error("Translation error:", error);
                    const errorMsg = getTranslationErrorMessage(error);
                    const debugInfo = debugModeEnabled
                        ? buildDebugErrorDetails(
                              error,
                              "selected-translation-detection",
                              {
                                  tabId,
                                  provider: finalType,
                                  model: selectedModelName,
                                  isStreaming: false,
                                  mode,
                                  detectedLanguage,
                                  targetLanguageLabel,
                              },
                          )
                        : null;
                    if (debugModeEnabled) {
                        console.error(
                            "[AI Translator Debug] Selected translation with detection failed",
                            {
                                requestId: resolvedRequestId,
                                debugInfo,
                            },
                        );
                    }
                    notifyContentScriptWithDetection(
                        tabId,
                        errorMsg,
                        false,
                        true,
                        false,
                        detectedLanguageName,
                        targetLanguageLabel,
                        resolvedRequestId,
                        debugInfo,
                    );
                });
            return;
        }

        streamSelectedTranslation(
            tabId,
            resolvedRequestId,
            textToTranslate,
            finalKey,
            finalEndpoint,
            finalType,
            selectedModelName,
            finalInstructions,
            detectedLanguageName,
            targetLanguageLabel,
            preparedInput.restoreTranslatedOutput,
        )
            .then((translation) => {
                if (translation === null) {
                    return;
                }
                notifyContentScriptWithDetection(
                    tabId,
                    translation,
                    false,
                    false,
                    false,
                    detectedLanguageName,
                    targetLanguageLabel,
                    resolvedRequestId,
                );
            })
            .catch(async (error) => {
                if (
                    shouldRetrySelectedTextWithoutStreaming(
                        error,
                        finalType,
                        selectedModelName,
                    )
                ) {
                    console.warn(
                        "Streaming selected translation with detection failed; retrying without streaming.",
                    );
                    try {
                        const fallbackTranslation = await translateTextApiCall(
                            textToTranslate,
                            finalKey,
                            finalEndpoint,
                            finalType,
                            false,
                            selectedModelName,
                            finalInstructions,
                        );
                        notifyContentScriptWithDetection(
                            tabId,
                            preparedInput.restoreTranslatedOutput(fallbackTranslation),
                            false,
                            false,
                            false,
                            detectedLanguageName,
                            targetLanguageLabel,
                            resolvedRequestId,
                        );
                        return;
                    } catch (fallbackError) {
                        console.error(
                            "Selected-text fallback translation with detection error:",
                            fallbackError,
                        );
                        error = fallbackError;
                    }
                }

                console.error("Translation error:", error);
                const errorMsg = getTranslationErrorMessage(error);
                const debugInfo = debugModeEnabled
                    ? buildDebugErrorDetails(
                          error,
                          "selected-translation-stream-detection",
                          {
                              tabId,
                              provider: finalType,
                              model: selectedModelName,
                              isStreaming: true,
                              mode,
                              detectedLanguage,
                              targetLanguageLabel,
                          },
                      )
                    : null;
                if (debugModeEnabled) {
                    console.error(
                        "[AI Translator Debug] Streaming selected translation with detection failed",
                        {
                            requestId: resolvedRequestId,
                            debugInfo,
                        },
                    );
                }
                notifyContentScriptWithDetection(
                    tabId,
                    errorMsg,
                    false,
                    true,
                    false,
                    detectedLanguageName,
                    targetLanguageLabel,
                    resolvedRequestId,
                    debugInfo,
                );
            });
        return;
    }

    console.log("Attempting to call translateTextApiCall with detected language.", {
        detectedLanguageName,
        targetLanguageLabel,
    });

    translateTextApiCall(
        textToTranslate,
        finalKey,
        finalEndpoint,
        finalType,
        isFullPage,
        finalModel,
        finalInstructions,
    )
        .then((translation) => {
            console.log("Translation received (length):", translation.length);
            notifyContentScriptWithDetection(
                tabId,
                preparedInput.restoreTranslatedOutput(translation),
                isFullPage,
                false,
                false,
                detectedLanguageName,
                targetLanguageLabel,
                resolvedRequestId,
            );
        })
        .catch((error) => {
            console.error("Translation error:", error);
            const errorMsg = getTranslationErrorMessage(error);
            const debugInfo = debugModeEnabled
                ? buildDebugErrorDetails(error, "full-page-translation-detection", {
                      tabId,
                      provider: finalType,
                      model: selectedModelName,
                      mode,
                      detectedLanguage,
                      targetLanguageLabel,
                  })
                : null;
            if (debugModeEnabled) {
                console.error(
                    "[AI Translator Debug] Full-page translation with detection failed",
                    {
                        requestId: resolvedRequestId,
                        debugInfo,
                    },
                );
            }
            notifyContentScriptWithDetection(
                tabId,
                errorMsg,
                isFullPage,
                true,
                false,
                detectedLanguageName,
                targetLanguageLabel,
                resolvedRequestId,
                debugInfo,
            );
        });
}

const messageListener: MessageListener = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: SendResponse,
) => {
    if (request.action === "cancelTranslation") {
        if (sender.tab?.id) {
            cancelActiveStream(sender.tab.id, request.requestId);
        }
        sendResponse({ status: "ok" });
        return;
    }

    if (request.action === "getTargetLanguage") {
        getStorage([
            STORAGE_KEYS.SETTINGS_MODE,
            STORAGE_KEYS.BASIC_TARGET_LANGUAGE,
            STORAGE_KEYS.ADVANCED_TARGET_LANGUAGE,
        ])
            .then((settings) => {
                const mode = settings.settingsMode || SETTINGS_MODE_BASIC;
                const targetLanguage =
                    mode === SETTINGS_MODE_BASIC
                        ? settings.basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT
                        : settings.advancedTargetLanguage ||
                          ADVANCED_TARGET_LANGUAGE_DEFAULT;

                sendResponse({ targetLanguage });
            })
            .catch((error) => {
                console.error("Error getting target language:", error);
                sendResponse({ targetLanguage: BASIC_TARGET_LANGUAGE_DEFAULT });
            });
        return true;
    }

    if (request.action === "getTranslationContext") {
        getStorage([
            STORAGE_KEYS.API_KEY,
            STORAGE_KEYS.API_ENDPOINT,
            STORAGE_KEYS.API_TYPE,
            STORAGE_KEYS.MODEL_NAME,
            STORAGE_KEYS.PROVIDER_SETTINGS,
            STORAGE_KEYS.SETTINGS_MODE,
            STORAGE_KEYS.BASIC_TARGET_LANGUAGE,
            STORAGE_KEYS.ADVANCED_TARGET_LANGUAGE,
        ])
            .then((storage) => {
                const mode = storage.settingsMode || SETTINGS_MODE_BASIC;
                const settings = getEffectiveProviderSettings(storage, mode);

                const targetLanguage =
                    mode === SETTINGS_MODE_BASIC
                        ? storage.basicTargetLanguage || BASIC_TARGET_LANGUAGE_DEFAULT
                        : storage.advancedTargetLanguage ||
                          ADVANCED_TARGET_LANGUAGE_DEFAULT;

                sendResponse({
                    provider: settings.apiType,
                    endpoint: settings.apiEndpoint,
                    model: settings.modelName,
                    targetLanguage,
                    translationInstructions: settings.translationInstructions,
                });
            })
            .catch((error) => {
                console.error("Error getting translation context:", error);
                sendResponse({
                    provider: "openai",
                    endpoint: PROVIDER_DEFAULTS.openai?.apiEndpoint,
                    model: PROVIDER_DEFAULTS.openai?.modelName,
                    targetLanguage: BASIC_TARGET_LANGUAGE_DEFAULT,
                    translationInstructions: DEFAULT_TRANSLATION_INSTRUCTIONS,
                });
            });
        return true;
    }

    if (request.action === "translateSelectedHtmlWithDetection") {
        if (!sender.tab?.id) {
            sendResponse({ status: "error", message: "No sender tab ID" });
            return;
        }

        if (!request.html) {
            sendResponse({ status: "error", message: "No HTML provided" });
            return;
        }

        const requestId = createRequestId();
        getSettingsAndTranslateWithDetection(
            request.html,
            sender.tab.id,
            false,
            request.detectedLanguage,
            request.detectedLanguageName,
            requestId,
        );
        sendResponse({ status: "ok" });
        return;
    }

    if (request.action === "translateSelectedHtml") {
        if (!sender.tab?.id) {
            sendResponse({ status: "error", message: "No sender tab ID" });
            return;
        }

        if (!request.html) {
            sendResponse({ status: "error", message: "No HTML provided" });
            return;
        }

        const requestId = createRequestId();
        getSettingsAndTranslate(request.html, sender.tab.id, false, requestId);
        sendResponse({ status: "ok" });
        return;
    }

    if (request.action === "translateHTMLUnits") {
        console.log("Received translateHTMLUnits request:", {
            unitCount: request.units?.length,
        });

        if (
            !request.units ||
            !Array.isArray(request.units) ||
            request.units.length === 0
        ) {
            sendResponse({ status: "error", error: "No units provided" });
            return;
        }

        translateHTMLUnits(request.units, request.targetLanguage)
            .then((results) => {
                console.log("translateHTMLUnits completed, count:", results.length);
                sendResponse({ results });
            })
            .catch((error) => {
                console.error("translateHTMLUnits error:", error);
                sendResponse({ status: "error", error: (error as any).message });
            });

        return true;
    }

    if (request.action === "translateElement") {
        console.log("Received translateElement request:", {
            textLength: request.text?.length,
            elementPath: request.elementPath,
        });

        if (sender.tab?.id) {
            translateElementText(request.text, request.elementPath, sender.tab.id)
                .then((translation) => {
                    console.log(
                        "Element translation completed for:",
                        request.elementPath,
                    );
                    sendResponse({ translatedText: translation });
                })
                .catch((error) => {
                    console.error("Element translation error:", error);
                    sendResponse({
                        status: "error",
                        error: (error as any).message,
                        elementPath: request.elementPath,
                    });
                });
        } else {
            console.error("Could not get sender tab ID for element translation.");
            sendResponse({ status: "error", error: "No sender tab ID" });
        }
        return true;
    }
};

const onConnect = (port: chrome.runtime.Port): void => {
    if (port.name !== HTML_TRANSLATION_PORT_NAME) {
        return;
    }

    let htmlTranslationAbortController: AbortController | null = null;
    let activeRequestId: string | null = null;

    const portMessageListener: PortMessageListener = (
        message: any,
        port: chrome.runtime.Port,
    ) => {
        if (message?.action === "cancelHTMLTranslation") {
            if (
                !message.requestId ||
                !activeRequestId ||
                message.requestId === activeRequestId
            ) {
                htmlTranslationAbortController?.abort();
            }
            return;
        }

        if (message?.action !== "startHTMLTranslation") {
            return;
        }

        const { units, targetLanguage, requestId } = message;

        if (!requestId) {
            port.postMessage({
                action: "htmlTranslationResult",
                error: "Missing request ID",
                done: true,
            });
            return;
        }

        if (!Array.isArray(units) || units.length === 0) {
            port.postMessage({
                action: "htmlTranslationResult",
                requestId,
                error: "No units provided",
                done: true,
            });
            return;
        }

        htmlTranslationAbortController?.abort();
        htmlTranslationAbortController = new AbortController();
        activeRequestId = requestId;
        const signal = htmlTranslationAbortController.signal;

        const postResult = (payload: HtmlTranslationResultPortMessage) => {
            try {
                port.postMessage(payload);
            } catch (error) {
                console.warn("Failed to post HTML translation update:", error);
            }
        };

        const onBatchResults: OnBatchResultsCallback = (batchResults, meta) => {
            postResult({
                action: "htmlTranslationResult",
                requestId,
                results: batchResults,
                batchIndex: meta?.batchIndex,
                batchCount: meta?.batchCount,
                batchSize: meta?.batchSize,
                subBatchIndex: meta?.subBatchIndex,
                subBatchCount: meta?.subBatchCount,
                subBatchSize: meta?.subBatchSize,
                done: false,
            });
        };

        translateHTMLUnits(units, targetLanguage, onBatchResults, signal)
            .then(() => {
                postResult({
                    action: "htmlTranslationResult",
                    requestId,
                    done: true,
                });
            })
            .catch((error) => {
                const cancelled = isAbortError(error) || signal.aborted;
                postResult({
                    action: "htmlTranslationResult",
                    requestId,
                    error: cancelled
                        ? "Translation cancelled."
                        : (error as any)?.message || "Translation failed",
                    cancelled,
                    done: true,
                });
            })
            .finally(() => {
                if (activeRequestId === requestId) {
                    activeRequestId = null;
                    htmlTranslationAbortController = null;
                }
            });
    };

    port.onMessage.addListener(portMessageListener);
    port.onDisconnect.addListener(() => {
        htmlTranslationAbortController?.abort();
        htmlTranslationAbortController = null;
        activeRequestId = null;
    });
};

chrome.runtime.onInstalled.addListener(() => {
    getStorage([
        STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION,
        STORAGE_KEYS.DEBUG_MODE,
        STORAGE_KEYS.UI_THEME,
        STORAGE_KEYS.UI_LANGUAGE,
    ]).then((result) => {
        if (typeof result.showTranslateButtonOnSelection !== "boolean") {
            chrome.storage.sync.set({
                [STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION]: true,
            });
        }

        if (typeof result.debugMode !== "boolean") {
            chrome.storage.sync.set({
                [STORAGE_KEYS.DEBUG_MODE]: DEBUG_MODE_DEFAULT,
            });
        }

        if (
            result.uiTheme !== "light" &&
            result.uiTheme !== "dark" &&
            result.uiTheme !== "system"
        ) {
            chrome.storage.sync.set({
                [STORAGE_KEYS.UI_THEME]: UI_THEME_DEFAULT,
            });
        }

        if (typeof result.uiLanguage !== "string") {
            chrome.storage.sync.set({
                [STORAGE_KEYS.UI_LANGUAGE]: UI_LANGUAGE_DEFAULT,
            });
        }
    });

    void refreshLocalizedContextMenus();
});

chrome.runtime.onStartup?.addListener(() => {
    void refreshLocalizedContextMenus();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[UI_LANGUAGE_STORAGE_KEY]) {
        return;
    }

    void refreshLocalizedContextMenus();
});

chrome.runtime.onMessage.addListener(messageListener);
chrome.runtime.onConnect.addListener(onConnect);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("Context menu item clicked.", info, tab);
    if (!tab || !tab.id) {
        console.error("Cannot get tab ID.");
        return;
    }
    const tabId = tab.id;

    try {
        await ensureContentScriptInjected(tabId);
    } catch (error) {
        console.error("Could not inject content script. Aborting operation.", error);
        return;
    }

    if (info.menuItemId === "translateSelectedText" && info.selectionText) {
        console.log("Action: Translate Selected Text - Getting HTML content");
        chrome.tabs.sendMessage(tabId, { action: "extractSelectedHtml" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(
                    "Error getting selected HTML:",
                    chrome.runtime.lastError.message,
                );
                notifyContentScript(
                    tabId,
                    t(
                        "errorCouldNotExtractSelectedContent",
                        "Could not extract selected content",
                    ),
                    false,
                    true,
                    false,
                );
                return;
            }

            if (response && response.html) {
                console.log("Received selected HTML:", response.html);
                const requestId = createRequestId();
                getSettingsAndTranslate(response.html, tabId, false, requestId);
            } else {
                console.warn(
                    "No HTML content received from content script; falling back to selectionText.",
                );
                const requestId = createRequestId();
                getSettingsAndTranslate(info.selectionText, tabId, false, requestId);
            }
        });
    } else if (info.menuItemId === "translateFullPage") {
        console.log("Action: Translate Full Page requested for tab:", tabId);

        chrome.tabs.sendMessage(
            tabId,
            { action: "startElementTranslation" },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error(
                        "Error starting full page translation:",
                        chrome.runtime.lastError.message,
                    );
                    return;
                }
                console.log("Full page translation started:", response);
            },
        );
    }
});

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});
