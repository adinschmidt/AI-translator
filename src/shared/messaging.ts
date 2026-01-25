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
    detectedLanguageName?: string;
    targetLanguageName?: string;
}

export interface GetPageTextMessage extends BaseMessage {
    action: "getPageText";
}

export interface ApplyFullPageTranslationMessage extends BaseMessage {
    action: "applyFullPageTranslation";
    html: string;
}

export interface ExtractSelectedHtmlMessage extends BaseMessage {
    action: "extractSelectedHtml";
}

export interface StartElementTranslationMessage extends BaseMessage {
    action: "startElementTranslation";
    isError?: boolean;
    errorMessage?: string;
    translatedHtml?: string;
    requestId?: string;
}

export interface ShowLoadingIndicatorMessage extends BaseMessage {
    action: "showLoadingIndicator";
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

export interface TranslateElementMessage extends BaseMessage {
    action: "translateElement";
    text: string;
    elementPath: string;
}

export interface TranslateHTMLUnitsMessage extends BaseMessage {
    action: "translateHTMLUnits";
    units: unknown[];
    targetLanguage: string;
}

export type BackgroundToContentMessage =
    | DisplayTranslationMessage
    | GetPageTextMessage
    | ApplyFullPageTranslationMessage
    | ExtractSelectedHtmlMessage
    | StartElementTranslationMessage
    | ShowLoadingIndicatorMessage;

export type ContentToBackgroundMessage =
    | CancelTranslationMessage
    | GetTargetLanguageMessage
    | GetTranslationContextMessage
    | TranslateSelectedHtmlWithDetectionMessage
    | TranslateSelectedHtmlMessage
    | TranslateElementMessage
    | TranslateHTMLUnitsMessage;

export type AnyExtensionMessage = BackgroundToContentMessage | ContentToBackgroundMessage;

export interface StartHTMLTranslationPortMessage {
    action: "startHTMLTranslation";
    units: unknown[];
    targetLanguage: string;
    requestId: string;
}

export interface HtmlTranslationResultPortMessage {
    action: "htmlTranslationResult";
    requestId?: string;
    error?: string;
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
    | HtmlTranslationResultPortMessage;

export { HTML_TRANSLATION_PORT_NAME, STREAM_PORT_NAME } from "./constants/settings";

export type PortName = typeof HTML_TRANSLATION_PORT_NAME | typeof STREAM_PORT_NAME;
