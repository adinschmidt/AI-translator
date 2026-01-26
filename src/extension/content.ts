import {
    STORAGE_KEYS,
    getStorage,
    onStorageChanged,
    type StorageGetResult,
} from "../shared/storage";
import {
    type BackgroundToContentMessage,
    type ContentToBackgroundMessage,
    type MessageListener,
    type PortMessageListener,
    HTML_TRANSLATION_PORT_NAME,
    STREAM_PORT_NAME,
} from "../shared/messaging";

declare global {
    interface Window {
        hasRun?: boolean;
        lastMouseX?: number;
        lastMouseY?: number;
    }

    var DOMPurify: {
        sanitize: (html: string, config: any) => string;
    } | undefined;

    var ELD: {
        detect: (text: string) => {
            language: string;
            isReliable: () => boolean;
        };
    } | undefined;
}

if ((window as any).hasRun) {
    console.log("AI Translator Content Script already loaded - skipping initialization");
} else {
    window.hasRun = true;

    console.log("AI Translator Content Script Loaded - Top Level");

    const SKIP_TAGS = new Set([
        "SCRIPT",
        "STYLE",
        "NOSCRIPT",
        "TEMPLATE",
        "SVG",
        "MATH",
        "CANVAS",
        "VIDEO",
        "AUDIO",
        "IFRAME",
        "OBJECT",
        "EMBED",
    ]);

    const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON"]);

    const BLOCK_LEVEL_TAGS = new Set([
        "P",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "LI",
        "TD",
        "TH",
        "DT",
        "DD",
        "BLOCKQUOTE",
        "FIGCAPTION",
        "CAPTION",
        "SUMMARY",
        "LABEL",
        "LEGEND",
    ]);

    const INLINE_SAFE_TAGS = new Set([
        "A",
        "ABBR",
        "ACRONYM",
        "B",
        "BDI",
        "BDO",
        "BIG",
        "CITE",
        "CODE",
        "DEL",
        "DFN",
        "EM",
        "I",
        "INS",
        "KBD",
        "MARK",
        "Q",
        "S",
        "SAMP",
        "SMALL",
        "SPAN",
        "STRONG",
        "SUB",
        "SUP",
        "TIME",
        "U",
        "VAR",
        "WBR",
        "BR",
    ]);

    const EXTENSION_UI_SELECTORS = [
        "#translation-popup-extension",
        "#translation-loading-indicator",
        "#ai-translator-selection-translate-button",
    ];

    const MAX_HTML_UNIT_CHARS = 12000;
    const CHARS_PER_TOKEN_ESTIMATE = 4;

    const HTML_UNIT_ALLOWED_TAGS = new Set([
        "a",
        "abbr",
        "b",
        "bdi",
        "bdo",
        "br",
        "cite",
        "code",
        "del",
        "dfn",
        "em",
        "i",
        "ins",
        "kbd",
        "mark",
        "q",
        "s",
        "samp",
        "small",
        "span",
        "strong",
        "sub",
        "sup",
        "time",
        "u",
        "var",
        "wbr",
    ]);

    const HTML_UNIT_ALLOWED_ATTRS = new Set(["href", "title", "lang", "dir", "datetime", "cite"]);

    function htmlUnitNeedsSplitting(html: string): boolean {
        return html.length > MAX_HTML_UNIT_CHARS;
    }

    function estimateHTMLTokens(html: string): number {
        if (!html) return 0;
        return Math.ceil(html.length / CHARS_PER_TOKEN_ESTIMATE);
    }

    function getNodeSimplifiedHTML(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || "";
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return "";
        }

        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        if (SKIP_TAGS.has(el.tagName)) {
            return "";
        }

        let childContent = "";
        for (const child of Array.from(el.childNodes)) {
            childContent += getNodeSimplifiedHTML(child);
        }

        if (HTML_UNIT_ALLOWED_TAGS.has(tagName)) {
            const attrs: string[] = [];
            for (const attr of Array.from(el.attributes)) {
                if (HTML_UNIT_ALLOWED_ATTRS.has(attr.name)) {
                    if (attr.name === "href") {
                        const sanitized = sanitizeUnitHref(attr.value);
                        if (sanitized) {
                            attrs.push(`href="${escapeHtmlAttr(sanitized)}"`);
                        }
                    } else {
                        attrs.push(`${attr.name}="${escapeHtmlAttr(attr.value)}"`);
                    }
                }
            }

            if (tagName === "br" || tagName === "wbr") {
                return `<${tagName}${attrs.length ? " " + attrs.join(" ") : ""}>`;
            }

            const attrStr = attrs.length ? " " + attrs.join(" ") : "";
            return `<${tagName}${attrStr}>${childContent}</${tagName}>`;
        }

        return childContent;
    }

    function splitIntoSentences(text: string): string[] {
        const sentences: string[] = [];
        const sentenceEnders = /[.!?]+\s+/g;
        let lastIndex = 0;
        let match;

        while ((match = sentenceEnders.exec(text)) !== null) {
            sentences.push(text.slice(lastIndex, match.index + match[0].length - 1));
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            sentences.push(text.slice(lastIndex));
        }

        return sentences.filter((s) => s.trim().length > 0);
    }

    function splitByWords(text: string, maxChars: number): string[] {
        if (text.length <= maxChars) {
            return [text];
        }

        const words = text.split(/\s+/);
        const chunks: string[] = [];
        let currentChunk = "";

        for (const word of words) {
            if (currentChunk.length + word.length + 1 <= maxChars) {
                currentChunk += (currentChunk ? " " : "") + word;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = word;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    function splitTextNodeContent(text: string, maxChars: number): string[] {
        if (text.length <= maxChars) {
            return [text];
        }

        const chunks: string[] = [];
        const sentences = splitIntoSentences(text);

        if (sentences.length > 1) {
            let currentChunk = "";
            for (const sentence of sentences) {
                if (sentence.length > maxChars) {
                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk);
                        currentChunk = "";
                    }
                    const wordChunks = splitByWords(sentence, maxChars);
                    chunks.push(...wordChunks);
                } else if (currentChunk.length + sentence.length + 1 <= maxChars) {
                    currentChunk += (currentChunk.length > 0 ? " " : "") + sentence;
                } else {
                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk);
                    }
                    currentChunk = sentence;
                }
            }
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            return chunks;
        }

        return splitByWords(text, maxChars);
    }

    interface Chunk {
        html: string;
        nodeIndices: number[];
    }

    function splitHTMLUnitByChildNodes(element: Element, maxChars: number = MAX_HTML_UNIT_CHARS): Chunk[] {
        const childNodes = Array.from(element.childNodes);

        if (childNodes.length === 0) {
            return [{ html: element.textContent || "", nodeIndices: [] }];
        }

        const chunks: Chunk[] = [];
        let currentChunk: { parts: string[]; nodeIndices: number[]; length: number } = {
            parts: [],
            nodeIndices: [],
            length: 0,
        };

        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            const childHTML = getNodeSimplifiedHTML(child);
            const childLength = childHTML.length;

            if (childLength === 0 && child.nodeType !== Node.ELEMENT_NODE) {
                continue;
            }

            if (childLength > maxChars) {
                if (currentChunk.parts.length > 0) {
                    chunks.push({
                        html: currentChunk.parts.join(""),
                        nodeIndices: currentChunk.nodeIndices,
                    });
                    currentChunk = { parts: [], nodeIndices: [], length: 0 };
                }

                if (child.nodeType === Node.TEXT_NODE) {
                    const textChunks = splitTextNodeContent(child.textContent || "", maxChars);
                    for (const textChunk of textChunks) {
                        chunks.push({
                            html: textChunk,
                            nodeIndices: [i],
                        });
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const subChunks = splitHTMLUnitByChildNodes(child as Element, maxChars);
                    for (const subChunk of subChunks) {
                        chunks.push({
                            html: subChunk.html,
                            nodeIndices: [i],
                        });
                    }
                }
                continue;
            }

            if (currentChunk.length + childLength > maxChars && currentChunk.parts.length > 0) {
                chunks.push({
                    html: currentChunk.parts.join(""),
                    nodeIndices: currentChunk.nodeIndices,
                });
                currentChunk = { parts: [], nodeIndices: [], length: 0 };
            }

            currentChunk.parts.push(childHTML);
            currentChunk.nodeIndices.push(i);
            currentChunk.length += childLength;
        }

        if (currentChunk.parts.length > 0) {
            chunks.push({
                html: currentChunk.parts.join(""),
                nodeIndices: currentChunk.nodeIndices,
            });
        }

        return chunks.map((chunk) => ({
            html: chunk.html.replace(/\s+/g, " ").trim(),
            nodeIndices: chunk.nodeIndices,
        }));
    }

    function isHiddenElement(el: Element): boolean {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        if ((el as any).hidden || el.getAttribute("hidden") !== null) {
            return true;
        }
        if (el.getAttribute("aria-hidden") === "true") {
            return true;
        }
        return false;
    }

    function isExtensionUI(el: Element): boolean {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        for (const selector of EXTENSION_UI_SELECTORS) {
            if (el.closest(selector)) {
                return true;
            }
        }
        return false;
    }

    function containsInteractiveControls(el: Element): boolean {
        if (INTERACTIVE_TAGS.has(el.tagName)) {
            return true;
        }
        if (el.getAttribute("role") === "button" || el.getAttribute("contenteditable") === "true" || (el as any).isContentEditable) {
            return true;
        }
        const interactiveDescendant = el.querySelector('button, input, textarea, select, [role="button"], [contenteditable="true"]');
        return interactiveDescendant !== null;
    }

    function containsNestedBlocks(el: Element): boolean {
        for (const child of Array.from(el.children)) {
            if (BLOCK_LEVEL_TAGS.has(child.tagName)) {
                return true;
            }
            if (child.tagName === "DIV" && child.textContent.trim().length > 0) {
                return true;
            }
        }
        return false;
    }

    function isSafeTranslationUnit(el: Element): boolean {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        const isBlockTag = BLOCK_LEVEL_TAGS.has(el.tagName);
        const isDiv = el.tagName === "DIV";

        // Must be either a block-level tag or a DIV
        // DIVs are allowed so we can capture "leaf DIVs" - those without nested block elements
        // This handles cases like <div>Text with <a>links</a></div> that would otherwise be missed
        if (!isBlockTag && !isDiv) {
            return false;
        }

        const textContent = el.textContent?.trim() || "";
        if (textContent.length < 2) {
            return false;
        }

        if (isHiddenElement(el)) {
            return false;
        }

        if (isExtensionUI(el)) {
            return false;
        }

        if (containsInteractiveControls(el)) {
            return false;
        }

        // Both block-level tags and DIVs must not contain nested blocks
        // For DIVs, this ensures we only translate "leaf" DIVs (content containers, not structural)
        if (containsNestedBlocks(el)) {
            return false;
        }

        return true;
    }

    function extractUnitHTML(element: Element): string {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return "";
        }

        const clone = element.cloneNode(true);

        function processNode(node: Node): string {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent || "";
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return "";
            }

            const el = node as Element;
            const tagName = el.tagName.toLowerCase();

            if (SKIP_TAGS.has(el.tagName)) {
                return "";
            }

            let childContent = "";
            for (const child of Array.from(el.childNodes)) {
                childContent += processNode(child);
            }

            if (HTML_UNIT_ALLOWED_TAGS.has(tagName)) {
                const attrs: string[] = [];
                for (const attr of Array.from(el.attributes)) {
                    if (HTML_UNIT_ALLOWED_ATTRS.has(attr.name)) {
                        if (attr.name === "href") {
                            const sanitized = sanitizeUnitHref(attr.value);
                            if (sanitized) {
                                attrs.push(`href="${escapeHtmlAttr(sanitized)}"`);
                            }
                        } else {
                            attrs.push(`${attr.name}="${escapeHtmlAttr(attr.value)}"`);
                        }
                    }
                }

                if (tagName === "br" || tagName === "wbr") {
                    return `<${tagName}${attrs.length ? " " + attrs.join(" ") : ""}>`;
                }

                const attrStr = attrs.length ? " " + attrs.join(" ") : "";
                return `<${tagName}${attrStr}>${childContent}</${tagName}>`;
            }

            return childContent;
        }

        let result = "";
        for (const child of Array.from(clone.childNodes)) {
            result += processNode(child);
        }

        result = result.replace(/\s+/g, " ").trim();

        return result;
    }

    function sanitizeUnitHref(href: string): string | null {
        if (!href || typeof href !== "string") {
            return null;
        }

        const trimmed = href.trim();
        if (trimmed === "") {
            return null;
        }

        const ALLOWED_SCHEMES = ["http:", "https:", "mailto:"];

        try {
            const url = new URL(trimmed, window.location.href);
            if (ALLOWED_SCHEMES.some((scheme) => url.protocol === scheme)) {
                return trimmed;
            }
            return null;
        } catch {
            if (!trimmed.includes(":") || trimmed.startsWith("/")) {
                return trimmed;
            }
            return null;
        }
    }

    function escapeHtmlAttr(value: string): string {
        return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    interface HTMLTranslationUnit {
        element: Element;
        html: string;
        chunkIndex?: number;
        totalChunks?: number;
    }

    function collectHTMLTranslationUnits(): HTMLTranslationUnit[] {
        const units: HTMLTranslationUnit[] = [];
        const seenElements = new WeakSet<Element>();

        function traverse(root: Element): void {
            if (!root || root.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            if (SKIP_TAGS.has(root.tagName)) {
                return;
            }

            if (isHiddenElement(root)) {
                return;
            }

            if (isExtensionUI(root)) {
                return;
            }

            if (isSafeTranslationUnit(root) && !seenElements.has(root)) {
                seenElements.add(root);

                const html = extractUnitHTML(root);

                if (html.length > 0) {
                    if (htmlUnitNeedsSplitting(html)) {
                        const chunks = splitHTMLUnitByChildNodes(root, MAX_HTML_UNIT_CHARS);
                        console.log(`HTML unit split into ${chunks.length} chunks (original: ${html.length} chars)`);
                        for (let i = 0; i < chunks.length; i++) {
                            if (chunks[i].html.length > 0) {
                                units.push({
                                    element: root,
                                    html: chunks[i].html,
                                    chunkIndex: i,
                                    totalChunks: chunks.length,
                                });
                            }
                        }
                    } else {
                        units.push({
                            element: root,
                            html: html,
                        });
                    }
                }

                return;
            }

            for (const child of Array.from(root.children)) {
                traverse(child);
            }
        }

        traverse(document.body);

        console.log(`collectHTMLTranslationUnits: found ${units.length} units`);
        return units;
    }

    const HTML_UNIT_DOMPURIFY_CONFIG = {
        ALLOWED_TAGS: Array.from(HTML_UNIT_ALLOWED_TAGS).map((t) => t.toUpperCase()),
        ALLOWED_ATTR: Array.from(HTML_UNIT_ALLOWED_ATTRS),
        ALLOW_DATA_ATTR: false,
        FORCE_BODY: false,
        RETURN_DOM_FRAGMENT: false,
        SAFE_FOR_TEMPLATES: false,
    };

    function sanitizeTranslatedHTML(html: string): string {
        if (!html || typeof html !== "string") {
            return "";
        }

        if (typeof (window as any).DOMPurify === "undefined") {
            console.warn("sanitizeTranslatedHTML: DOMPurify not available, stripping all HTML");
            const temp = document.createElement("div");
            temp.innerHTML = html;
            return temp.textContent || "";
        }

        const sanitized = (window as any).DOMPurify.sanitize(html, HTML_UNIT_DOMPURIFY_CONFIG);
        return sanitized;
    }

    function applyTranslatedHTML(element: Element, translatedHtml: string): boolean {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            console.warn("applyTranslatedHTML: invalid element");
            return false;
        }

        if (!translatedHtml || typeof translatedHtml !== "string") {
            console.warn("applyTranslatedHTML: empty or invalid translatedHtml");
            return false;
        }

        try {
            const sanitized = sanitizeTranslatedHTML(translatedHtml);

            if (!sanitized || sanitized.trim().length === 0) {
                console.warn("applyTranslatedHTML: sanitization produced empty result");
                return false;
            }

            const temp = document.createElement("template");
            temp.innerHTML = sanitized;
            const fragment = temp.content;

            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }

            element.appendChild(fragment.cloneNode(true));

            console.log(`applyTranslatedHTML: applied ${sanitized.length} chars to ${element.tagName}`);
            return true;
        } catch (error) {
            console.error("applyTranslatedHTML error:", error);
            return false;
        }
    }

    const MAX_TEXT_SAMPLE_FOR_DETECTION = 512;

    const LANGUAGE_NAMES: Record<string, string> = {
        en: "English",
        es: "Spanish",
        fr: "French",
        de: "German",
        it: "Italian",
        pt: "Portuguese",
        ru: "Russian",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
        "zh-CN": "Chinese (Simplified)",
        "zh-TW": "Chinese (Traditional)",
        ar: "Arabic",
        hi: "Hindi",
        nl: "Dutch",
        pl: "Polish",
        tr: "Turkish",
        vi: "Vietnamese",
        th: "Thai",
        sv: "Swedish",
        da: "Danish",
        no: "Norwegian",
        fi: "Finnish",
        cs: "Czech",
        el: "Greek",
        he: "Hebrew",
        hu: "Hungarian",
        id: "Indonesian",
        ms: "Malay",
        ro: "Romanian",
        sk: "Slovak",
        uk: "Ukrainian",
        bg: "Bulgarian",
        hr: "Croatian",
        sr: "Serbian",
        sl: "Slovenian",
        et: "Estonian",
        lv: "Latvian",
        lt: "Lithuanian",
        fa: "Persian",
        bn: "Bengali",
        ta: "Tamil",
        te: "Telugu",
        mr: "Marathi",
        gu: "Gujarati",
        kn: "Kannada",
        ml: "Malayalam",
        pa: "Punjabi",
        ur: "Urdu",
        sw: "Swahili",
        af: "Afrikaans",
        ca: "Catalan",
        gl: "Galician",
        eu: "Basque",
        fil: "Filipino",
        tl: "Tagalog",
    };

    function getLanguageDisplayName(languageCode: string): string {
        if (!languageCode) return "Unknown";
        const normalizedCode = languageCode.toLowerCase().split("-")[0];
        return LANGUAGE_NAMES[languageCode] || LANGUAGE_NAMES[normalizedCode] || languageCode;
    }

    interface LanguageDetectionResult {
        language: string;
        languageName: string;
        isReliable: boolean;
    }

    function detectLanguage(text: string): LanguageDetectionResult | null {
        if (!text || typeof text !== "string") {
            return null;
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            return null;
        }

        const textToAnalyze = trimmedText.length > MAX_TEXT_SAMPLE_FOR_DETECTION ? trimmedText.substring(0, MAX_TEXT_SAMPLE_FOR_DETECTION) : trimmedText;

        try {
            const ELD = (window as any).ELD;
            if (typeof ELD === "undefined" || !ELD.detect) {
                console.error("ELD module not loaded");
                return null;
            }

            const result = ELD.detect(textToAnalyze);

            if (!result || !result.language) {
                return null;
            }

            return {
                language: result.language,
                languageName: getLanguageDisplayName(result.language),
                isReliable: result.isReliable ? result.isReliable() : true,
            };
        } catch (error) {
            console.error("Language detection exception:", error);
            return null;
        }
    }

    window.lastMouseX = 0;
    window.lastMouseY = 0;
    document.addEventListener("mousemove", (e) => {
        window.lastMouseX = e.clientX;
        window.lastMouseY = e.clientY;
    });

    let translationPopup: HTMLElement | null = null;
    let loadingIndicator: HTMLElement | null = null;
    let originalBodyContent: string | null = null;
    let isTranslated = false;
    let stopTranslationFlag = false;

    let activeStreamPort: chrome.runtime.Port | null = null;
    let activeStreamRequestId: string | null = null;
    let completedStreamRequestId: string | null = null;

    const SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY = "showTranslateButtonOnSelection";
    let showTranslateButtonOnSelectionEnabled = true;
    let selectionTranslateButton: HTMLButtonElement | null = null;
    let selectionTranslateInProgress = false;
    let selectionListenerCleanup: (() => void) | null = null;
    let currentDetectedLanguage: string | null = null;
    let currentDetectedLanguageName: string | null = null;

    interface ActiveHtmlTranslation {
        requestId: string;
        port: chrome.runtime.Port;
    }

    let activeHtmlTranslation: ActiveHtmlTranslation | null = null;

    const messageListener: MessageListener = (request: unknown, sender, sendResponse) => {
        console.log("Content Script Received Action:", (request as any).action, request);

        const req = request as BackgroundToContentMessage;

        switch (req.action) {
            case "displayTranslation": {
                const requestId = req.requestId || null;
                const isStreaming = req.isStreaming === true;

                if (requestId) {
                    if (completedStreamRequestId === requestId) {
                        sendResponse({ status: "ignored" });
                        break;
                    }
                    if (activeStreamRequestId && requestId !== activeStreamRequestId) {
                        sendResponse({ status: "ignored" });
                        break;
                    }
                    if (!activeStreamRequestId) {
                        activeStreamRequestId = requestId;
                        completedStreamRequestId = null;
                    }
                }

                if (!req.isLoading && !isStreaming) {
                    removeLoadingIndicator();
                    selectionTranslateInProgress = false;
                    hideSelectionTranslateButton();
                }

                displayPopup(
                    req.text || "",
                    req.isError,
                    req.isLoading,
                    req.detectedLanguageName,
                    req.targetLanguageName,
                    isStreaming,
                );

                if (requestId && !req.isLoading && !isStreaming) {
                    completedStreamRequestId = requestId;
                    activeStreamRequestId = null;
                }

                sendResponse({ status: "Popup displayed/updated" });
                break;
            }

            case "getPageText":
                (function () {
                    const pageHtml = extractMainContentHTML();
                    console.log("Extracted page HTML length:", pageHtml.length);
                    sendResponse({ text: pageHtml });
                })();
                return true;

            case "applyFullPageTranslation":
                if (req.html) {
                    try {
                        const target = document.querySelector("main") || document.body;
                        console.log(
                            "Applying full page translation to target element:",
                            target?.tagName,
                            "Translated HTML length:",
                            req.html.length,
                        );
                        if (target) {
                            setSanitizedContent(target as HTMLElement, req.html);
                        }
                        removeLoadingIndicator();
                        sendResponse({ status: "applied" });
                    } catch (e) {
                        console.error("Error applying full page translation:", e);
                        removeLoadingIndicator();
                        sendResponse({ status: "error", message: (e as Error).message });
                    }
                } else {
                    console.error("applyFullPageTranslation called without html content");
                    removeLoadingIndicator();
                    sendResponse({ status: "error", message: "No HTML provided" });
                }
                break;

            case "extractSelectedHtml":
                const selectedHtml = extractSelectedHtml();
                console.log("Extracted selected HTML:", selectedHtml);
                sendResponse({ html: selectedHtml });
                break;

            case "startElementTranslation":
                removeLoadingIndicator();
                if (req.isError) {
                    displayPopup(`Translation Error: ${req.errorMessage || "Unknown error"}`, true);
                    console.error("Element translation failed:", req.errorMessage);
                } else if (!isTranslated) {
                    console.log("Starting page translation (HTML-preserving).");
                    translatePageV3();
                } else {
                    console.log("Page already translated, skipping translation.");
                }
                sendResponse({ status: "received" });
                break;

            case "elementTranslationResult":
                handleElementTranslationResult(req);
                sendResponse({ status: "received" });
                break;

            case "showLoadingIndicator":
                if (req.isFullPage) {
                    displayLoadingIndicator("Translating page...");
                } else {
                    console.log("Loading indicator request ignored for selected text (popup handles it).");
                }
                sendResponse({ status: "received" });
                break;

            default:
                console.log("Unknown action received:", req.action);
                sendResponse({ status: "unknown action" });
                break;
        }

        return (req.action === "getPageText") as true | void;
    };

    chrome.runtime.onMessage.addListener(messageListener);

    chrome.runtime.onConnect.addListener((port) => {
        if (port.name !== STREAM_PORT_NAME) {
            return;
        }

        activeStreamPort = port;

        const portMessageListener: PortMessageListener = (message, port) => {
            if (message && typeof message === "object" && (message as any).action === "streamTranslationUpdate") {
                handleStreamUpdate(message as any);
            }
        };

        port.onMessage.addListener(portMessageListener);

        port.onDisconnect.addListener(() => {
            if (activeStreamPort === port) {
                activeStreamPort = null;
                activeStreamRequestId = null;
            }
        });
    });

    interface HtmlTranslationOnUpdateMeta {
        batchIndex?: number;
        batchCount?: number;
        batchSize?: number;
        subBatchIndex?: number;
        subBatchCount?: number;
        subBatchSize?: number;
    }

    interface HtmlTranslationResultItem {
        id: string | number;
        translatedHtml: string;
        error?: string;
    }

    function startHtmlTranslation(
        units: HTMLTranslationUnit[],
        targetLanguage: string | null = null,
        onUpdate: ((results: HtmlTranslationResultItem[], batchInfo: HtmlTranslationOnUpdateMeta | null) => void) | null = null,
    ): Promise<HtmlTranslationResultItem[]> {
        return new Promise((resolve, reject) => {
            if (activeHtmlTranslation?.port) {
                try {
                    activeHtmlTranslation.port.disconnect();
                } catch (error) {
                    console.warn("Failed to close previous HTML translation port:", error);
                }
            }

            const requestId = `html-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const port = chrome.runtime.connect({ name: HTML_TRANSLATION_PORT_NAME });
            let settled = false;
            const collectedResults: HtmlTranslationResultItem[] = [];

            const handleResults = (results: HtmlTranslationResultItem[], batchInfo: HtmlTranslationOnUpdateMeta | null = null) => {
                if (!Array.isArray(results) || results.length === 0) {
                    return;
                }
                collectedResults.push(...results);
                if (typeof onUpdate === "function") {
                    try {
                        onUpdate(results, batchInfo);
                    } catch (error) {
                        console.error("HTML translation update handler failed:", error);
                    }
                }
            };

            const finalize = (error: Error | null, results: HtmlTranslationResultItem[] | null) => {
                if (settled) {
                    return;
                }
                settled = true;
                activeHtmlTranslation = null;
                if (error) {
                    reject(error);
                } else {
                    resolve(results || []);
                }
                try {
                    port.disconnect();
                } catch (disconnectError) {
                    console.warn("Failed to disconnect HTML translation port:", disconnectError);
                }
            };

            port.onMessage.addListener((message) => {
                if (message && typeof message === "object" && (message as any).action === "htmlTranslationResult") {
                    const msg = message as any;
                    if (msg.requestId !== requestId) {
                        return;
                    }
                    if (msg.error) {
                        finalize(new Error(msg.error));
                        return;
                    }
                    if (msg.results) {
                        const batchInfo: HtmlTranslationOnUpdateMeta | null =
                            typeof msg.batchIndex === "number" && typeof msg.batchCount === "number"
                                ? {
                                      batchIndex: msg.batchIndex,
                                      batchCount: msg.batchCount,
                                      batchSize: msg.batchSize,
                                  }
                                : null;
                        if (batchInfo && typeof msg.subBatchIndex === "number" && typeof msg.subBatchCount === "number") {
                            batchInfo.subBatchIndex = msg.subBatchIndex;
                            batchInfo.subBatchCount = msg.subBatchCount;
                            batchInfo.subBatchSize = msg.subBatchSize;
                        }
                        handleResults(msg.results, batchInfo);
                    }
                    if (msg.done) {
                        finalize(null, collectedResults);
                    }
                }
            });

            port.onDisconnect.addListener(() => {
                if (!settled) {
                    finalize(new Error("Translation connection closed unexpectedly."));
                }
            });

            activeHtmlTranslation = { requestId, port };
            console.log("startHtmlTranslation: sending request", { requestId, unitCount: units.length });
            port.postMessage({
                action: "startHTMLTranslation",
                requestId,
                units,
                targetLanguage,
            });
        });
    }

    getStorage([STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION])
        .then((result) => {
            const stored = result?.[STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION];
            showTranslateButtonOnSelectionEnabled = typeof stored === "boolean" ? stored : true;
            updateSelectionTranslateButtonState();
        })
        .catch((error) => {
            console.warn("Error reading selection button setting:", error);
            showTranslateButtonOnSelectionEnabled = true;
            updateSelectionTranslateButtonState();
        });

    onStorageChanged((changes, areaName) => {
        if (areaName !== "sync") {
            return;
        }
        if (!changes[STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION]) {
            return;
        }
        const nextValue = changes[STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION].newValue;
        showTranslateButtonOnSelectionEnabled = typeof nextValue === "boolean" ? nextValue : true;
        updateSelectionTranslateButtonState();
    });

    function updateSelectionTranslateButtonState(): void {
        if (showTranslateButtonOnSelectionEnabled) {
            ensureSelectionTranslateButton();
            attachSelectionTranslateListeners();
        } else {
            detachSelectionTranslateListeners();
            hideSelectionTranslateButton();
        }
    }

    function ensureSelectionTranslateButton(): void {
        if (selectionTranslateButton) {
            return;
        }

        selectionTranslateButton = document.createElement("button");
        selectionTranslateButton.id = "ai-translator-selection-translate-button";
        selectionTranslateButton.type = "button";
        selectionTranslateButton.setAttribute("aria-label", "Translate selection");

        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("viewBox", "0 0 24 24");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute(
            "d",
            "M12.87 15.07l-2.54-2.51.03-.03a17.52 17.52 0 003.5-6.53H17V4h-7V2H8v2H1v2h11.17A15.65 15.65 0 019 11.35 15.65 15.65 0 017.33 8H5.26A17.52 17.52 0 008.1 12.5L3 17.57 4.42 19 9.5 13.92l3.11 3.1 0.26-1.95zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z",
        );

        icon.appendChild(path);

        const label = document.createElement("span");
        label.textContent = "Translate";

        selectionTranslateButton.appendChild(icon);
        selectionTranslateButton.appendChild(label);

        selectionTranslateButton.addEventListener("mousedown", (event) => {
            event.preventDefault();
        });

        selectionTranslateButton.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const html = extractSelectedHtml();
            if (!html) {
                hideSelectionTranslateButton();
                return;
            }

            selectionTranslateInProgress = true;
            hideSelectionTranslateButton();
            displayPopup("Translating...", false, true);

            const msg: ContentToBackgroundMessage = {
                action: "translateSelectedHtmlWithDetection",
                html,
                detectedLanguage: currentDetectedLanguage ?? undefined,
                detectedLanguageName: currentDetectedLanguageName ?? undefined,
            };

            chrome.runtime.sendMessage(msg, (response) => {
                if (chrome.runtime.lastError) {
                    selectionTranslateInProgress = false;
                    displayPopup(`Translation Error: ${chrome.runtime.lastError.message}`, true, false);
                    return;
                }

                if (response?.status && response.status !== "ok") {
                    selectionTranslateInProgress = false;
                    displayPopup(`Translation Error: ${response.message || "Unknown error"}`, true, false);
                }
            });
        });

        document.body.appendChild(selectionTranslateButton);
    }

    function attachSelectionTranslateListeners(): void {
        if (selectionListenerCleanup) {
            return;
        }

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const onSelectionMaybeChanged = () => {
            if (!showTranslateButtonOnSelectionEnabled) {
                return;
            }

            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            debounceTimer = setTimeout(() => {
                updateSelectionTranslateButtonPosition();
            }, 120);
        };

        const onResize = () => {
            hideSelectionTranslateButton();
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                hideSelectionTranslateButton();
            }
        };

        const onDocumentMouseDown = (event: MouseEvent) => {
            if (selectionTranslateButton && selectionTranslateButton.contains(event.target as Node)) {
                return;
            }

            if (translationPopup && translationPopup.contains(event.target as Node)) {
                return;
            }

            hideSelectionTranslateButton();
        };

        document.addEventListener("selectionchange", onSelectionMaybeChanged, true);
        document.addEventListener("mouseup", onSelectionMaybeChanged, true);
        window.addEventListener("resize", onResize, true);
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("mousedown", onDocumentMouseDown, true);

        selectionListenerCleanup = () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
            document.removeEventListener("selectionchange", onSelectionMaybeChanged, true);
            document.removeEventListener("mouseup", onSelectionMaybeChanged, true);
            window.removeEventListener("resize", onResize, true);
            document.removeEventListener("keydown", onKeyDown, true);
            document.removeEventListener("mousedown", onDocumentMouseDown, true);
        };
    }

    function detachSelectionTranslateListeners(): void {
        if (!selectionListenerCleanup) {
            return;
        }
        selectionListenerCleanup();
        selectionListenerCleanup = null;
    }

    function hideSelectionTranslateButton(): void {
        if (!selectionTranslateButton) {
            return;
        }
        selectionTranslateButton.style.display = "none";
    }

    function updateSelectionTranslateButtonPosition(): void {
        if (!selectionTranslateButton) {
            return;
        }

        if (selectionTranslateInProgress) {
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            hideSelectionTranslateButton();
            return;
        }

        const selectedText = (selection.toString() || "").trim();
        if (selectedText.length === 0) {
            hideSelectionTranslateButton();
            return;
        }

        const selectionContainerEl = selection.anchorNode
            ? selection.anchorNode.nodeType === Node.ELEMENT_NODE
                ? selection.anchorNode as Element
                : selection.anchorNode.parentElement
            : null;

        if (
            selectionContainerEl &&
            (selectionContainerEl.closest("#translation-popup-extension") ||
                selectionContainerEl.closest("#translation-loading-indicator") ||
                selectionContainerEl.closest("#ai-translator-selection-translate-button"))
        ) {
            hideSelectionTranslateButton();
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) {
            hideSelectionTranslateButton();
            return;
        }

        detectAndShowButton(selectedText, rect);
    }

    function detectAndShowButton(text: string, rect: DOMRect): void {
        currentDetectedLanguage = null;
        currentDetectedLanguageName = null;

        const detectionResult = detectLanguage(text);

        if (!detectionResult) {
            console.log("Language detection failed or unavailable, not showing button");
            hideSelectionTranslateButton();
            return;
        }

        const msg: ContentToBackgroundMessage = { action: "getTargetLanguage" };
        chrome.runtime.sendMessage(msg, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Failed to get target language:", chrome.runtime.lastError.message);
                hideSelectionTranslateButton();
                return;
            }

            const targetLanguage = response?.targetLanguage || "en";

            const detectedNormalized = detectionResult.language.toLowerCase().split("-")[0];
            const targetNormalized = targetLanguage.toLowerCase().split("-")[0];
            const isSameLanguage = detectedNormalized === targetNormalized;

            if (isSameLanguage) {
                console.log("Detected language matches target language, not showing button");
                hideSelectionTranslateButton();
                return;
            }

            if (selectionTranslateInProgress) {
                return;
            }

            currentDetectedLanguage = detectionResult.language;
            currentDetectedLanguageName = detectionResult.languageName;

            showButtonAtPosition(rect, currentDetectedLanguageName);
        });
    }

    function showButtonAtPosition(rect: DOMRect, languageName: string | null): void {
        if (!selectionTranslateButton) {
            return;
        }

        if (selectionTranslateInProgress) {
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            return;
        }

        const margin = 8;

        selectionTranslateButton.style.visibility = "hidden";
        selectionTranslateButton.style.display = "inline-flex";

        const top = window.scrollY + rect.bottom + margin;

        let left = window.scrollX + rect.left;
        const buttonWidth = selectionTranslateButton.offsetWidth || 100;
        const maxLeft = window.scrollX + window.innerWidth - buttonWidth - margin;
        left = Math.min(Math.max(left, window.scrollX + margin), maxLeft);

        selectionTranslateButton.style.top = `${top}px`;
        selectionTranslateButton.style.left = `${left}px`;

        updateButtonLabel(languageName);

        selectionTranslateButton.style.visibility = "visible";
    }

    function updateButtonLabel(languageName: string | null): void {
        if (!selectionTranslateButton) {
            return;
        }

        const labelSpan = selectionTranslateButton.querySelector("span");
        if (!labelSpan) {
            return;
        }

        if (languageName) {
            labelSpan.textContent = `Translate from ${languageName}`;
        } else {
            labelSpan.textContent = "Translate";
        }
    }

    function extractSelectedHtml(): string | null {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return null;

        const fragment = range.cloneContents();

        const tempDiv = document.createElement("div");
        tempDiv.appendChild(fragment);

        return simplifyHtmlForTranslation(tempDiv.innerHTML);
    }

    function simplifyHtmlForTranslation(html: string): string {
        if (!html || typeof html !== "string") {
            return html;
        }

        const KEEP_TAGS = new Set([
            "b",
            "strong",
            "i",
            "em",
            "u",
            "s",
            "strike",
            "mark",
            "sub",
            "sup",
            "p",
            "br",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "ul",
            "ol",
            "li",
            "a",
            "pre",
            "code",
            "blockquote",
            "table",
            "thead",
            "tbody",
            "tfoot",
            "tr",
            "td",
            "th",
        ]);

        const UNWRAP_TAGS = new Set([
            "span",
            "section",
            "article",
            "aside",
            "main",
            "nav",
            "header",
            "footer",
            "figure",
            "figcaption",
            "details",
            "summary",
        ]);

        const REMOVE_TAGS = new Set([
            "img",
            "video",
            "audio",
            "iframe",
            "canvas",
            "svg",
            "object",
            "embed",
            "button",
            "input",
            "select",
            "textarea",
            "form",
            "link",
            "meta",
            "script",
            "style",
            "noscript",
        ]);

        const ALLOWED_SCHEMES = ["http:", "https:", "mailto:"];

        const root = document.createElement("div");
        root.innerHTML = html;

        REMOVE_TAGS.forEach((tag) => {
            root.querySelectorAll(tag).forEach((el) => el.remove());
        });

        const divs = Array.from(root.querySelectorAll("div"));
        for (const div of divs) {
            if (div.textContent.trim() !== "") {
                const p = document.createElement("p");
                while (div.firstChild) {
                    p.appendChild(div.firstChild);
                }
                div.parentNode?.replaceChild(p, div);
            } else {
                div.remove();
            }
        }

        function processNode(node: Node): void {
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            const el = node as Element;
            Array.from(el.children).forEach((child) => processNode(child));

            const tagName = el.tagName.toLowerCase();

            if (KEEP_TAGS.has(tagName)) {
                const attrs = Array.from(el.attributes);
                for (const attr of attrs) {
                    if (tagName === "a" && attr.name === "href") {
                        const sanitizedHref = sanitizeHref(attr.value);
                        if (sanitizedHref) {
                            el.setAttribute("href", sanitizedHref);
                        } else {
                            el.removeAttribute("href");
                        }
                    } else {
                        el.removeAttribute(attr.name);
                    }
                }
            } else if (UNWRAP_TAGS.has(tagName) || !KEEP_TAGS.has(tagName)) {
                unwrapElement(el);
            }
        }

        function sanitizeHref(href: string): string | null {
            if (!href || typeof href !== "string") {
                return null;
            }

            const trimmed = href.trim();
            if (trimmed === "") {
                return null;
            }

            try {
                const url = new URL(trimmed, window.location.href);
                if (ALLOWED_SCHEMES.some((scheme) => url.protocol === scheme)) {
                    return trimmed;
                }
                return null;
            } catch {
                if (!trimmed.includes(":") || trimmed.startsWith("/")) {
                    return trimmed;
                }
                return null;
            }
        }

        function unwrapElement(element: Element): void {
            const parent = element.parentNode;
            if (!parent) {
                return;
            }

            while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
        }

        Array.from(root.children).forEach((child) => processNode(child));

        return root.innerHTML;
    }

    function extractMainContentHTML(): string {
        const mainElement = document.querySelector("main") || document.body;
        const clonedBody = mainElement?.cloneNode(true) as Element;

        clonedBody
            .querySelectorAll('script, style, nav, header, footer, aside, form, button, input, textarea, select, [aria-hidden="true"], noscript')
            .forEach((el) => el.remove());

        return clonedBody.innerHTML;
    }

    function getTranslatableElements(): Array<{ element: Element; text: string; path: string }> {
        const elements: Array<{ element: Element; text: string; path: string }> = [];

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function (node: Node) {
                    const el = node as Element;
                    if (
                        el.parentElement &&
                        ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.parentElement.tagName)
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (
                        el.closest("#translation-popup-extension") ||
                        el.closest("#translation-loading-indicator")
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(el.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    const textContent = el.textContent?.trim() || "";
                    if (textContent.length > 3) {
                        return NodeFilter.FILTER_ACCEPT;
                    }

                    return NodeFilter.FILTER_REJECT;
                },
            },
            false,
        );

        let node;
        while ((node = walker.nextNode())) {
            elements.push({
                element: node as Element,
                text: extractPlainText(node as Element),
                path: getElementPath(node as Element),
            });
        }

        return elements;
    }

    function extractPlainText(element: Element): string {
        return element.textContent.trim();
    }

    function getElementPath(element: Element): string {
        if (element === document.body) return "body";

        const parts: string[] = [];
        while (element && element !== document.body) {
            const part = element.tagName.toLowerCase();
            const index = Array.from(element.parentNode?.children || []).indexOf(element) + 1;
            parts.unshift(`${part}:nth-child(${index})`);
            element = element.parentElement!;
        }
        return parts.join(" > ");
    }

    function findElementByPath(path: string): Element | null {
        try {
            if (path.includes(" > ")) {
                const parts = path.split(" > ");
                let element: Element = document.body;

                for (const part of parts) {
                    const [tag, nthChild] = part.split(":nth-child(");
                    const index = parseInt(nthChild.replace(")", "")) - 1;
                    const children = Array.from(element.children);
                    element = children[index];
                    if (!element || element.tagName.toLowerCase() !== tag) {
                        return null;
                    }
                }
                return element;
            }

            if (path === "body") {
                return document.body;
            }

            return null;
        } catch (error) {
            console.warn("Error finding element by path:", error);
            return null;
        }
    }

    async function translatePageElements(): Promise<void> {
        console.log("Starting element-by-element page translation...");

        stopTranslationFlag = false;

        const elements = getTranslatableElements();
        console.log(`Found ${elements.length} translatable elements`);

        if (elements.length === 0) {
            console.log("No translatable elements found");
            return;
        }

        displayLoadingIndicator(`Translating ${elements.length} elements...`);

        const batchSize = 3;
        const batches = [];
        for (let i = 0; i < elements.length; i += batchSize) {
            batches.push(elements.slice(i, i + batchSize));
        }

        let completed = 0;
        let errorCount = 0;

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            if (stopTranslationFlag) {
                console.log("Translation stopped by user.");
                removeLoadingIndicator();
                displayPopup("Translation stopped by user.", true, false);
                return;
            }

            const batch = batches[batchIndex];

            await Promise.all(
                batch.map(async (item) => {
                    if (stopTranslationFlag) {
                        return;
                    }

                    try {
                        await translateElement(item);
                        completed++;
                    } catch (error) {
                        console.error("Element translation error:", error);
                        errorCount++;
                        markElementTranslationError(item.element, error as Error);
                    }

                    updateLoadingProgress(completed, elements.length, errorCount);
                }),
            );

            console.log(`Completed batch ${batchIndex + 1}/${batches.length}`);
        }

        console.log(`Translation complete. ${completed} elements translated, ${errorCount} errors.`);

        setTimeout(() => removeLoadingIndicator(), 1000);
    }

    function getChunkProgressMessage(
        translatedChunks: number,
        totalChunks: number,
        errorCount: number,
        batchInfo: HtmlTranslationOnUpdateMeta | null = null,
    ): string {
        const errorSuffix = errorCount > 0 ? ` (${errorCount} errors)` : "";
        let batchPrefix = "";
        if (batchInfo && typeof batchInfo.batchIndex === "number" && typeof batchInfo.batchCount === "number") {
            batchPrefix = `Batch ${batchInfo.batchIndex}/${batchInfo.batchCount}`;
            if (typeof batchInfo.subBatchIndex === "number" && typeof batchInfo.subBatchCount === "number") {
                batchPrefix += ` part ${batchInfo.subBatchIndex}/${batchInfo.subBatchCount}`;
            }
            batchPrefix += " - ";
        }
        return `${batchPrefix}Translated ${translatedChunks}/${totalChunks} chunks${errorSuffix}`;
    }

    async function translatePageV3(): Promise<void> {
        console.log("Starting translatePageV3 (HTML-preserving)...");

        stopTranslationFlag = false;

        displayLoadingIndicatorState("Preparing...", "preparing");
        const units = collectHTMLTranslationUnits();
        const totalChunks = units.length;

        if (units.length === 0) {
            console.log("No HTML translation units found");
            displayLoadingIndicatorState("No translatable content found", "done");
            setTimeout(() => removeLoadingIndicator(), 60000);
            return;
        }

        console.log(`Found ${units.length} HTML translation units`);

        const unitsForTranslation = units.map((unit, index) => ({
            id: index,
            html: unit.html,
        }));

        displayLoadingIndicatorState(`Translating ${totalChunks} chunks...`, "translating", {
            current: 0,
            total: totalChunks,
        });

        const elementChunks = new Map<Element, any>();
        for (const unit of units) {
            const total = unit.totalChunks || 1;
            let entry = elementChunks.get(unit.element);
            if (!entry) {
                entry = {
                    chunks: new Map<number, HtmlTranslationResultItem>(),
                    totalChunks: total,
                    translatedChunkIndices: new Set<number>(),
                    applied: false,
                    hasError: false,
                };
                elementChunks.set(unit.element, entry);
            } else {
                entry.totalChunks = Math.max(entry.totalChunks, total);
            }
        }

        let successCount = 0;
        let errorCount = 0;
        let translatedChunks = 0;
        let receivedResults = 0;
        let latestBatchInfo: HtmlTranslationOnUpdateMeta | null = null;

        const updateChunkProgress = () => {
            displayLoadingIndicatorState(
                getChunkProgressMessage(translatedChunks, totalChunks, errorCount, latestBatchInfo),
                "translating",
                {
                    current: translatedChunks,
                    total: totalChunks,
                },
            );
        };

        const markElementError = (element: Element, entry: any, message: string, logMessage?: string) => {
            if (entry.hasError) {
                return;
            }
            entry.hasError = true;
            errorCount++;
            if (logMessage) {
                console.warn(logMessage);
            }
            markElementTranslationError(element, new Error(message));
        };

        const applyElementIfReady = (element: Element, entry: any) => {
            if (entry.applied || entry.hasError) {
                return;
            }
            if (entry.chunks.size < entry.totalChunks) {
                return;
            }

            const orderedChunks = Array.from(entry.chunks.entries())
                .sort((a: any, b: any) => a[0] - b[0])
                .map(([, chunk]: any) => chunk);
            const errorChunk = orderedChunks.find((chunk: any) => chunk.error);
            if (errorChunk) {
                markElementError(
                    element,
                    entry,
                    errorChunk.error || "Chunk translation error",
                    `translatePageV3: element has chunk error: ${errorChunk.error}`,
                );
                return;
            }

            const missingChunk = orderedChunks.find((chunk: any) => !chunk.translatedHtml || !chunk.translatedHtml.trim());
            if (missingChunk) {
                markElementError(
                    element,
                    entry,
                    "Missing chunk translation",
                    "translatePageV3: element has missing chunk translation",
                );
                return;
            }

            const combinedHtml = orderedChunks.map((chunk: any) => chunk.translatedHtml).join(" ");

            if (!combinedHtml.trim()) {
                markElementError(
                    element,
                    entry,
                    "Empty combined translation",
                    "translatePageV3: element has empty combined translation",
                );
                return;
            }

            const applied = applyTranslatedHTML(element, combinedHtml);
            if (applied) {
                successCount++;
                entry.applied = true;
                return;
            }

            const plainText = combinedHtml.replace(/<[^>]*>/g, "");
            if (plainText.trim()) {
                element.textContent = plainText.trim();
                successCount++;
                entry.applied = true;
                return;
            }

            markElementError(element, entry, "Empty translated content");
        };

        const handleTranslationResults = (results: HtmlTranslationResultItem[], batchInfo: HtmlTranslationOnUpdateMeta | null = null) => {
            if (!Array.isArray(results) || results.length === 0) {
                return;
            }

            if (batchInfo?.batchIndex && batchInfo?.batchCount) {
                latestBatchInfo = batchInfo;
                const batchSizeLabel = typeof batchInfo.batchSize === "number" ? `, ${batchInfo.batchSize} units` : "";
                const subBatchLabel =
                    typeof batchInfo.subBatchIndex === "number" && typeof batchInfo.subBatchCount === "number"
                        ? ` part ${batchInfo.subBatchIndex}/${batchInfo.subBatchCount}`
                        : "";
                console.log(
                    `translatePageV3: received batch ${batchInfo.batchIndex}/${batchInfo.batchCount}${subBatchLabel} (${results.length} results${batchSizeLabel})`,
                );
            } else {
                console.log(`translatePageV3: received ${results.length} translation results`);
            }

            receivedResults += results.length;

            for (const result of results) {
                const unit = units[result.id as number];
                if (!unit) {
                    console.warn(`translatePageV3: no unit found for id ${result.id}`);
                    continue;
                }

                const entry = elementChunks.get(unit.element);
                if (!entry) {
                    continue;
                }

                const chunkIndex = unit.chunkIndex ?? 0;
                const translatedHtml = typeof result.translatedHtml === "string" ? result.translatedHtml : "";
                const hasTranslation = translatedHtml.trim().length > 0;

                if (hasTranslation && !entry.translatedChunkIndices.has(chunkIndex)) {
                    entry.translatedChunkIndices.add(chunkIndex);
                    translatedChunks++;
                }

                entry.chunks.set(chunkIndex, {
                    translatedHtml,
                    error: result.error,
                });

                if (result.error) {
                    markElementError(
                        unit.element,
                        entry,
                        result.error || "Chunk translation error",
                        `translatePageV3: element has chunk error: ${result.error}`,
                    );
                }

                if (!entry.hasError) {
                    applyElementIfReady(unit.element, entry);
                }
            }

            updateChunkProgress();
        };

        const finalizeTranslation = () => {
            for (const [element, entry] of elementChunks) {
                if (entry.applied || entry.hasError) {
                    continue;
                }
                if (entry.chunks.size < entry.totalChunks) {
                    markElementError(
                        element,
                        entry,
                        "Missing chunk translation",
                        "translatePageV3: element missing chunk results",
                    );
                    continue;
                }
                applyElementIfReady(element, entry);
            }

            const summary =
                errorCount > 0 ? `Done. ${successCount} translated, ${errorCount} errors` : `Done. ${successCount} translated`;
            const summaryState = errorCount > 0 ? "error" : "done";
            displayLoadingIndicatorState(summary, summaryState, {
                current: translatedChunks,
                total: totalChunks,
            });

            isTranslated = true;
            setTimeout(() => removeLoadingIndicator(), 60000);
        };

        try {
            await startHtmlTranslation(unitsForTranslation, null, handleTranslationResults);
            console.log(`translatePageV3: received ${receivedResults} translation results`);
            finalizeTranslation();
        } catch (error) {
            console.error("translatePageV3 error:", error);
            displayLoadingIndicatorState(`Error: ${(error as Error).message}`, "error", {
                current: 0,
                total: totalChunks,
            });
            setTimeout(() => removeLoadingIndicator(), 60000);
        }
    }

    function stopTranslation(): void {
        stopTranslationFlag = true;
        console.log("Translation stopped");
    }

    type LoadingIndicatorState = "preparing" | "translating" | "done" | "stopped" | "error";

    interface LoadingProgress {
        current: number;
        total: number;
    }

    function displayLoadingIndicatorState(message: string, state: LoadingIndicatorState = "translating", progress: LoadingProgress | null = null): void {
        removeLoadingIndicator();

        loadingIndicator = document.createElement("div");
        loadingIndicator.id = "translation-loading-indicator";

        const stateIcon = document.createElement("span");
        stateIcon.className = "state-icon";

        const progressText = document.createElement("span");
        progressText.className = "progress-text";
        progressText.textContent = message;

        const stopButtonEl = document.createElement("button");
        stopButtonEl.className = "stop-button";
        stopButtonEl.textContent = "Stop";
        stopButtonEl.style.display = state === "translating" ? "inline-block" : "none";

        const textWrapper = document.createElement("div");
        textWrapper.style.display = "flex";
        textWrapper.style.flexDirection = "column";
        textWrapper.style.gap = "6px";
        textWrapper.style.alignItems = "flex-start";
        textWrapper.appendChild(progressText);

        if (progress && typeof progress.current === "number" && typeof progress.total === "number") {
            const progressBar = document.createElement("div");
            const progressFill = document.createElement("div");
            const ratio = progress.total > 0 ? progress.current / progress.total : 0;
            const clamped = Math.max(0, Math.min(1, ratio));
            progressBar.style.width = "160px";
            progressBar.style.height = "6px";
            progressBar.style.backgroundColor = "rgba(255,255,255,0.3)";
            progressBar.style.borderRadius = "999px";
            progressBar.style.overflow = "hidden";
            progressFill.style.width = `${Math.round(clamped * 100)}%`;
            progressFill.style.height = "100%";
            progressFill.style.backgroundColor = "rgba(255,255,255,0.9)";
            progressFill.style.transition = "width 0.2s ease";
            progressBar.appendChild(progressFill);
            textWrapper.appendChild(progressBar);
        }

        loadingIndicator.appendChild(stateIcon);
        loadingIndicator.appendChild(textWrapper);
        loadingIndicator.appendChild(stopButtonEl);

        const stateColors: Record<LoadingIndicatorState, { bg: string; icon: string }> = {
            preparing: { bg: "rgba(59, 130, 246, 0.9)", icon: "..." },
            translating: { bg: "rgba(16, 185, 129, 0.9)", icon: "..." },
            done: { bg: "rgba(34, 197, 94, 0.9)", icon: "check" },
            stopped: { bg: "rgba(251, 191, 36, 0.9)", icon: "pause" },
            error: { bg: "rgba(239, 68, 68, 0.9)", icon: "x" },
        };

        const stateConfig = stateColors[state] || stateColors.translating;

        loadingIndicator.style.position = "fixed";
        loadingIndicator.style.bottom = "20px";
        loadingIndicator.style.left = "20px";
        loadingIndicator.style.backgroundColor = stateConfig.bg;
        loadingIndicator.style.color = "white";
        loadingIndicator.style.padding = "10px 15px";
        loadingIndicator.style.borderRadius = "8px";
        loadingIndicator.style.zIndex = "2147483647";
        loadingIndicator.style.fontSize = "14px";
        loadingIndicator.style.fontFamily = "system-ui, -apple-system, sans-serif";
        loadingIndicator.style.display = "flex";
        loadingIndicator.style.alignItems = "center";
        loadingIndicator.style.gap = "12px";
        loadingIndicator.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";

        stateIcon.textContent =
            stateConfig.icon === "..."
                ? ""
                : stateConfig.icon === "check"
                  ? "✓"
                  : stateConfig.icon === "pause"
                    ? "⏸"
                    : "✗";
        stateIcon.style.fontSize = "16px";

        stopButtonEl.style.backgroundColor = "rgba(255,255,255,0.2)";
        stopButtonEl.style.color = "white";
        stopButtonEl.style.border = "1px solid rgba(255,255,255,0.4)";
        stopButtonEl.style.padding = "4px 12px";
        stopButtonEl.style.borderRadius = "4px";
        stopButtonEl.style.cursor = "pointer";
        stopButtonEl.style.fontSize = "12px";
        stopButtonEl.style.fontWeight = "500";
        stopButtonEl.onmouseover = () => {
            stopButtonEl.style.backgroundColor = "rgba(255,255,255,0.3)";
        };
        stopButtonEl.onmouseout = () => {
            stopButtonEl.style.backgroundColor = "rgba(255,255,255,0.2)";
        };
        stopButtonEl.onclick = stopTranslation;

        document.body.appendChild(loadingIndicator);
    }

    function markElementTranslationError(element: Element, error: Error): void {
        try {
            const marker = document.createElement("span");
            marker.textContent = " [translation error]";
            marker.title = error && error.message ? error.message : "Translation failed";
            marker.style.color = "#ef4444";
            marker.style.fontSize = "0.75em";
            marker.style.marginLeft = "4px";
            marker.style.fontStyle = "italic";
            marker.style.opacity = "0.9";
            marker.style.pointerEvents = "auto";
            element.appendChild(marker);
        } catch (e) {
            console.error("Failed to mark element translation error:", e);
        }
    }

    async function translateElement(elementData: { element: Element; text: string; path: string }): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                {
                    action: "translateElement",
                    text: elementData.text,
                    elementPath: elementData.path,
                } as ContentToBackgroundMessage,
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }

                    if (response && response.translatedText) {
                        updateElementTextInline(
                            elementData.element,
                            elementData.text,
                            response.translatedText as string,
                        );
                        resolve();
                    } else {
                        reject(new Error("No translation received"));
                    }
                },
            );
        });
    }

    function updateElementTextInline(element: Element, originalText: string, translatedText: string): void {
        try {
            console.log(`Updating element ${element.tagName} with inline text replacement`);
            console.log(`Original: "${originalText.substring(0, 50)}..."`);
            console.log(`Translated: "${translatedText.substring(0, 50)}..."`);

            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node: Node) {
                        if (!node.nodeValue?.trim()) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    },
                },
                false,
            );

            let textNode;
            const textNodes: Text[] = [];
            while ((textNode = walker.nextNode())) {
                textNodes.push(textNode as Text);
            }

            if (textNodes.length === 0) {
                console.warn("No text nodes found in element");
                return;
            }

            const firstTextNode = textNodes[0];
            firstTextNode.nodeValue = translatedText;

            console.log(`Successfully updated text in element: ${element.tagName}`);
        } catch (error) {
            console.error("Error updating element text inline:", error);
        }
    }

    function handleElementTranslationResult(req: BackgroundToContentMessage): void {
        if ((req as any).error) {
            console.error("Element translation error:", (req as any).error);
            return;
        }

        if ((req as any).translatedText && (req as any).elementPath) {
            const element = findElementByPath((req as any).elementPath);
            if (element) {
                updateElementTextInline(element, (req as any).originalText, (req as any).translatedText);
                console.log(`Updated element at path ${(req as any).elementPath}`);
            } else {
                console.warn(`Could not find element at path: ${(req as any).elementPath}`);
            }
        }
    }

    function updateLoadingProgress(completed: number, total: number, errors: number): void {
        if (loadingIndicator) {
            const progress = Math.round((completed / total) * 100);
            const errorText = errors > 0 ? ` (${errors} errors)` : "";
            const progressText = loadingIndicator.querySelector(".progress-text") as HTMLElement;
            if (progressText) {
                progressText.textContent = `Translating elements... ${completed}/${total} (${progress}%)${errorText}`;
            }
        }
    }

    function displayLoadingIndicator(message: string = "Loading..."): void {
        removeLoadingIndicator();

        loadingIndicator = document.createElement("div");
        loadingIndicator.id = "translation-loading-indicator";

        const progressText = document.createElement("span");
        progressText.className = "progress-text";
        progressText.textContent = message;

        const stopButtonEl = document.createElement("button");
        stopButtonEl.className = "stop-button";
        stopButtonEl.textContent = "Stop";

        loadingIndicator.appendChild(progressText);
        loadingIndicator.appendChild(stopButtonEl);

        loadingIndicator.style.position = "fixed";
        loadingIndicator.style.bottom = "20px";
        loadingIndicator.style.left = "20px";
        loadingIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        loadingIndicator.style.color = "white";
        loadingIndicator.style.padding = "10px 15px";
        loadingIndicator.style.borderRadius = "5px";
        loadingIndicator.style.zIndex = "2147483647";
        loadingIndicator.style.fontSize = "14px";
        loadingIndicator.style.fontFamily = "sans-serif";
        loadingIndicator.style.display = "flex";
        loadingIndicator.style.alignItems = "center";
        loadingIndicator.style.gap = "10px";

        stopButtonEl.style.backgroundColor = "#ff4444";
        stopButtonEl.style.color = "white";
        stopButtonEl.style.border = "none";
        stopButtonEl.style.padding = "5px 10px";
        stopButtonEl.style.borderRadius = "3px";
        stopButtonEl.style.cursor = "pointer";
        stopButtonEl.style.fontSize = "12px";
        stopButtonEl.style.fontWeight = "bold";
        stopButtonEl.onmouseover = () => {
            stopButtonEl.style.backgroundColor = "#cc0000";
        };
        stopButtonEl.onmouseout = () => {
            stopButtonEl.style.backgroundColor = "#ff4444";
        };
        stopButtonEl.onclick = stopTranslation;

        document.body.appendChild(loadingIndicator);
    }

    function removeLoadingIndicator(): void {
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
            loadingIndicator = null;
        }
    }

    function clearElement(element: Element): void {
        if (!element) {
            return;
        }
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    function htmlToFragment(html: string): DocumentFragment {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const fragment = document.createDocumentFragment();
        while (doc.body.firstChild) {
            fragment.appendChild(doc.body.firstChild);
        }
        return fragment;
    }

    function setSanitizedContent(element: HTMLElement, html: string): void {
        if (!element) {
            return;
        }
        const sanitized = (window as any).DOMPurify?.sanitize(html ?? "") ?? "";
        const fragment = htmlToFragment(sanitized);
        clearElement(element);
        element.appendChild(fragment);
    }

    function updateStreamingPopup(popup: HTMLElement, content: string): void {
        if (!popup) {
            return;
        }

        clearElement(popup);
        popup.classList.add("is-streaming");
        popup.style.backgroundColor = "white";
        popup.style.border = "1px solid #ccc";
        popup.style.color = "#333";

        setSanitizedContent(popup, content || "");
        addCloseButton(popup);
    }

    function handleStreamUpdate(message: any): void {
        if (!message?.requestId) {
            return;
        }

        if (completedStreamRequestId === message.requestId) {
            return;
        }

        if (activeStreamRequestId && message.requestId !== activeStreamRequestId) {
            return;
        }

        activeStreamRequestId = message.requestId;
        completedStreamRequestId = null;

        displayPopup(
            message.text || "",
            false,
            false,
            message.detectedLanguageName,
            message.targetLanguageName,
            true,
        );
    }

    function cancelActiveStream(): void {
        if (!activeStreamRequestId) {
            return;
        }

        const requestId = activeStreamRequestId;
        activeStreamRequestId = null;
        completedStreamRequestId = null;

        if (activeStreamPort) {
            try {
                activeStreamPort.postMessage({
                    action: "cancelStream",
                    requestId: requestId,
                });
                return;
            } catch (error) {
                console.warn("Failed to send cancel message:", error);
            }
        }

        chrome.runtime.sendMessage({ action: "cancelTranslation", requestId } as ContentToBackgroundMessage);
    }

    function displayPopup(
        content: string,
        isError: boolean = false,
        isLoading: boolean = false,
        detectedLanguageName: string | null = null,
        targetLanguageName: string | null = null,
        isStreaming: boolean = false,
    ): void {
        console.log("displayPopup called with:", { content, isError, isLoading, detectedLanguageName, targetLanguageName });
        const popupId = "translation-popup-extension";
        let existingPopup = document.getElementById(popupId) as HTMLElement;

        if (existingPopup && isStreaming) {
            updateStreamingPopup(existingPopup, content);
            return;
        }

        if (existingPopup && !isLoading) {
            existingPopup.classList.remove("is-streaming");
            console.log("Updating existing popup content.");
            setSanitizedContent(existingPopup, content);
            existingPopup.style.backgroundColor = isError ? "#fff0f0" : "white";
            existingPopup.style.border = `1px solid ${isError ? "#f00" : "#ccc"}`;
            existingPopup.style.color = isError ? "#a00" : "#333";

            addCloseButton(existingPopup);
            console.log("Existing popup updated:", existingPopup);
            return;
        }

        if (existingPopup && isLoading) {
            existingPopup.classList.remove("is-streaming");
            console.log("Popup already exists in loading state.");
            return;
        }

        if (!existingPopup) {
            console.log("Creating new popup.");
            removePopup(false);

            let top = 0;
            let left = 0;
            let popupWidth = 350;
            const minWidth = 350;
            const maxWidth = window.innerWidth * 0.8;

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                top = window.scrollY + rect.bottom + 10;
                left = window.scrollX + rect.left;

                popupWidth = Math.max(minWidth, Math.min(rect.width, maxWidth));

                if (left + popupWidth > window.innerWidth) {
                    left = window.innerWidth - popupWidth - 20;
                }
            } else {
                top = window.scrollY + (window.lastMouseY || 0) + 20;
                left = window.scrollX + (window.lastMouseX || 0);
            }

            translationPopup = document.createElement("div");
            translationPopup.id = popupId;
            existingPopup = translationPopup;

            translationPopup.style.position = "absolute";
            translationPopup.style.top = `${top}px`;
            translationPopup.style.left = `${left}px`;
            translationPopup.style.zIndex = "2147483647";
            translationPopup.style.borderRadius = "5px";
            translationPopup.style.padding = "10px 25px 10px 15px";
            translationPopup.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
            translationPopup.style.width = `${popupWidth}px`;
            translationPopup.style.maxWidth = `${maxWidth}px`;
            translationPopup.style.fontFamily = "Arial, sans-serif";
            translationPopup.style.fontSize = "14px";
            translationPopup.style.lineHeight = "1.4";
            translationPopup.style.pointerEvents = "auto";

            translationPopup.style.display = "block";
            translationPopup.style.backgroundColor = isError ? "#fff0f0" : "white";
            translationPopup.style.border = `1px solid ${isError ? "#f00" : "#ccc"}`;
            translationPopup.style.color = isError ? "#a00" : "#333";
            translationPopup.style.minWidth = `${minWidth}px`;
            translationPopup.style.minHeight = "20px";
            translationPopup.style.visibility = "visible";
            translationPopup.style.opacity = "1";

            console.log("Popup element created and styled (before content):", translationPopup);

            try {
                document.body.appendChild(translationPopup);
                console.log("Popup appended to document body.");
            } catch (e) {
                console.error("Error appending popup to body:", e);
                return;
            }

            setTimeout(() => {
                document.addEventListener("click", handleClickOutside, true);
            }, 0);
        }

        if (isLoading) {
            existingPopup.classList.remove("is-streaming");
            clearElement(existingPopup);
            console.log("Setting loading content.");
            existingPopup.style.backgroundColor = "#f0f0f0";
            existingPopup.style.border = "3px solid orange";
            existingPopup.style.color = "#555";

            const spinnerContainer = document.createElement("div");
            spinnerContainer.style.cssText = "display: flex; align-items: center; justify-content: center; height: 30px;";

            const spinner = document.createElement("div");
            spinner.className = "spinner";
            spinner.style.cssText =
                "border: 3px solid #f3f3f3; border-top: 3px solid #555; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite;";

            const spinnerText = document.createElement("span");
            spinnerText.style.marginLeft = "8px";
            spinnerText.textContent = "Translating...";

            spinnerContainer.appendChild(spinner);
            spinnerContainer.appendChild(spinnerText);
            existingPopup.appendChild(spinnerContainer);

            if (!document.getElementById("translation-spinner-style")) {
                const style = document.createElement("style");
                style.id = "translation-spinner-style";
                style.textContent = "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
                document.head.appendChild(style);
            }
        } else if (isStreaming) {
            updateStreamingPopup(existingPopup, content);
            return;
        } else {
            console.log("Setting final content:", content);
            existingPopup.classList.remove("is-streaming");
            clearElement(existingPopup);

            if (!isError && detectedLanguageName && targetLanguageName) {
                const headerDiv = document.createElement("div");
                headerDiv.style.cssText =
                    "font-size: 11px; color: #666; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #ddd;";
                headerDiv.textContent = `${detectedLanguageName} → ${targetLanguageName}`;
                existingPopup.appendChild(headerDiv);
            }

            const contentDiv = document.createElement("div");
            const sanitized = (window as any).DOMPurify?.sanitize(content ?? "") ?? "";
            const fragment = htmlToFragment(sanitized);
            contentDiv.appendChild(fragment);
            existingPopup.appendChild(contentDiv);

            existingPopup.style.backgroundColor = isError ? "#ffdddd" : "#f8f9fa";
            existingPopup.style.border = `1px solid ${isError ? "#dc3545" : "#28a745"}`;
            existingPopup.style.color = isError ? "#a00" : "#333";
        }

        addCloseButton(existingPopup);
        console.log("Popup content set:", existingPopup);
    }

    function addCloseButton(popupElement: HTMLElement): void {
        const existingButton = popupElement.querySelector(".translation-popup-close-button");
        if (existingButton) {
            existingButton.remove();
        }

        const closeButton = document.createElement("button");
        closeButton.textContent = "×";
        closeButton.className = "translation-popup-close-button";
        closeButton.style.position = "absolute";
        closeButton.style.top = "2px";
        closeButton.style.right = "5px";
        closeButton.style.background = "none";
        closeButton.style.border = "none";
        closeButton.style.fontSize = "18px";
        closeButton.style.cursor = "pointer";
        closeButton.style.color = "#888";
        closeButton.onclick = removePopup;
        popupElement.appendChild(closeButton);
    }

    function removePopup(resetInProgress: boolean = true): void {
        cancelActiveStream();
        if (resetInProgress) {
            selectionTranslateInProgress = false;
        }
        hideSelectionTranslateButton();
        const popup = document.getElementById("translation-popup-extension");
        if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup);
            if (popup === translationPopup) {
                translationPopup = null;
            }
            document.removeEventListener("click", handleClickOutside, true);
        }
    }

    function handleClickOutside(event: Event): void {
        if (translationPopup && !translationPopup.contains(event.target as Node)) {
            if (!loadingIndicator || !loadingIndicator.contains(event.target as Node)) {
                removePopup();
            }
        }
    }
}
