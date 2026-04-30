import type {
    CancelHTMLTranslationPortMessage,
    HtmlTranslationResultPortMessage,
    StartHTMLTranslationPortMessage,
} from "./messaging";

export interface HtmlTranslationBatchInfo {
    batchIndex: number;
    batchCount: number;
    batchSize?: number;
    subBatchIndex?: number;
    subBatchCount?: number;
    subBatchSize?: number;
}

export interface StreamTranslationUpdateMessage {
    action: "streamTranslationUpdate";
    requestId?: string;
    text?: string;
    detectedLanguageName?: string | null;
    targetLanguageName?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createHtmlTranslationRequestId(): string {
    return `html-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createStartHTMLTranslationPortMessage(
    requestId: string,
    units: unknown[],
    targetLanguage: string | null,
): StartHTMLTranslationPortMessage {
    return {
        action: "startHTMLTranslation",
        requestId,
        units,
        targetLanguage,
    };
}

export function createCancelHTMLTranslationPortMessage(
    requestId?: string | null,
): CancelHTMLTranslationPortMessage {
    return {
        action: "cancelHTMLTranslation",
        requestId: requestId || undefined,
    };
}

export function createHtmlTranslationResultPortMessage(
    payload: Omit<HtmlTranslationResultPortMessage, "action">,
): HtmlTranslationResultPortMessage {
    return {
        action: "htmlTranslationResult",
        ...payload,
    };
}

export function createStreamTranslationUpdateMessage(
    payload: Omit<StreamTranslationUpdateMessage, "action">,
): StreamTranslationUpdateMessage {
    return {
        action: "streamTranslationUpdate",
        ...payload,
    };
}

export function isStartHTMLTranslationPortMessage(
    message: unknown,
): message is StartHTMLTranslationPortMessage {
    return (
        isRecord(message) &&
        message.action === "startHTMLTranslation" &&
        typeof message.requestId === "string" &&
        Array.isArray(message.units) &&
        (message.targetLanguage === null ||
            typeof message.targetLanguage === "string")
    );
}

export function isCancelHTMLTranslationPortMessage(
    message: unknown,
): message is CancelHTMLTranslationPortMessage {
    return (
        isRecord(message) &&
        message.action === "cancelHTMLTranslation" &&
        (!("requestId" in message) ||
            message.requestId === undefined ||
            typeof message.requestId === "string")
    );
}

export function isHtmlTranslationResultPortMessage(
    message: unknown,
): message is HtmlTranslationResultPortMessage {
    return (
        isRecord(message) &&
        message.action === "htmlTranslationResult" &&
        (!("requestId" in message) ||
            message.requestId === undefined ||
            typeof message.requestId === "string") &&
        (!("results" in message) ||
            message.results === undefined ||
            Array.isArray(message.results))
    );
}

export function getHtmlTranslationBatchInfo(
    message: HtmlTranslationResultPortMessage,
): HtmlTranslationBatchInfo | null {
    if (
        typeof message.batchIndex !== "number" ||
        typeof message.batchCount !== "number"
    ) {
        return null;
    }

    const batchInfo: HtmlTranslationBatchInfo = {
        batchIndex: message.batchIndex,
        batchCount: message.batchCount,
    };

    if (typeof message.batchSize === "number") {
        batchInfo.batchSize = message.batchSize;
    }
    if (
        typeof message.subBatchIndex === "number" &&
        typeof message.subBatchCount === "number"
    ) {
        batchInfo.subBatchIndex = message.subBatchIndex;
        batchInfo.subBatchCount = message.subBatchCount;
        if (typeof message.subBatchSize === "number") {
            batchInfo.subBatchSize = message.subBatchSize;
        }
    }

    return batchInfo;
}

export function isStreamTranslationUpdateMessage(
    message: unknown,
): message is StreamTranslationUpdateMessage {
    return (
        isRecord(message) &&
        message.action === "streamTranslationUpdate" &&
        (!("requestId" in message) ||
            message.requestId === undefined ||
            typeof message.requestId === "string") &&
        (!("text" in message) ||
            message.text === undefined ||
            typeof message.text === "string") &&
        (!("detectedLanguageName" in message) ||
            message.detectedLanguageName === undefined ||
            message.detectedLanguageName === null ||
            typeof message.detectedLanguageName === "string") &&
        (!("targetLanguageName" in message) ||
            message.targetLanguageName === undefined ||
            message.targetLanguageName === null ||
            typeof message.targetLanguageName === "string")
    );
}
