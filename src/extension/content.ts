import { STORAGE_KEYS, getStorage, onStorageChanged } from "../shared/storage";
import { selectionOverlapsSensitiveField } from "../shared/sensitive";
import {
    DEBUG_MODE_DEFAULT,
    UI_THEME_DARK,
    UI_THEME_DEFAULT,
    UI_THEME_LIGHT,
    UI_THEME_SYSTEM,
    type UITheme,
} from "../shared/constants/settings";
import {
    getLanguageDisplayName,
    normalizeLanguageComparisonValue,
} from "../shared/constants/languages";
import {
    type BackgroundToContentMessage,
    type ContentToBackgroundMessage,
    type MessageListener,
    type PortMessageListener,
    HTML_TRANSLATION_PORT_NAME,
    STREAM_PORT_NAME,
} from "../shared/messaging";
import {
    ensureI18nReady,
    getActiveUILocale,
    getI18nMessageOrFallback,
    initializeI18nFromStorage,
    UI_LANGUAGE_STORAGE_KEY,
} from "../shared/i18n";
import {
    FullPageTranslationRun,
    type HtmlTranslationOnUpdateMeta,
    type HtmlTranslationResultItem,
    type PageTranslationProgress,
    type PageTranslationSummary,
    type RegionTranslationUnit,
} from "./page-translation-run";

declare global {
    interface Window {
        hasRun?: boolean;
        lastMouseX?: number;
        lastMouseY?: number;
    }

    var DOMPurify:
        | {
              sanitize: (html: string, config: any) => string;
          }
        | undefined;

    var ELD:
        | {
              detect: (text: string) => {
                  language: string;
                  isReliable: () => boolean;
              };
          }
        | undefined;
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
        "DIV",
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

    const STRUCTURAL_BOUNDARY_TAGS = new Set([
        "ADDRESS",
        "ARTICLE",
        "ASIDE",
        "DETAILS",
        "DIALOG",
        "DL",
        "FIELDSET",
        "FIGURE",
        "FOOTER",
        "FORM",
        "HEADER",
        "HR",
        "MAIN",
        "MENU",
        "NAV",
        "OL",
        "SECTION",
        "TABLE",
        "TBODY",
        "TFOOT",
        "THEAD",
        "TR",
        "UL",
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

    const TRANSLATION_POPUP_BASE_ID = "translation-popup-extension";
    const TRANSLATION_POPUP_SELECTOR = '[data-translation-popup="true"]';
    const TRANSLATION_POPUP_REQUEST_ID_ATTR = "translationRequestId";

    const EXTENSION_UI_SELECTORS = [
        TRANSLATION_POPUP_SELECTOR,
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

    const HTML_UNIT_ALLOWED_ATTRS = new Set([
        "href",
        "title",
        "lang",
        "dir",
        "datetime",
        "cite",
    ]);

    function t(key: string, fallback: string, substitutions?: string | string[]): string {
        return getI18nMessageOrFallback(key, fallback, substitutions);
    }

    function formatTranslationError(message: string | null | undefined): string {
        const normalized = (message || "").trim();
        if (normalized) {
            return t(
                "contentTranslationErrorPrefix",
                "Translation Error: $1",
                normalized,
            );
        }

        return t("contentTranslationErrorUnknown", "Translation Error: Unknown error");
    }

    void initializeI18nFromStorage();

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

    function splitHTMLUnitByChildNodes(
        element: Element,
        maxChars: number = MAX_HTML_UNIT_CHARS,
    ): Chunk[] {
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
                    const textChunks = splitTextNodeContent(
                        child.textContent || "",
                        maxChars,
                    );
                    for (const textChunk of textChunks) {
                        chunks.push({
                            html: textChunk,
                            nodeIndices: [i],
                        });
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const subChunks = splitHTMLUnitByChildNodes(
                        child as Element,
                        maxChars,
                    );
                    for (const subChunk of subChunks) {
                        chunks.push({
                            html: subChunk.html,
                            nodeIndices: [i],
                        });
                    }
                }
                continue;
            }

            if (
                currentChunk.length + childLength > maxChars &&
                currentChunk.parts.length > 0
            ) {
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

    // ========================================================================
    // Region-Based Translation: Interfaces and Types
    // ========================================================================

    /**
     * Represents a contiguous sequence of child nodes within a unit element
     * that contain translatable text content.
     */
    interface Region {
        startIndex: number; // childNodes index of first node
        endIndex: number; // childNodes index of last node (inclusive)
        nodes: Node[]; // actual Node references for serialization
    }

    type NodeClassification = "TRANSLATABLE" | "BOUNDARY" | "SKIP";

    // ========================================================================
    // Region-Based Translation: Helper Functions
    // ========================================================================

    /**
     * Checks if HTML contains meaningful (non-whitespace) text content.
     * Used to filter out regions that contain only whitespace.
     */
    function hasNonWhitespaceText(html: string): boolean {
        const textOnly = html.replace(/<[^>]*>/g, "");
        return textOnly.trim().length > 0;
    }

    /**
     * Classifies a node for region discovery:
     * - TRANSLATABLE: Node should be part of a translatable region
     * - BOUNDARY: Node ends the current region and is preserved in place
     * - SKIP: Node is ignored entirely (doesn't affect region boundaries)
     */
    function classifyNode(node: Node): NodeClassification {
        // Comment nodes are skipped entirely
        if (node.nodeType === Node.COMMENT_NODE) {
            return "SKIP";
        }

        // Text nodes are always translatable
        if (node.nodeType === Node.TEXT_NODE) {
            return "TRANSLATABLE";
        }

        // Element nodes
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tag = el.tagName.toUpperCase();

            // BR and WBR are always boundaries
            if (tag === "BR" || tag === "WBR") {
                return "BOUNDARY";
            }

            if (!canRoundTripInlineSubtree(el)) {
                return "BOUNDARY";
            }

            // Check if element has text content via simplified HTML
            const simplifiedHTML = getNodeSimplifiedHTML(node);
            if (simplifiedHTML.trim().length === 0) {
                // No text content (image-only, icon-only, etc.) -> boundary
                return "BOUNDARY";
            }

            return "TRANSLATABLE";
        }

        // Other node types (processing instructions, etc.) are skipped
        return "SKIP";
    }

    /**
     * Serializes a sequence of nodes into simplified HTML string.
     * Reuses existing allowlist rules from getNodeSimplifiedHTML.
     */
    function serializeRegionNodes(nodes: Node[]): string {
        let html = "";
        for (const node of nodes) {
            html += getNodeSimplifiedHTML(node);
        }
        return html.replace(/\s+/g, " ").trim();
    }

    /**
     * Identifies translatable regions within a unit element by walking its
     * direct childNodes and grouping contiguous translatable nodes.
     *
     * @param unitEl The unit element to scan for regions
     * @returns Array of Region objects, each representing a contiguous
     *          sequence of translatable nodes
     */
    function identifyRegions(unitEl: Element): Region[] {
        const regions: Region[] = [];
        let currentRegion: { startIndex: number; nodes: Node[] } | null = null;
        const children = Array.from(unitEl.childNodes);

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const classification = classifyNode(child);

            if (classification === "TRANSLATABLE") {
                if (!currentRegion) {
                    currentRegion = { startIndex: i, nodes: [] };
                }
                currentRegion.nodes.push(child);
            } else if (classification === "BOUNDARY") {
                // Finalize current region if it has meaningful text
                if (currentRegion && currentRegion.nodes.length > 0) {
                    const html = serializeRegionNodes(currentRegion.nodes);
                    if (hasNonWhitespaceText(html)) {
                        regions.push({
                            startIndex: currentRegion.startIndex,
                            endIndex: i - 1,
                            nodes: currentRegion.nodes,
                        });
                    }
                }
                currentRegion = null;
                // BOUNDARY node is preserved (not part of any region)
            }
            // SKIP nodes are ignored (don't affect region boundaries)
        }

        // Finalize last region
        if (currentRegion && currentRegion.nodes.length > 0) {
            const html = serializeRegionNodes(currentRegion.nodes);
            if (hasNonWhitespaceText(html)) {
                regions.push({
                    startIndex: currentRegion.startIndex,
                    endIndex: children.length - 1,
                    nodes: currentRegion.nodes,
                });
            }
        }

        return regions;
    }

    /**
     * Generates a UUID v4 for region identification.
     * Falls back to a random string if crypto.randomUUID is not available.
     */
    function generateRegionId(): string {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
        // Fallback for environments without crypto.randomUUID
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Inserts marker comments before and after a region's nodes.
     * These markers are used later to identify which nodes to replace
     * when applying the translated content.
     *
     * @param unitEl The parent element containing the region
     * @param region The region to mark
     * @returns The generated region ID (UUID)
     */
    function getRegionMarkerText(
        kind: "START" | "END",
        runId: string,
        regionId: string,
    ): string {
        return `TR_REGION_${kind}_${runId}_${regionId}`;
    }

    function insertRegionMarkers(unitEl: Element, region: Region, runId: string): string {
        const regionId = generateRegionId();
        const startMarker = document.createComment(
            getRegionMarkerText("START", runId, regionId),
        );
        const endMarker = document.createComment(
            getRegionMarkerText("END", runId, regionId),
        );

        // Insert start marker before first region node
        const firstNode = region.nodes[0];
        unitEl.insertBefore(startMarker, firstNode);

        // Insert end marker after last region node
        const lastNode = region.nodes[region.nodes.length - 1];
        if (lastNode.nextSibling) {
            unitEl.insertBefore(endMarker, lastNode.nextSibling);
        } else {
            unitEl.appendChild(endMarker);
        }

        return regionId;
    }

    /**
     * Splits a region into chunks if its serialized HTML exceeds MAX_HTML_UNIT_CHARS.
     * Reuses the existing chunking logic adapted for region nodes.
     *
     * @param region The region to potentially split
     * @param maxChars Maximum characters per chunk (defaults to MAX_HTML_UNIT_CHARS)
     * @returns Array of chunks, each with HTML and node indices
     */
    function splitRegionByNodes(
        region: Region,
        maxChars: number = MAX_HTML_UNIT_CHARS,
    ): Chunk[] {
        const nodes = region.nodes;
        const chunks: Chunk[] = [];
        let currentChunk: { parts: string[]; nodeIndices: number[]; length: number } = {
            parts: [],
            nodeIndices: [],
            length: 0,
        };

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const nodeHTML = getNodeSimplifiedHTML(node);
            const nodeLength = nodeHTML.length;

            if (nodeLength === 0) continue;

            // Handle oversized single nodes
            if (nodeLength > maxChars) {
                if (currentChunk.parts.length > 0) {
                    chunks.push({
                        html: currentChunk.parts.join(""),
                        nodeIndices: currentChunk.nodeIndices,
                    });
                    currentChunk = { parts: [], nodeIndices: [], length: 0 };
                }

                if (node.nodeType === Node.TEXT_NODE) {
                    const textChunks = splitTextNodeContent(
                        node.textContent || "",
                        maxChars,
                    );
                    for (const textChunk of textChunks) {
                        chunks.push({ html: textChunk, nodeIndices: [i] });
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const subChunks = splitHTMLUnitByChildNodes(
                        node as Element,
                        maxChars,
                    );
                    for (const subChunk of subChunks) {
                        chunks.push({ html: subChunk.html, nodeIndices: [i] });
                    }
                }
                continue;
            }

            // Start new chunk if current would exceed limit
            if (
                currentChunk.length + nodeLength > maxChars &&
                currentChunk.parts.length > 0
            ) {
                chunks.push({
                    html: currentChunk.parts.join(""),
                    nodeIndices: currentChunk.nodeIndices,
                });
                currentChunk = { parts: [], nodeIndices: [], length: 0 };
            }

            currentChunk.parts.push(nodeHTML);
            currentChunk.nodeIndices.push(i);
            currentChunk.length += nodeLength;
        }

        // Push final chunk
        if (currentChunk.parts.length > 0) {
            chunks.push({
                html: currentChunk.parts.join(""),
                nodeIndices: currentChunk.nodeIndices,
            });
        }

        return chunks.map((c) => ({
            html: c.html.replace(/\s+/g, " ").trim(),
            nodeIndices: c.nodeIndices,
        }));
    }

    /**
     * Collects region-based translation units from a single unit element.
     * For each region found, inserts markers and generates translation unit(s).
     * Handles chunking for large regions.
     *
     * @param unitEl The unit element to process
     * @returns Array of RegionTranslationUnits for all regions in the element
     */
    function collectRegionUnitsFromElement(
        unitEl: Element,
        runId: string,
    ): RegionTranslationUnit[] {
        const units: RegionTranslationUnit[] = [];
        const regions = identifyRegions(unitEl);

        for (const region of regions) {
            const regionId = insertRegionMarkers(unitEl, region, runId);
            const html = serializeRegionNodes(region.nodes);

            if (html.length === 0) {
                continue;
            }

            if (html.length > MAX_HTML_UNIT_CHARS) {
                const chunks = splitRegionByNodes(region, MAX_HTML_UNIT_CHARS);
                for (let i = 0; i < chunks.length; i++) {
                    if (chunks[i].html.length > 0) {
                        units.push({
                            parentElement: unitEl,
                            runId,
                            regionId: regionId,
                            html: chunks[i].html,
                            chunkIndex: i,
                            totalChunks: chunks.length,
                        });
                    }
                }
            } else {
                units.push({
                    parentElement: unitEl,
                    runId,
                    regionId: regionId,
                    html: html,
                });
            }
        }

        for (const child of Array.from(unitEl.children)) {
            if (classifyNode(child) !== "BOUNDARY") {
                continue;
            }
            if (SKIP_TAGS.has(child.tagName) || isHiddenElement(child)) {
                continue;
            }
            if (isExtensionUI(child) || containsInteractiveControls(child)) {
                continue;
            }
            if ((child.textContent || "").trim().length < 2) {
                continue;
            }
            units.push(...collectRegionUnitsFromElement(child, runId));
        }

        return units;
    }

    // ========================================================================
    // Region-Based Translation: Surgical DOM Apply Functions
    // ========================================================================

    /**
     * Finds a marker comment with the specified text within a parent element.
     * Searches only direct children of the parent element.
     *
     * @param parent The element to search within
     * @param markerText The exact text content to match
     * @returns The Comment node if found, null otherwise
     */
    function findMarkerComment(parent: Element, markerText: string): Comment | null {
        for (const child of Array.from(parent.childNodes)) {
            if (
                child.nodeType === Node.COMMENT_NODE &&
                child.textContent === markerText
            ) {
                return child as Comment;
            }
        }
        return null;
    }

    /**
     * Applies a translated result to a specific region by replacing only the
     * nodes between the region's start and end markers.
     *
     * This is the key function for preserving non-text nodes (images, icons, etc.)
     * during translation. Instead of replacing all children of a unit element,
     * it surgically replaces only the marked region.
     *
     * @param parentElement The element containing the region markers
     * @param regionId The UUID identifying the region
     * @param translatedHtml The translated HTML to insert
     * @returns true if successful, false if markers not found or other error
     */
    function applyRegionTranslation(
        parentElement: Element,
        runId: string,
        regionId: string,
        translatedHtml: string,
    ): boolean {
        // 1. Find markers
        const startMarker = findMarkerComment(
            parentElement,
            getRegionMarkerText("START", runId, regionId),
        );
        const endMarker = findMarkerComment(
            parentElement,
            getRegionMarkerText("END", runId, regionId),
        );

        if (!startMarker || !endMarker) {
            console.warn(
                `applyRegionTranslation: markers not found for region ${regionId}`,
            );
            return false; // Skip this region, don't modify DOM
        }

        // 2. Sanitize translated HTML
        const sanitized = sanitizeTranslatedHTML(translatedHtml);
        if (!sanitized || sanitized.trim().length === 0) {
            console.warn(
                `applyRegionTranslation: empty sanitized result for region ${regionId}`,
            );
            // Decision: skip entirely to preserve original content
            return false;
        }

        try {
            // 3. Parse translated HTML into fragment
            const temp = document.createElement("template");
            temp.innerHTML = sanitized;
            const fragment = temp.content;

            // 4. Remove nodes between markers (exclusive of markers)
            let current = startMarker.nextSibling;
            while (current && current !== endMarker) {
                const next = current.nextSibling;
                parentElement.removeChild(current);
                current = next;
            }

            // 5. Insert translated content before end marker
            parentElement.insertBefore(fragment.cloneNode(true), endMarker);

            // 6. Remove markers
            parentElement.removeChild(startMarker);
            parentElement.removeChild(endMarker);

            console.log(
                `applyRegionTranslation: applied ${sanitized.length} chars to region ${regionId} in ${parentElement.tagName}`,
            );
            return true;
        } catch (error) {
            console.error(`applyRegionTranslation error for region ${regionId}:`, error);
            return false;
        }
    }

    /**
     * Cleans up any orphaned region markers from a unit element.
     * This should be called after translation is complete to remove markers
     * from failed regions that were not applied.
     *
     * @param unitEl The unit element to clean up
     */
    function cleanupOrphanedMarkers(unitEl: Element, runId: string): void {
        const markers: Comment[] = [];
        const startPrefix = `TR_REGION_START_${runId}_`;
        const endPrefix = `TR_REGION_END_${runId}_`;
        for (const child of Array.from(unitEl.childNodes)) {
            if (child.nodeType === Node.COMMENT_NODE) {
                const text = child.textContent || "";
                if (text.startsWith(startPrefix) || text.startsWith(endPrefix)) {
                    markers.push(child as Comment);
                }
            }
        }
        for (const marker of markers) {
            unitEl.removeChild(marker);
        }
        if (markers.length > 0) {
            console.log(
                `cleanupOrphanedMarkers: removed ${markers.length} orphaned markers from ${unitEl.tagName}`,
            );
        }
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
        if (
            el.getAttribute("role") === "button" ||
            el.getAttribute("contenteditable") === "true" ||
            (el as any).isContentEditable
        ) {
            return true;
        }
        const interactiveDescendant = el.querySelector(
            'button, input, textarea, select, [role="button"], [contenteditable="true"]',
        );
        return interactiveDescendant !== null;
    }

    function hasDescendantStructuralBoundary(el: Element): boolean {
        for (const descendant of Array.from(el.querySelectorAll("*"))) {
            if (
                STRUCTURAL_BOUNDARY_TAGS.has(descendant.tagName) ||
                BLOCK_LEVEL_TAGS.has(descendant.tagName)
            ) {
                return true;
            }
            if (
                descendant.tagName === "DIV" &&
                descendant.textContent?.trim().length
            ) {
                return true;
            }
        }
        return false;
    }

    function canRoundTripInlineSubtree(node: Node): boolean {
        if (node.nodeType === Node.TEXT_NODE) {
            return true;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        if (SKIP_TAGS.has(el.tagName) || !HTML_UNIT_ALLOWED_TAGS.has(tagName)) {
            return false;
        }

        for (const attr of Array.from(el.attributes)) {
            if (!HTML_UNIT_ALLOWED_ATTRS.has(attr.name)) {
                return false;
            }
            if (attr.name === "href" && sanitizeUnitHref(attr.value) !== attr.value) {
                return false;
            }
        }

        if (containsInteractiveControls(el)) {
            return false;
        }

        for (const child of Array.from(el.childNodes)) {
            if (!canRoundTripInlineSubtree(child)) {
                return false;
            }
        }

        const serialized = getNodeSimplifiedHTML(el);
        if (!serialized.trim()) {
            return false;
        }

        return sanitizeTranslatedHTML(serialized) === serialized;
    }

    function isSafeTranslationUnit(el: Element): boolean {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        if (!BLOCK_LEVEL_TAGS.has(el.tagName)) {
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

        if (hasDescendantStructuralBoundary(el)) {
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
        return value
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    interface HTMLTranslationUnit {
        element: Element;
        html: string;
        chunkIndex?: number;
        totalChunks?: number;
    }

    // Minimal unit type for translation requests (element not needed for background)
    interface TranslationRequestUnit {
        id?: number;
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
                        const chunks = splitHTMLUnitByChildNodes(
                            root,
                            MAX_HTML_UNIT_CHARS,
                        );
                        console.log(
                            `HTML unit split into ${chunks.length} chunks (original: ${html.length} chars)`,
                        );
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

    /**
     * Collects region-based translation units from all safe unit elements on the page.
     * This is the region-based alternative to collectHTMLTranslationUnits.
     *
     * For each "safe" unit element, identifies translatable regions (contiguous text runs)
     * and generates translation units per region. Non-text nodes (images, icons) are
     * excluded and will be preserved during apply.
     *
     * @returns Array of RegionTranslationUnits for all regions across all unit elements
     */
    function collectRegionTranslationUnits(runId: string): RegionTranslationUnit[] {
        const units: RegionTranslationUnit[] = [];
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

                // Use region-based collection instead of whole-element extraction
                const regionUnits = collectRegionUnitsFromElement(root, runId);
                for (const regionUnit of regionUnits) {
                    units.push(regionUnit);
                }

                return;
            }

            if (
                root !== document.body &&
                !seenElements.has(root) &&
                !BLOCK_LEVEL_TAGS.has(root.tagName) &&
                !STRUCTURAL_BOUNDARY_TAGS.has(root.tagName) &&
                !containsInteractiveControls(root) &&
                (root.textContent || "").trim().length >= 2
            ) {
                seenElements.add(root);
                units.push(...collectRegionUnitsFromElement(root, runId));
                return;
            }

            for (const child of Array.from(root.children)) {
                traverse(child);
            }
        }

        traverse(document.body);

        console.log(`collectRegionTranslationUnits: found ${units.length} region units`);
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
            console.warn(
                "sanitizeTranslatedHTML: DOMPurify not available, stripping all HTML",
            );
            const temp = document.createElement("div");
            temp.innerHTML = html;
            return temp.textContent || "";
        }

        const sanitized = (window as any).DOMPurify.sanitize(
            html,
            HTML_UNIT_DOMPURIFY_CONFIG,
        );
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

            console.log(
                `applyTranslatedHTML: applied ${sanitized.length} chars to ${element.tagName}`,
            );
            return true;
        } catch (error) {
            console.error("applyTranslatedHTML error:", error);
            return false;
        }
    }

    const MAX_TEXT_SAMPLE_FOR_DETECTION = 512;

    function getLocalizedLanguageDisplayName(languageCode: string): string {
        return getLanguageDisplayName(languageCode, getActiveUILocale());
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

        const textToAnalyze =
            trimmedText.length > MAX_TEXT_SAMPLE_FOR_DETECTION
                ? trimmedText.substring(0, MAX_TEXT_SAMPLE_FOR_DETECTION)
                : trimmedText;

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
                languageName: getLocalizedLanguageDisplayName(result.language),
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
    const translationPopupsByRequestId = new Map<string, HTMLElement>();
    let loadingIndicator: HTMLElement | null = null;
    let originalBodyContent: string | null = null;
    let isTranslated = false;
    let stopTranslationFlag = false;

    let activeStreamPort: chrome.runtime.Port | null = null;
    let activeStreamRequestId: string | null = null;
    let completedStreamRequestId: string | null = null;

    const SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY =
        STORAGE_KEYS.SHOW_TRANSLATE_BUTTON_ON_SELECTION;
    const KEEP_SELECTION_POPUP_OPEN_KEY = STORAGE_KEYS.KEEP_SELECTION_POPUP_OPEN;
    const DEBUG_MODE_KEY = STORAGE_KEYS.DEBUG_MODE;
    const UI_THEME_KEY = STORAGE_KEYS.UI_THEME;
    type ResolvedUITheme = typeof UI_THEME_LIGHT | typeof UI_THEME_DARK;
    type PopupVisualState = "default" | "loading" | "streaming" | "error";
    let showTranslateButtonOnSelectionEnabled = true;
    let keepSelectionPopupOpenEnabled = false;
    let debugModeEnabled = DEBUG_MODE_DEFAULT;
    let uiTheme: UITheme = UI_THEME_DEFAULT;
    let systemThemeMediaQuery: MediaQueryList | null = null;
    let selectionTranslateButton: HTMLButtonElement | null = null;
    let selectionTranslateInProgress = false;
    let selectionListenerCleanup: (() => void) | null = null;
    let currentDetectedLanguage: string | null = null;
    let currentDetectedLanguageName: string | null = null;

    function debugLog(message: string, payload?: unknown): void {
        if (!debugModeEnabled) {
            return;
        }
        if (payload === undefined) {
            console.log("[AI Translator Debug]", message);
            return;
        }
        console.log("[AI Translator Debug]", message, payload);
    }

    function debugError(message: string, payload?: unknown): void {
        if (!debugModeEnabled) {
            return;
        }
        if (payload === undefined) {
            console.error("[AI Translator Debug]", message);
            return;
        }
        console.error("[AI Translator Debug]", message, payload);
    }

    function normalizeUITheme(value: unknown): UITheme {
        return value === UI_THEME_LIGHT ||
            value === UI_THEME_DARK ||
            value === UI_THEME_SYSTEM
            ? value
            : UI_THEME_DEFAULT;
    }

    function resolveUITheme(theme: UITheme): ResolvedUITheme {
        if (theme === UI_THEME_SYSTEM) {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? UI_THEME_DARK
                : UI_THEME_LIGHT;
        }
        return theme;
    }

    function applyPopupThemeClass(popup: HTMLElement): void {
        const resolvedTheme = resolveUITheme(uiTheme);
        popup.classList.remove(
            "translation-popup-theme-light",
            "translation-popup-theme-dark",
        );
        popup.classList.add(
            resolvedTheme === UI_THEME_DARK
                ? "translation-popup-theme-dark"
                : "translation-popup-theme-light",
        );
    }

    function applySelectionButtonThemeClass(): void {
        if (!selectionTranslateButton) {
            return;
        }
        selectionTranslateButton.classList.toggle(
            "selection-theme-dark",
            resolveUITheme(uiTheme) === UI_THEME_DARK,
        );
    }

    function setPopupVisualState(popup: HTMLElement, state: PopupVisualState): void {
        popup.dataset.popupState = state;
        popup.classList.remove(
            "popup-state-default",
            "popup-state-loading",
            "popup-state-streaming",
            "popup-state-error",
        );
        popup.classList.add(`popup-state-${state}`);
    }

    function applyThemeToExistingUI(): void {
        for (const popup of getAllTranslationPopups()) {
            applyPopupThemeClass(popup);
        }
        applySelectionButtonThemeClass();
    }

    function ensureSystemThemeWatcher(): void {
        if (systemThemeMediaQuery || !window.matchMedia) {
            return;
        }

        systemThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const onSystemThemeChange = () => {
            if (uiTheme === UI_THEME_SYSTEM) {
                applyThemeToExistingUI();
            }
        };

        if (typeof systemThemeMediaQuery.addEventListener === "function") {
            systemThemeMediaQuery.addEventListener("change", onSystemThemeChange);
            return;
        }

        if (typeof systemThemeMediaQuery.addListener === "function") {
            systemThemeMediaQuery.addListener(onSystemThemeChange);
        }
    }

    interface ActiveHtmlTranslation {
        requestId: string;
        port: chrome.runtime.Port;
        runId: string | null;
    }

    let activeHtmlTranslation: ActiveHtmlTranslation | null = null;

    let activeFullPageRun: FullPageTranslationRun | null = null;

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

                if (req.isError) {
                    debugError("Received translation error message", {
                        requestId,
                        text: req.text || "",
                        debugInfo: req.debugInfo,
                    });
                }

                displayPopup(
                    req.text || "",
                    req.isError,
                    req.isLoading,
                    req.detectedLanguageName,
                    req.targetLanguageName,
                    isStreaming,
                    requestId,
                    req.debugInfo || null,
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
                    const errorText = formatTranslationError(req.errorMessage || null);
                    debugError("Received full-page translation error", {
                        errorText,
                        debugInfo: req.debugInfo,
                    });
                    displayPopup(
                        errorText,
                        true,
                        false,
                        null,
                        null,
                        false,
                        req.requestId || null,
                        req.debugInfo || null,
                    );
                    console.error("Element translation failed:", req.errorMessage);
                } else if (!isTranslated) {
                    if (activeFullPageRun && !activeFullPageRun.cancelled) {
                        console.log(
                            "Full-page translation already in progress, ignoring duplicate start.",
                        );
                        sendResponse({ status: "already_in_progress" });
                        break;
                    }
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
                    displayLoadingIndicator(
                        t("contentTranslatingPage", "Translating page..."),
                    );
                } else {
                    console.log(
                        "Loading indicator request ignored for selected text (popup handles it).",
                    );
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
            if (
                message &&
                typeof message === "object" &&
                (message as any).action === "streamTranslationUpdate"
            ) {
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

    function startHtmlTranslation(
        units: TranslationRequestUnit[],
        targetLanguage: string | null = null,
        onUpdate:
            | ((
                  results: HtmlTranslationResultItem[],
                  batchInfo: HtmlTranslationOnUpdateMeta | null,
              ) => void)
            | null = null,
        runId: string | null = null,
    ): Promise<HtmlTranslationResultItem[]> {
        return new Promise((resolve, reject) => {
            if (activeHtmlTranslation?.port) {
                reject(new Error("HTML translation already in progress."));
                return;
            }

            const requestId = `html-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const port = chrome.runtime.connect({ name: HTML_TRANSLATION_PORT_NAME });
            let settled = false;
            const collectedResults: HtmlTranslationResultItem[] = [];

            const handleResults = (
                results: HtmlTranslationResultItem[],
                batchInfo: HtmlTranslationOnUpdateMeta | null = null,
            ) => {
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

            const finalize = (
                error: Error | null,
                results: HtmlTranslationResultItem[] | null,
            ) => {
                if (settled) {
                    return;
                }
                settled = true;
                if (activeHtmlTranslation?.requestId === requestId) {
                    activeHtmlTranslation = null;
                }
                if (error) {
                    reject(error);
                } else {
                    resolve(results || []);
                }
                try {
                    port.disconnect();
                } catch (disconnectError) {
                    console.warn(
                        "Failed to disconnect HTML translation port:",
                        disconnectError,
                    );
                }
            };

            port.onMessage.addListener((message) => {
                if (
                    message &&
                    typeof message === "object" &&
                    (message as any).action === "htmlTranslationResult"
                ) {
                    const msg = message as any;
                    if (msg.requestId !== requestId) {
                        return;
                    }
                    if (msg.error) {
                        const error = new Error(msg.error);
                        if (msg.cancelled) {
                            (error as any).cancelled = true;
                        }
                        finalize(error, null);
                        return;
                    }
                    if (msg.cancelled) {
                        const error = new Error("Translation cancelled.");
                        (error as any).cancelled = true;
                        finalize(error, null);
                        return;
                    }
                    if (msg.results) {
                        const batchInfo: HtmlTranslationOnUpdateMeta | null =
                            typeof msg.batchIndex === "number" &&
                            typeof msg.batchCount === "number"
                                ? {
                                      batchIndex: msg.batchIndex,
                                      batchCount: msg.batchCount,
                                      batchSize: msg.batchSize,
                                  }
                                : null;
                        if (
                            batchInfo &&
                            typeof msg.subBatchIndex === "number" &&
                            typeof msg.subBatchCount === "number"
                        ) {
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
                    finalize(
                        new Error("Translation connection closed unexpectedly."),
                        null,
                    );
                }
            });

            activeHtmlTranslation = { requestId, port, runId };
            if (runId && activeFullPageRun?.runId === runId) {
                activeFullPageRun.htmlTranslationRequestId = requestId;
                activeFullPageRun.htmlTranslationPort = port;
            }
            console.log("startHtmlTranslation: sending request", {
                requestId,
                unitCount: units.length,
            });
            port.postMessage({
                action: "startHTMLTranslation",
                requestId,
                units,
                targetLanguage,
            });
        });
    }

    getStorage([
        SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY,
        KEEP_SELECTION_POPUP_OPEN_KEY,
        DEBUG_MODE_KEY,
        UI_THEME_KEY,
    ])
        .then((result) => {
            const stored = result?.[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY];
            showTranslateButtonOnSelectionEnabled =
                typeof stored === "boolean" ? stored : true;
            const keepPopupOpen = result?.[KEEP_SELECTION_POPUP_OPEN_KEY];
            keepSelectionPopupOpenEnabled =
                typeof keepPopupOpen === "boolean" ? keepPopupOpen : false;
            const debugMode = result?.[DEBUG_MODE_KEY];
            debugModeEnabled =
                typeof debugMode === "boolean" ? debugMode : DEBUG_MODE_DEFAULT;
            uiTheme = normalizeUITheme(result?.[UI_THEME_KEY]);
            ensureSystemThemeWatcher();
            updateSelectionTranslateButtonState();
            syncPopupOutsideClickBehavior();
            applyThemeToExistingUI();
            debugLog("Loaded content-script settings", {
                showTranslateButtonOnSelectionEnabled,
                keepSelectionPopupOpenEnabled,
                debugModeEnabled,
                uiTheme,
            });
        })
        .catch((error) => {
            console.warn("Error reading selection popup settings:", error);
            showTranslateButtonOnSelectionEnabled = true;
            keepSelectionPopupOpenEnabled = false;
            debugModeEnabled = DEBUG_MODE_DEFAULT;
            uiTheme = UI_THEME_DEFAULT;
            ensureSystemThemeWatcher();
            updateSelectionTranslateButtonState();
            syncPopupOutsideClickBehavior();
            applyThemeToExistingUI();
        });

    async function refreshLocalizedContentUI(): Promise<void> {
        if (currentDetectedLanguage) {
            currentDetectedLanguageName = getLocalizedLanguageDisplayName(
                currentDetectedLanguage,
            );
        }

        if (selectionTranslateButton) {
            selectionTranslateButton.setAttribute(
                "aria-label",
                t("contentTranslateSelectionAriaLabel", "Translate selection"),
            );
            updateButtonLabel(currentDetectedLanguageName);
        }

        if (loadingIndicator) {
            const stopButtonEl = loadingIndicator.querySelector(
                ".stop-button",
            ) as HTMLButtonElement | null;
            if (stopButtonEl) {
                stopButtonEl.textContent = t("contentStopButton", "Stop");
            }
        }
    }

    onStorageChanged((changes, areaName) => {
        if (areaName !== "sync") {
            return;
        }

        const showButtonChange = changes[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY];
        if (showButtonChange) {
            const nextValue = showButtonChange.newValue;
            showTranslateButtonOnSelectionEnabled =
                typeof nextValue === "boolean" ? nextValue : true;
            updateSelectionTranslateButtonState();
        }

        const keepPopupOpenChange = changes[KEEP_SELECTION_POPUP_OPEN_KEY];
        if (keepPopupOpenChange) {
            const nextValue = keepPopupOpenChange.newValue;
            keepSelectionPopupOpenEnabled =
                typeof nextValue === "boolean" ? nextValue : false;
            syncPopupOutsideClickBehavior();
        }

        const debugModeChange = changes[DEBUG_MODE_KEY];
        if (debugModeChange) {
            const nextValue = debugModeChange.newValue;
            debugModeEnabled =
                typeof nextValue === "boolean" ? nextValue : DEBUG_MODE_DEFAULT;
            debugLog("Updated debug mode from storage change", { debugModeEnabled });
        }

        const uiThemeChange = changes[UI_THEME_KEY];
        if (uiThemeChange) {
            uiTheme = normalizeUITheme(uiThemeChange.newValue);
            applyThemeToExistingUI();
        }

        const uiLanguageChange = changes[UI_LANGUAGE_STORAGE_KEY];
        if (uiLanguageChange) {
            void initializeI18nFromStorage()
                .then(() => refreshLocalizedContentUI())
                .catch((error) => {
                    console.warn("Failed to refresh localized content UI:", error);
                });
        }
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
        selectionTranslateButton.setAttribute(
            "aria-label",
            t("contentTranslateSelectionAriaLabel", "Translate selection"),
        );

        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("viewBox", "0 0 24 24");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute(
            "d",
            "M12.87 15.07l-2.54-2.51.03-.03a17.52 17.52 0 003.5-6.53H17V4h-7V2H8v2H1v2h11.17A15.65 15.65 0 019 11.35 15.65 15.65 0 017.33 8H5.26A17.52 17.52 0 008.1 12.5L3 17.57 4.42 19 9.5 13.92l3.11 3.1 0.26-1.95zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z",
        );

        icon.appendChild(path);

        const label = document.createElement("span");
        label.textContent = t("contentTranslateButtonLabel", "Translate");

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
            if (!keepSelectionPopupOpenEnabled) {
                displayPopup(t("contentTranslating", "Translating..."), false, true);
            }

            const msg: ContentToBackgroundMessage = {
                action: "translateSelectedHtmlWithDetection",
                html,
                detectedLanguage: currentDetectedLanguage ?? undefined,
                detectedLanguageName: currentDetectedLanguageName ?? undefined,
            };

            chrome.runtime.sendMessage(msg, (response) => {
                if (chrome.runtime.lastError) {
                    selectionTranslateInProgress = false;
                    displayPopup(
                        formatTranslationError(chrome.runtime.lastError.message),
                        true,
                        false,
                    );
                    return;
                }

                if (response?.status && response.status !== "ok") {
                    selectionTranslateInProgress = false;
                    displayPopup(
                        formatTranslationError(response.message || "Unknown error"),
                        true,
                        false,
                    );
                }
            });
        });

        applySelectionButtonThemeClass();
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
            if (
                selectionTranslateButton &&
                selectionTranslateButton.contains(event.target as Node)
            ) {
                return;
            }

            if (isInsideTranslationPopup(event.target as Node)) {
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
            document.removeEventListener(
                "selectionchange",
                onSelectionMaybeChanged,
                true,
            );
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

        // Don't offer to translate content from password or other sensitive fields.
        if (selectionOverlapsSensitiveField(selection)) {
            hideSelectionTranslateButton();
            return;
        }

        const selectionContainerEl = selection.anchorNode
            ? selection.anchorNode.nodeType === Node.ELEMENT_NODE
                ? (selection.anchorNode as Element)
                : selection.anchorNode.parentElement
            : null;

        if (
            selectionContainerEl &&
            (selectionContainerEl.closest(TRANSLATION_POPUP_SELECTOR) ||
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

    async function detectAndShowButton(text: string, rect: DOMRect): Promise<void> {
        currentDetectedLanguage = null;
        currentDetectedLanguageName = null;

        // Ensure the fire-and-forget i18n initialization has settled so that
        // getActiveUILocale() returns the user's chosen locale, not the default
        // "en".  Without this, the first detection after content-script
        // injection can produce an English language name.
        await ensureI18nReady();

        const detectionResult = detectLanguage(text);

        if (!detectionResult) {
            console.log("Language detection failed or unavailable, not showing button");
            hideSelectionTranslateButton();
            return;
        }

        const msg: ContentToBackgroundMessage = { action: "getTargetLanguage" };
        chrome.runtime.sendMessage(msg, (response) => {
            if (chrome.runtime.lastError) {
                console.warn(
                    "Failed to get target language:",
                    chrome.runtime.lastError.message,
                );
                hideSelectionTranslateButton();
                return;
            }

            const targetLanguage = response?.targetLanguage || "en";

            const detectedNormalized = normalizeLanguageComparisonValue(
                detectionResult.language,
            );
            const targetNormalized = normalizeLanguageComparisonValue(targetLanguage);
            const isSameLanguage =
                detectedNormalized !== "" &&
                targetNormalized !== "" &&
                detectedNormalized === targetNormalized;

            if (isSameLanguage) {
                console.log(
                    "Detected language matches target language, not showing button",
                );
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
            labelSpan.textContent = t(
                "contentTranslateFromLabel",
                "Translate from $1",
                languageName,
            );
        } else {
            labelSpan.textContent = t("contentTranslateButtonLabel", "Translate");
        }
    }

    function extractSelectedHtml(): string | null {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        // Block translation when the selection overlaps a sensitive form field.
        if (selectionOverlapsSensitiveField(selection)) {
            console.warn(
                "[AI Translator] Selection overlaps a sensitive form field; blocking translation.",
            );
            return null;
        }

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
            .querySelectorAll(
                'script, style, nav, header, footer, aside, form, button, input, textarea, select, [aria-hidden="true"], noscript',
            )
            .forEach((el) => el.remove());

        return clonedBody.innerHTML;
    }

    function getTranslatableElements(): Array<{
        element: Element;
        text: string;
        path: string;
    }> {
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
                        el.closest(TRANSLATION_POPUP_SELECTOR) ||
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
            const index =
                Array.from(element.parentNode?.children || []).indexOf(element) + 1;
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

        displayLoadingIndicator(
            t(
                "contentTranslatingElementsCount",
                "Translating $1 elements...",
                String(elements.length),
            ),
        );

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
                displayPopup(
                    t("contentTranslationStoppedByUser", "Translation stopped by user."),
                    true,
                    false,
                );
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

        console.log(
            `Translation complete. ${completed} elements translated, ${errorCount} errors.`,
        );

        setTimeout(() => removeLoadingIndicator(), 1000);
    }

    function getChunkProgressMessage(
        translatedChunks: number,
        totalChunks: number,
        errorCount: number,
        batchInfo: HtmlTranslationOnUpdateMeta | null = null,
    ): string {
        const errorSuffix =
            errorCount > 0
                ? t("contentProgressErrorSuffix", " ($1 errors)", String(errorCount))
                : "";
        let batchPrefix = "";
        if (
            batchInfo &&
            typeof batchInfo.batchIndex === "number" &&
            typeof batchInfo.batchCount === "number"
        ) {
            batchPrefix = t("contentProgressBatchPrefix", "Batch $1/$2", [
                String(batchInfo.batchIndex),
                String(batchInfo.batchCount),
            ]);
            if (
                typeof batchInfo.subBatchIndex === "number" &&
                typeof batchInfo.subBatchCount === "number"
            ) {
                batchPrefix += t("contentProgressPartSuffix", " part $1/$2", [
                    String(batchInfo.subBatchIndex),
                    String(batchInfo.subBatchCount),
                ]);
            }
            batchPrefix += " - ";
        }
        return `${batchPrefix}${t(
            "contentProgressTranslatedChunks",
            "Translated $1/$2 chunks",
            [String(translatedChunks), String(totalChunks)],
        )}${errorSuffix}`;
    }

    async function translatePageV3(): Promise<void> {
        console.log("Starting translatePageV3 (region-based HTML-preserving)...");

        stopTranslationFlag = false;
        const runId = `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const run = new FullPageTranslationRun(runId);
        activeFullPageRun = run;

        displayLoadingIndicatorState(t("contentPreparing", "Preparing..."), "preparing");

        // Use region-based collection to preserve images/non-text nodes
        const units = collectRegionTranslationUnits(runId);
        run.setUnits(units);
        const totalChunks = run.totalChunks;

        if (units.length === 0) {
            console.log("No region translation units found");
            displayLoadingIndicatorState(
                t("contentNoTranslatableContentFound", "No translatable content found"),
                "done",
            );
            setTimeout(() => removeLoadingIndicator(), 60000);
            if (activeFullPageRun?.runId === runId) {
                activeFullPageRun = null;
            }
            return;
        }

        console.log(`Found ${units.length} region translation units`);

        const unitsForTranslation = units.map((unit, index) => ({
            id: index,
            html: unit.html,
        }));

        displayLoadingIndicatorState(
            t(
                "contentTranslatingChunksCount",
                "Translating $1 chunks...",
                String(totalChunks),
            ),
            "translating",
            {
                current: 0,
                total: totalChunks,
            },
        );

        let receivedResults = 0;

        const isRunActive = () =>
            activeFullPageRun?.runId === runId && !activeFullPageRun.cancelled;

        const applyRegionForRun = (
            parentElement: Element,
            regionId: string,
            translatedHtml: string,
        ): boolean => {
            if (!isRunActive()) {
                return false;
            }
            return applyRegionTranslation(
                parentElement,
                runId,
                regionId,
                translatedHtml,
            );
        };

        const updateChunkProgress = (progress: PageTranslationProgress) => {
            displayLoadingIndicatorState(
                getChunkProgressMessage(
                    progress.translatedChunks,
                    progress.totalChunks,
                    progress.errorCount,
                    progress.batchInfo,
                ),
                "translating",
                {
                    current: progress.translatedChunks,
                    total: progress.totalChunks,
                },
            );
        };

        const handleTranslationResults = (
            results: HtmlTranslationResultItem[],
            batchInfo: HtmlTranslationOnUpdateMeta | null = null,
        ) => {
            if (!isRunActive()) {
                return;
            }
            if (!Array.isArray(results) || results.length === 0) {
                return;
            }

            if (batchInfo?.batchIndex && batchInfo?.batchCount) {
                const batchSizeLabel =
                    typeof batchInfo.batchSize === "number"
                        ? `, ${batchInfo.batchSize} units`
                        : "";
                const subBatchLabel =
                    typeof batchInfo.subBatchIndex === "number" &&
                    typeof batchInfo.subBatchCount === "number"
                        ? ` part ${batchInfo.subBatchIndex}/${batchInfo.subBatchCount}`
                        : "";
                console.log(
                    `translatePageV3: received batch ${batchInfo.batchIndex}/${batchInfo.batchCount}${subBatchLabel} (${results.length} results${batchSizeLabel})`,
                );
            } else {
                console.log(
                    `translatePageV3: received ${results.length} translation results`,
                );
            }

            receivedResults += results.length;

            const progress = run.handleResults(
                results,
                batchInfo,
                applyRegionForRun,
            );
            updateChunkProgress(progress);
        };

        const finalizeTranslation = () => {
            if (!isRunActive()) {
                for (const element of run.parentElements) {
                    cleanupOrphanedMarkers(element, runId);
                }
                return;
            }
            const summary: PageTranslationSummary = run.finalize(applyRegionForRun);

            // Clean up any orphaned markers from failed regions
            for (const element of run.parentElements) {
                cleanupOrphanedMarkers(element, runId);
            }

            const summaryMessage =
                summary.errorCount > 0
                    ? t(
                          "contentSummaryDoneWithErrors",
                          "Done. $1 regions translated, $2 errors",
                          [String(summary.successCount), String(summary.errorCount)],
                      )
                    : t(
                          "contentSummaryDone",
                          "Done. $1 regions translated",
                          String(summary.successCount),
                      );
            const summaryState = summary.errorCount > 0 ? "error" : "done";
            displayLoadingIndicatorState(summaryMessage, summaryState, {
                current: summary.translatedChunks,
                total: summary.totalChunks,
            });

            isTranslated = true;
            if (activeFullPageRun?.runId === runId) {
                activeFullPageRun = null;
            }
            setTimeout(() => removeLoadingIndicator(), 60000);
        };

        try {
            await startHtmlTranslation(
                unitsForTranslation,
                null,
                handleTranslationResults,
                runId,
            );
            console.log(
                `translatePageV3: received ${receivedResults} translation results`,
            );
            finalizeTranslation();
        } catch (error) {
            const wasCancelled =
                (error as any)?.cancelled ||
                activeFullPageRun?.runId !== runId ||
                run.cancelled;
            if (wasCancelled) {
                console.log("translatePageV3 cancelled");
                const progress = run.getProgress();
                for (const element of run.parentElements) {
                    cleanupOrphanedMarkers(element, runId);
                }
                displayLoadingIndicatorState(
                    t("contentTranslationStoppedByUser", "Translation stopped by user."),
                    "stopped",
                    {
                        current: progress.translatedChunks,
                        total: progress.totalChunks,
                    },
                );
                if (activeFullPageRun?.runId === runId) {
                    activeFullPageRun = null;
                }
                setTimeout(() => removeLoadingIndicator(), 60000);
                return;
            }
            console.error("translatePageV3 error:", error);
            // Clean up markers even on error
            for (const element of run.parentElements) {
                cleanupOrphanedMarkers(element, runId);
            }
            displayLoadingIndicatorState(
                t(
                    "contentErrorPrefix",
                    "Error: $1",
                    (error as Error).message || String(error),
                ),
                "error",
                {
                    current: 0,
                    total: totalChunks,
                },
            );
            if (activeFullPageRun?.runId === runId) {
                activeFullPageRun = null;
            }
            setTimeout(() => removeLoadingIndicator(), 60000);
        }
    }

    function stopTranslation(): void {
        stopTranslationFlag = true;
        const run = activeFullPageRun;
        if (run) {
            run.cancel();
            for (const element of run.parentElements) {
                cleanupOrphanedMarkers(element, run.runId);
            }
            try {
                run.htmlTranslationPort?.postMessage({
                    action: "cancelHTMLTranslation",
                    requestId: run.htmlTranslationRequestId || undefined,
                });
            } catch (error) {
                console.warn("Failed to send HTML translation cancel:", error);
            }
            try {
                run.htmlTranslationPort?.disconnect();
            } catch (error) {
                console.warn("Failed to disconnect HTML translation port:", error);
            }
            if (activeHtmlTranslation?.runId === run.runId) {
                activeHtmlTranslation = null;
            }
            activeFullPageRun = null;
            displayLoadingIndicatorState(
                t("contentTranslationStoppedByUser", "Translation stopped by user."),
                "stopped",
            );
            setTimeout(() => removeLoadingIndicator(), 60000);
        }
        console.log("Translation stopped");
    }

    type LoadingIndicatorState =
        | "preparing"
        | "translating"
        | "done"
        | "stopped"
        | "error";

    interface LoadingProgress {
        current: number;
        total: number;
    }

    function displayLoadingIndicatorState(
        message: string,
        state: LoadingIndicatorState = "translating",
        progress: LoadingProgress | null = null,
    ): void {
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
        stopButtonEl.textContent = t("contentStopButton", "Stop");
        stopButtonEl.style.display =
            state === "translating" || state === "preparing"
                ? "inline-block"
                : "none";

        const textWrapper = document.createElement("div");
        textWrapper.style.display = "flex";
        textWrapper.style.flexDirection = "column";
        textWrapper.style.gap = "6px";
        textWrapper.style.alignItems = "flex-start";
        textWrapper.appendChild(progressText);

        if (
            progress &&
            typeof progress.current === "number" &&
            typeof progress.total === "number"
        ) {
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
            marker.textContent = t(
                "contentTranslationErrorMarker",
                " [translation error]",
            );
            marker.title =
                error && error.message
                    ? error.message
                    : t("contentTranslationFailed", "Translation failed");
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

    async function translateElement(elementData: {
        element: Element;
        text: string;
        path: string;
    }): Promise<void> {
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
                        reject(
                            new Error(
                                t(
                                    "contentNoTranslationReceived",
                                    "No translation received",
                                ),
                            ),
                        );
                    }
                },
            );
        });
    }

    function updateElementTextInline(
        element: Element,
        originalText: string,
        translatedText: string,
    ): void {
        try {
            console.log(
                `Updating element ${element.tagName} with inline text replacement`,
            );
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
                updateElementTextInline(
                    element,
                    (req as any).originalText,
                    (req as any).translatedText,
                );
                console.log(`Updated element at path ${(req as any).elementPath}`);
            } else {
                console.warn(
                    `Could not find element at path: ${(req as any).elementPath}`,
                );
            }
        }
    }

    function updateLoadingProgress(
        completed: number,
        total: number,
        errors: number,
    ): void {
        if (loadingIndicator) {
            const progress = Math.round((completed / total) * 100);
            const errorText =
                errors > 0
                    ? t("contentProgressErrorSuffix", " ($1 errors)", String(errors))
                    : "";
            const progressText = loadingIndicator.querySelector(
                ".progress-text",
            ) as HTMLElement;
            if (progressText) {
                progressText.textContent = t(
                    "contentTranslatingElementsProgress",
                    "Translating elements... $1/$2 ($3%)$4",
                    [String(completed), String(total), String(progress), errorText],
                );
            }
        }
    }

    function displayLoadingIndicator(
        message: string = t("contentLoading", "Loading..."),
    ): void {
        displayLoadingIndicatorState(message, "preparing");
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
        applyPopupThemeClass(popup);
        setPopupVisualState(popup, "streaming");
        popup.classList.add("is-streaming");

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
            message.requestId,
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

        chrome.runtime.sendMessage({
            action: "cancelTranslation",
            requestId,
        } as ContentToBackgroundMessage);
    }

    function getAllTranslationPopups(): HTMLElement[] {
        return Array.from(
            document.querySelectorAll(TRANSLATION_POPUP_SELECTOR),
        ) as HTMLElement[];
    }

    function getPopupForRequestId(requestId: string | null): HTMLElement | null {
        if (!requestId) {
            return null;
        }
        const popup = translationPopupsByRequestId.get(requestId) || null;
        if (!popup || !popup.isConnected) {
            translationPopupsByRequestId.delete(requestId);
            return null;
        }
        return popup;
    }

    function isInsideTranslationPopup(node: Node | null): boolean {
        if (!node) {
            return false;
        }
        if (node instanceof Element) {
            return Boolean(node.closest(TRANSLATION_POPUP_SELECTOR));
        }
        return Boolean(node.parentElement?.closest(TRANSLATION_POPUP_SELECTOR));
    }

    function createPopupElementId(requestId: string | null): string {
        if (!requestId) {
            return TRANSLATION_POPUP_BASE_ID;
        }
        const safeIdPart = requestId.replace(/[^a-zA-Z0-9_-]/g, "_");
        return `${TRANSLATION_POPUP_BASE_ID}-${safeIdPart}`;
    }

    function registerPopup(popup: HTMLElement, requestId: string | null): void {
        popup.dataset.translationPopup = "true";
        if (requestId) {
            popup.dataset[TRANSLATION_POPUP_REQUEST_ID_ATTR] = requestId;
            translationPopupsByRequestId.set(requestId, popup);
        }
        translationPopup = popup;
    }

    function unregisterPopup(popup: HTMLElement): void {
        const requestId = popup.dataset[TRANSLATION_POPUP_REQUEST_ID_ATTR];
        if (requestId) {
            translationPopupsByRequestId.delete(requestId);
        }
        if (translationPopup === popup) {
            const remaining = getAllTranslationPopups();
            translationPopup =
                remaining.length > 0 ? remaining[remaining.length - 1] : null;
        }
    }

    interface PopupRect {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }

    function getPopupRect(popup: HTMLElement): PopupRect {
        const rect = popup.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            right: rect.right + window.scrollX,
            bottom: rect.bottom + window.scrollY,
        };
    }

    function rectsOverlap(a: PopupRect, b: PopupRect): boolean {
        return (
            a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
        );
    }

    function positionPopupToAvoidOverlap(popup: HTMLElement): void {
        if (!keepSelectionPopupOpenEnabled) {
            return;
        }

        const others = getAllTranslationPopups().filter((entry) => entry !== popup);
        if (others.length === 0) {
            return;
        }

        const popupWidth = popup.offsetWidth || parseFloat(popup.style.width) || 350;
        const popupHeight = popup.offsetHeight || 120;
        const margin = 12;
        const viewportLeft = window.scrollX + margin;
        const viewportTop = window.scrollY + margin;
        const viewportRight = window.scrollX + window.innerWidth - margin;
        const viewportBottom = window.scrollY + window.innerHeight - margin;

        let left = parseFloat(popup.style.left) || window.scrollX;
        let top = parseFloat(popup.style.top) || window.scrollY;

        left = Math.min(
            Math.max(left, viewportLeft),
            Math.max(viewportLeft, viewportRight - popupWidth),
        );
        top = Math.max(top, viewportTop);

        for (let attempt = 0; attempt < 30; attempt++) {
            const candidateRect: PopupRect = {
                left,
                top,
                right: left + popupWidth,
                bottom: top + popupHeight,
            };

            let overlappingRect: PopupRect | null = null;
            for (const otherPopup of others) {
                const otherRect = getPopupRect(otherPopup);
                if (rectsOverlap(candidateRect, otherRect)) {
                    overlappingRect = otherRect;
                    break;
                }
            }

            if (!overlappingRect) {
                break;
            }

            top = overlappingRect.bottom + margin;

            if (top + popupHeight > viewportBottom) {
                top = viewportTop;
                left = overlappingRect.right + margin;
                if (left + popupWidth > viewportRight) {
                    left = viewportLeft;
                }
            }
        }

        popup.style.left = `${Math.round(left)}px`;
        popup.style.top = `${Math.round(top)}px`;
    }

    function setPopupOutsideClickDismissEnabled(enabled: boolean): void {
        document.removeEventListener("click", handleClickOutside, true);
        if (enabled) {
            document.addEventListener("click", handleClickOutside, true);
        }
    }

    function syncPopupOutsideClickBehavior(): void {
        const hasPopup = getAllTranslationPopups().length > 0;
        const shouldAutoDismiss = hasPopup && !keepSelectionPopupOpenEnabled;
        setPopupOutsideClickDismissEnabled(shouldAutoDismiss);
    }

    function renderFinalPopupContent(
        popup: HTMLElement,
        content: string,
        isError: boolean,
        detectedLanguageName: string | null,
        targetLanguageName: string | null,
        debugInfo: string | null,
    ): void {
        popup.classList.remove("is-streaming");
        applyPopupThemeClass(popup);
        setPopupVisualState(popup, isError ? "error" : "default");
        clearElement(popup);

        if (!isError && detectedLanguageName && targetLanguageName) {
            const headerDiv = document.createElement("div");
            headerDiv.className = "translation-popup-header";
            headerDiv.textContent = `${detectedLanguageName} → ${targetLanguageName}`;
            popup.appendChild(headerDiv);
        }

        const contentDiv = document.createElement("div");
        const visibleMessage =
            typeof content === "string" && content.trim() !== ""
                ? content
                : isError
                  ? t(
                        "contentTranslationErrorUnknown",
                        "Translation Error: Unknown error",
                    )
                  : "";
        const sanitized = (window as any).DOMPurify?.sanitize(visibleMessage) ?? "";
        const fragment = htmlToFragment(sanitized);
        contentDiv.appendChild(fragment);
        popup.appendChild(contentDiv);

        if (isError && debugModeEnabled && debugInfo) {
            const debugHeading = document.createElement("div");
            debugHeading.textContent = t("contentDebugDetails", "Debug details");
            debugHeading.className = "translation-popup-debug-heading";
            popup.appendChild(debugHeading);

            const debugDetailsEl = document.createElement("pre");
            debugDetailsEl.textContent = debugInfo;
            debugDetailsEl.className = "translation-popup-debug-details";
            popup.appendChild(debugDetailsEl);
        }
    }

    function displayPopup(
        content: string,
        isError: boolean = false,
        isLoading: boolean = false,
        detectedLanguageName: string | null = null,
        targetLanguageName: string | null = null,
        isStreaming: boolean = false,
        requestId: string | null = null,
        debugInfo: string | null = null,
    ): void {
        console.log("displayPopup called with:", {
            content,
            isError,
            isLoading,
            detectedLanguageName,
            targetLanguageName,
        });
        if (isError && debugInfo) {
            debugError("Rendering popup error with debug details", {
                requestId,
                debugInfo,
            });
        }
        let createdPopup = false;
        let existingPopup = getPopupForRequestId(requestId);

        if (!existingPopup && !keepSelectionPopupOpenEnabled) {
            existingPopup =
                translationPopup && translationPopup.isConnected
                    ? translationPopup
                    : getAllTranslationPopups()[0] || null;
            if (existingPopup) {
                translationPopup = existingPopup;
            }
        }

        if (existingPopup && isStreaming) {
            translationPopup = existingPopup;
            updateStreamingPopup(existingPopup, content);
            syncPopupOutsideClickBehavior();
            return;
        }

        if (existingPopup && !isLoading) {
            translationPopup = existingPopup;
            console.log("Updating existing popup content.");
            renderFinalPopupContent(
                existingPopup,
                content,
                isError,
                detectedLanguageName,
                targetLanguageName,
                debugInfo,
            );
            addCloseButton(existingPopup);
            console.log("Existing popup updated:", existingPopup);
            syncPopupOutsideClickBehavior();
            return;
        }

        if (existingPopup && isLoading) {
            translationPopup = existingPopup;
            existingPopup.classList.remove("is-streaming");
            applyPopupThemeClass(existingPopup);
            setPopupVisualState(existingPopup, "loading");
            console.log("Popup already exists in loading state.");
        }

        if (!existingPopup) {
            console.log("Creating new popup.");
            if (!keepSelectionPopupOpenEnabled) {
                removePopup(false);
            }

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

            if (keepSelectionPopupOpenEnabled) {
                const existingPopupCount = getAllTranslationPopups().length;
                const cascadeOffset = Math.min(existingPopupCount * 16, 120);
                top += cascadeOffset;
                left += cascadeOffset;
            }

            const popupElement = document.createElement("div");
            popupElement.id = keepSelectionPopupOpenEnabled
                ? createPopupElementId(requestId)
                : TRANSLATION_POPUP_BASE_ID;
            popupElement.classList.add("translation-popup-extension");
            applyPopupThemeClass(popupElement);
            setPopupVisualState(popupElement, isError ? "error" : "default");
            registerPopup(popupElement, requestId);
            existingPopup = popupElement;
            createdPopup = true;

            popupElement.style.position = "absolute";
            popupElement.style.top = `${top}px`;
            popupElement.style.left = `${left}px`;
            popupElement.style.zIndex = "2147483647";
            popupElement.style.borderRadius = "5px";
            popupElement.style.padding = "10px 25px 10px 15px";
            popupElement.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
            popupElement.style.width = `${popupWidth}px`;
            popupElement.style.maxWidth = `${maxWidth}px`;
            popupElement.style.fontSize = "14px";
            popupElement.style.lineHeight = "1.4";
            popupElement.style.pointerEvents = "auto";

            popupElement.style.display = "block";
            popupElement.style.minWidth = `${minWidth}px`;
            popupElement.style.minHeight = "20px";
            popupElement.style.visibility = "visible";
            popupElement.style.opacity = "1";

            console.log(
                "Popup element created and styled (before content):",
                popupElement,
            );

            try {
                document.body.appendChild(popupElement);
                console.log("Popup appended to document body.");
            } catch (e) {
                console.error("Error appending popup to body:", e);
                return;
            }
            syncPopupOutsideClickBehavior();
        }

        if (isLoading) {
            existingPopup.classList.remove("is-streaming");
            applyPopupThemeClass(existingPopup);
            setPopupVisualState(existingPopup, "loading");
            clearElement(existingPopup);
            console.log("Setting loading content.");

            const spinnerContainer = document.createElement("div");
            spinnerContainer.className = "translation-popup-loading";

            const spinner = document.createElement("div");
            spinner.className = "translation-popup-spinner";

            const spinnerText = document.createElement("span");
            spinnerText.textContent = t("contentTranslating", "Translating...");

            spinnerContainer.appendChild(spinner);
            spinnerContainer.appendChild(spinnerText);
            existingPopup.appendChild(spinnerContainer);
        } else if (isStreaming) {
            updateStreamingPopup(existingPopup, content);
            return;
        } else {
            console.log("Setting final content:", content);
            renderFinalPopupContent(
                existingPopup,
                content,
                isError,
                detectedLanguageName,
                targetLanguageName,
                debugInfo,
            );
        }

        addCloseButton(existingPopup);
        if (keepSelectionPopupOpenEnabled && (createdPopup || !isStreaming)) {
            positionPopupToAvoidOverlap(existingPopup);
        }
        syncPopupOutsideClickBehavior();
        console.log("Popup content set:", existingPopup);
    }

    function addCloseButton(popupElement: HTMLElement): void {
        const existingButton = popupElement.querySelector(
            ".translation-popup-close-button",
        );
        if (existingButton) {
            existingButton.remove();
        }

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.textContent = "×";
        closeButton.className = "translation-popup-close-button";
        closeButton.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            const popupRequestId =
                popupElement.dataset[TRANSLATION_POPUP_REQUEST_ID_ATTR] || null;
            const shouldResetInProgress =
                !popupRequestId || popupRequestId === activeStreamRequestId;
            removePopup(shouldResetInProgress, popupElement);
        };
        popupElement.appendChild(closeButton);
    }

    function removePopup(
        resetInProgress: boolean = true,
        popupToRemove: HTMLElement | null = null,
    ): void {
        const popups =
            popupToRemove && popupToRemove.isConnected
                ? [popupToRemove]
                : getAllTranslationPopups();

        if (popups.length === 0) {
            return;
        }

        const shouldCancelActiveStream = popups.some((popup) => {
            const requestId = popup.dataset[TRANSLATION_POPUP_REQUEST_ID_ATTR];
            return (
                !popupToRemove ||
                Boolean(requestId && requestId === activeStreamRequestId)
            );
        });

        if (shouldCancelActiveStream) {
            cancelActiveStream();
        }

        if (resetInProgress) {
            selectionTranslateInProgress = false;
        }
        hideSelectionTranslateButton();

        for (const popup of popups) {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
            unregisterPopup(popup);
        }

        syncPopupOutsideClickBehavior();
    }

    function handleClickOutside(event: Event): void {
        const popup =
            translationPopup && translationPopup.isConnected
                ? translationPopup
                : getAllTranslationPopups()[0] || null;
        if (!popup || popup.contains(event.target as Node)) {
            return;
        }
        if (!loadingIndicator || !loadingIndicator.contains(event.target as Node)) {
            removePopup(true, popup);
        }
    }
}
