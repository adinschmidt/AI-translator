export interface BaseMessage {
    action: string;
}

import { HTML_TRANSLATION_PORT_NAME, STREAM_PORT_NAME } from "./constants/settings";

export type MessageResponse =
    | {
          status: string;
          message?: string;
          error?: string;
      }
    | {
          text?: string;
          html?: string;
          targetLanguage?: string;
          translatedText?: string;
          results?: unknown[];
          requestId?: string;
          done?: boolean;
          elementPath?: string;
          provider?: string;
          endpoint?: string;
          model?: string;
          translationInstructions?: string;
          batchIndex?: number;
          batchCount?: number;
          batchSize?: number;
          subBatchIndex?: number;
          subBatchCount?: number;
          subBatchSize?: number;
      };

export type MessageSender = chrome.runtime.MessageSender;

export type SendResponse = (response?: MessageResponse) => void;

export type MessageListener = (
    request: unknown,
    sender: MessageSender,
    sendResponse: SendResponse,
) => void | true;

export type PortMessageListener = (message: unknown, port: chrome.runtime.Port) => void;

export interface PortOnMessageEvent {
    name: string;
    disconnect?: () => void;
    onDisconnect: {
        addListener: (callback: () => void) => void;
        removeListener: (callback: () => void) => void;
    };
    onMessage: {
        addListener: (callback: PortMessageListener) => void;
        removeListener: (callback: PortMessageListener) => void;
    };
    postMessage: (message: unknown) => void;
}

export type RuntimeMessage = {
    [key: string]: unknown;
} & BaseMessage;

export interface DisplayTranslationMessage extends BaseMessage {
    action: "displayTranslation";
    text: string;
    requestId?: string;
    isStreaming?: boolean;
    isLoading?: boolean;
    isError?: boolean;
    debugInfo?: string;
    detectedLanguageName?: string;
    targetLanguageName?: string;
}

export interface ExtractSelectedHtmlMessage extends BaseMessage {
    action: "extractSelectedHtml";
}

export interface StartElementTranslationMessage extends BaseMessage {
    action: "startElementTranslation";
    isError?: boolean;
    errorMessage?: string;
    debugInfo?: string;
    translatedHtml?: string;
    requestId?: string;
}

export interface ShowLoadingIndicatorMessage extends BaseMessage {
    action: "showLoadingIndicator";
    isFullPage?: boolean;
}

export interface CancelTranslationMessage extends BaseMessage {
    action: "cancelTranslation";
    requestId: string;
}

export interface GetTargetLanguageMessage extends BaseMessage {
    action: "getTargetLanguage";
}

export interface GetTranslationContextMessage extends BaseMessage {
    action: "getTranslationContext";
}

export interface TranslateSelectedHtmlWithDetectionMessage extends BaseMessage {
    action: "translateSelectedHtmlWithDetection";
    html: string;
    detectedLanguage?: string;
    detectedLanguageName?: string;
}

export interface TranslateSelectedHtmlMessage extends BaseMessage {
    action: "translateSelectedHtml";
    html: string;
}

export type BackgroundToContentMessage =
    | DisplayTranslationMessage
    | ExtractSelectedHtmlMessage
    | StartElementTranslationMessage
    | ShowLoadingIndicatorMessage;

export type ContentToBackgroundMessage =
    | CancelTranslationMessage
    | GetTargetLanguageMessage
    | GetTranslationContextMessage
    | TranslateSelectedHtmlWithDetectionMessage
    | TranslateSelectedHtmlMessage;

export type AnyExtensionMessage = BackgroundToContentMessage | ContentToBackgroundMessage;

export interface StartHTMLTranslationPortMessage {
    action: "startHTMLTranslation";
    units: unknown[];
    targetLanguage: string | null;
    requestId: string;
}

export interface CancelHTMLTranslationPortMessage {
    action: "cancelHTMLTranslation";
    requestId?: string;
}

export interface HtmlTranslationResultPortMessage {
    action: "htmlTranslationResult";
    requestId?: string;
    error?: string;
    cancelled?: boolean;
    results?: unknown[];
    batchIndex?: number;
    batchCount?: number;
    batchSize?: number;
    subBatchIndex?: number;
    subBatchCount?: number;
    subBatchSize?: number;
    done?: boolean;
}

export type PortMessage =
    | StartHTMLTranslationPortMessage
    | CancelHTMLTranslationPortMessage
    | HtmlTranslationResultPortMessage;

export { HTML_TRANSLATION_PORT_NAME, STREAM_PORT_NAME } from "./constants/settings";

export type PortName = typeof HTML_TRANSLATION_PORT_NAME | typeof STREAM_PORT_NAME;
