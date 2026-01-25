// Track if content script is already loaded
if (window.hasRun) {
    console.log("AI Translator Content Script already loaded - skipping initialization");
} else {
    window.hasRun = true;

    console.log("AI Translator Content Script Loaded - Top Level");

    // content.js - Handles displaying popups, extracting page text, replacing content, and manual translation.

    // --- Safe Translation Unit Selection (v2) ---
    // Tags to completely skip during traversal (never translate content within)
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

    // Interactive/form elements that should never be translated
    const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON"]);

    // Block-level tags that are candidates for translation units
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

    // Inline tags that are safe to keep within translation units
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

    // Extension UI selectors to exclude from translation
    const EXTENSION_UI_SELECTORS = [
        "#translation-popup-extension",
        "#translation-loading-indicator",
        "#ai-translator-selection-translate-button",
    ];

    // Unit size constraints
    const MAX_UNIT_CHARS = 800; // Preferred max size for a single translation unit
    const HARD_MAX_UNIT_CHARS = 2000; // Never exceed this (will force split)

    /**
     * Split text into sentences using common sentence-ending punctuation
     * @param {string} text
     * @returns {string[]}
     */
    function splitIntoSentences(text) {
        // Split on sentence-ending punctuation followed by whitespace
        // Handles: . ! ? and their Unicode equivalents
        const sentenceRegex = /(?<=[.!?。！？])\s+/;
        const sentences = text.split(sentenceRegex).filter((s) => s.trim().length > 0);
        return sentences;
    }

    /**
     * Split an oversized text into chunks that fit within size limits
     * Prefers sentence boundaries, falls back to word boundaries
     * @param {string} text
     * @param {number} maxChars
     * @returns {string[]}
     */
    function splitTextIntoChunks(text, maxChars = MAX_UNIT_CHARS) {
        if (text.length <= maxChars) {
            return [text];
        }

        const chunks = [];
        const sentences = splitIntoSentences(text);

        // If we got sentences, try to group them into chunks
        if (sentences.length > 1) {
            let currentChunk = "";
            for (const sentence of sentences) {
                if (sentence.length > maxChars) {
                    // This single sentence is too long, need to split it further
                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk.trim());
                        currentChunk = "";
                    }
                    // Split the long sentence by words
                    const wordChunks = splitByWords(sentence, maxChars);
                    chunks.push(...wordChunks);
                } else if (currentChunk.length + sentence.length + 1 <= maxChars) {
                    // Add to current chunk
                    currentChunk += (currentChunk.length > 0 ? " " : "") + sentence;
                } else {
                    // Current chunk is full, start a new one
                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk.trim());
                    }
                    currentChunk = sentence;
                }
            }
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
            }
            return chunks;
        }

        // No sentence boundaries found, fall back to word splitting
        return splitByWords(text, maxChars);
    }

    /**
     * Split text into fixed-size character slices (last resort for oversized words)
     * @param {string} text
     * @param {number} maxChars
     * @returns {string[]}
     */
    function splitByCharacters(text, maxChars) {
        const chunks = [];
        for (let i = 0; i < text.length; i += maxChars) {
            chunks.push(text.slice(i, i + maxChars));
        }
        return chunks;
    }

    /**
     * Split text by word boundaries when sentence splitting fails
     * @param {string} text
     * @param {number} maxChars
     * @returns {string[]}
     */
    function splitByWords(text, maxChars) {
        const chunks = [];
        const words = text.split(/\s+/);
        let currentChunk = "";

        for (const word of words) {
            if (word.length > HARD_MAX_UNIT_CHARS) {
                // Single word exceeds hard max - must split by characters
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = "";
                }
                const charChunks = splitByCharacters(word, HARD_MAX_UNIT_CHARS);
                chunks.push(...charChunks);
            } else if (word.length > maxChars) {
                // Single word exceeds soft max but fits in hard max - add as its own chunk
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = "";
                }
                chunks.push(word);
            } else if (currentChunk.length + word.length + 1 <= maxChars) {
                currentChunk += (currentChunk.length > 0 ? " " : "") + word;
            } else {
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = word;
            }
        }
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    }

    /**
     * Check if a unit needs splitting based on size constraints
     * @param {string} text
     * @returns {boolean}
     */
    function unitNeedsSplitting(text) {
        return text.length > MAX_UNIT_CHARS;
    }

    /**
     * Check if an element is hidden from rendering
     * @param {Element} el
     * @returns {boolean}
     */
    function isHiddenElement(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        // Check explicit hidden attribute
        if (el.hidden || el.getAttribute("hidden") !== null) {
            return true;
        }
        // Check aria-hidden="true"
        if (el.getAttribute("aria-hidden") === "true") {
            return true;
        }
        // Skip computed style check for performance (optional enhancement later)
        return false;
    }

    /**
     * Check if element is part of extension UI
     * @param {Element} el
     * @returns {boolean}
     */
    function isExtensionUI(el) {
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

    /**
     * Check if element contains interactive controls that should prevent translation
     * @param {Element} el
     * @returns {boolean}
     */
    function containsInteractiveControls(el) {
        if (INTERACTIVE_TAGS.has(el.tagName)) {
            return true;
        }
        // Check for role="button" or contenteditable
        if (
            el.getAttribute("role") === "button" ||
            el.getAttribute("contenteditable") === "true" ||
            el.isContentEditable
        ) {
            return true;
        }
        // Check for interactive descendants
        const interactiveDescendant = el.querySelector(
            'button, input, textarea, select, [role="button"], [contenteditable="true"]',
        );
        return interactiveDescendant !== null;
    }

    /**
     * Check if element contains nested block-level descendants
     * (which would make it not a "leaf-ish" block)
     * @param {Element} el
     * @returns {boolean}
     */
    function containsNestedBlocks(el) {
        for (const child of el.children) {
            if (BLOCK_LEVEL_TAGS.has(child.tagName)) {
                return true;
            }
            // Also check for DIV (common block container)
            if (child.tagName === "DIV" && child.textContent.trim().length > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if an element is a safe translation unit
     * A safe unit is a block-level element that:
     * - Has non-trivial text content
     * - Does not contain nested block-level descendants
     * - Does not contain interactive controls
     * - Is not hidden
     * @param {Element} el
     * @returns {boolean}
     */
    function isSafeTranslationUnit(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        // Must be a block-level candidate
        if (!BLOCK_LEVEL_TAGS.has(el.tagName)) {
            return false;
        }

        // Must have non-trivial text
        const textContent = el.textContent?.trim() || "";
        if (textContent.length < 2) {
            return false;
        }

        // Must not be hidden
        if (isHiddenElement(el)) {
            return false;
        }

        // Must not be in extension UI
        if (isExtensionUI(el)) {
            return false;
        }

        // Must not contain interactive controls
        if (containsInteractiveControls(el)) {
            return false;
        }

        // Must not contain nested blocks (leaf-ish constraint)
        if (containsNestedBlocks(el)) {
            return false;
        }

        return true;
    }

    /**
     * Collect safe translation units from the page
     * Returns an array of { element, serializedText, chunkIndex?, totalChunks? } objects
     * Oversized units are split into multiple chunks
     * @returns {Array<{element: Element, serializedText: string, chunkIndex?: number, totalChunks?: number}>}
     */
    function collectSafeTranslationUnits() {
        const units = [];
        const seenElements = new WeakSet();

        /**
         * Recursively traverse the DOM and collect safe units
         * @param {Element} root
         */
        function traverse(root) {
            if (!root || root.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            // Skip if in skip tags
            if (SKIP_TAGS.has(root.tagName)) {
                return;
            }

            // Skip hidden elements and their descendants
            if (isHiddenElement(root)) {
                return;
            }

            // Skip extension UI
            if (isExtensionUI(root)) {
                return;
            }

            // Check if this element is a safe translation unit
            if (isSafeTranslationUnit(root) && !seenElements.has(root)) {
                seenElements.add(root);
                const text = root.textContent.trim();

                // Check if unit needs splitting
                if (unitNeedsSplitting(text)) {
                    const chunks = splitTextIntoChunks(text, MAX_UNIT_CHARS);
                    console.log(
                        `Unit split into ${chunks.length} chunks (original: ${text.length} chars)`,
                    );
                    for (let i = 0; i < chunks.length; i++) {
                        units.push({
                            element: root,
                            serializedText: chunks[i],
                            chunkIndex: i,
                            totalChunks: chunks.length,
                        });
                    }
                } else {
                    units.push({
                        element: root,
                        serializedText: text,
                    });
                }
                // Don't traverse children - we've captured this unit
                return;
            }

            // Otherwise, traverse children
            for (const child of root.children) {
                traverse(child);
            }
        }

        // Start traversal from body
        traverse(document.body);

        console.log(`collectSafeTranslationUnits: found ${units.length} units`);
        return units;
    }

    // --- Placeholder Serialization (v2) ---
    // Uses paired markers like ⟦P0⟧ and ⟦/P0⟧ to mark inline element boundaries

    const PLACEHOLDER_OPEN = "⟦";
    const PLACEHOLDER_CLOSE = "⟧";

    /**
     * Serialize an element's content into text with placeholder markers for inline elements
     * @param {Element} element - The element to serialize
     * @returns {{text: string, placeholders: Map<number, {tag: string, node: Node}>}}
     */
    function serializeUnitWithPlaceholders(element) {
        const placeholders = new Map();
        let placeholderIndex = 0;
        let result = "";

        /**
         * Walk the DOM tree and emit text with placeholders
         * @param {Node} node
         */
        function walkNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                result += node.textContent;
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            const el = node;
            const tagName = el.tagName;

            // Check if this is an inline element we should wrap with placeholders
            if (INLINE_SAFE_TAGS.has(tagName)) {
                const idx = placeholderIndex++;
                placeholders.set(idx, { tag: tagName.toLowerCase(), node: el });

                // Emit opening placeholder
                result += `${PLACEHOLDER_OPEN}P${idx}${PLACEHOLDER_CLOSE}`;

                // Process children
                for (const child of el.childNodes) {
                    walkNode(child);
                }

                // Emit closing placeholder
                result += `${PLACEHOLDER_OPEN}/P${idx}${PLACEHOLDER_CLOSE}`;
            } else {
                // Not an inline tag we track - just process children
                for (const child of el.childNodes) {
                    walkNode(child);
                }
            }
        }

        // Walk all child nodes of the element
        for (const child of element.childNodes) {
            walkNode(child);
        }

        return { text: result.trim(), placeholders };
    }

    /**
     * Extract all placeholder tokens from a string
     * @param {string} text
     * @returns {Set<string>}
     */
    function extractPlaceholderTokens(text) {
        const tokens = new Set();
        const regex = new RegExp(
            `${escapeRegex(PLACEHOLDER_OPEN)}/?P\\d+${escapeRegex(PLACEHOLDER_CLOSE)}`,
            "g",
        );
        let match;
        while ((match = regex.exec(text)) !== null) {
            tokens.add(match[0]);
        }
        return tokens;
    }

    /**
     * Escape special regex characters in a string
     * @param {string} str
     * @returns {string}
     */
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /**
     * Validate that all placeholders from input appear unchanged in output
     * @param {string} inputText - The original serialized text with placeholders
     * @param {string} outputText - The translated text
     * @returns {{valid: boolean, missing: string[], extra: string[]}}
     */
    function validatePlaceholders(inputText, outputText) {
        const inputTokens = extractPlaceholderTokens(inputText);
        const outputTokens = extractPlaceholderTokens(outputText);

        const missing = [];
        const extra = [];

        // Check for missing placeholders
        for (const token of inputTokens) {
            if (!outputTokens.has(token)) {
                missing.push(token);
            }
        }

        // Check for extra/unexpected placeholders
        for (const token of outputTokens) {
            if (!inputTokens.has(token)) {
                extra.push(token);
            }
        }

        return {
            valid: missing.length === 0 && extra.length === 0,
            missing,
            extra,
        };
    }

    /**
     * Parse translated output with placeholders into segments
     * Returns array of {type: 'text' | 'placeholder', content: string, index?: number, isClose?: boolean}
     * @param {string} text
     * @returns {Array<{type: string, content: string, index?: number, isClose?: boolean}>}
     */
    function parsePlaceholderOutput(text) {
        const segments = [];
        const regex = new RegExp(
            `(${escapeRegex(PLACEHOLDER_OPEN)}(/?P)(\\d+)${escapeRegex(PLACEHOLDER_CLOSE)})`,
            "g",
        );

        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Add text before this placeholder
            if (match.index > lastIndex) {
                segments.push({
                    type: "text",
                    content: text.slice(lastIndex, match.index),
                });
            }

            // Add the placeholder
            const fullMatch = match[1];
            const prefix = match[2]; // "P" or "/P"
            const index = parseInt(match[3], 10);
            const isClose = prefix.startsWith("/");

            segments.push({
                type: "placeholder",
                content: fullMatch,
                index,
                isClose,
            });

            lastIndex = regex.lastIndex;
        }

        // Add remaining text after last placeholder
        if (lastIndex < text.length) {
            segments.push({
                type: "text",
                content: text.slice(lastIndex),
            });
        }

        return segments;
    }

    /**
     * Check if translated output appears truncated
     * @param {string} inputText
     * @param {string} outputText
     * @returns {boolean}
     */
    function isOutputTruncated(inputText, outputText) {
        const inputTokens = extractPlaceholderTokens(inputText);
        const outputTokens = extractPlaceholderTokens(outputText);

        // If we have fewer placeholders in output than input, likely truncated
        if (outputTokens.size < inputTokens.size) {
            return true;
        }

        // Check for unmatched opening placeholders in output
        const segments = parsePlaceholderOutput(outputText);
        const openStack = [];
        for (const seg of segments) {
            if (seg.type === "placeholder") {
                if (!seg.isClose) {
                    openStack.push(seg.index);
                } else {
                    const lastOpen = openStack.pop();
                    if (lastOpen !== seg.index) {
                        // Mismatched close tag
                        return true;
                    }
                }
            }
        }

        // If there are unclosed placeholders, likely truncated
        return openStack.length > 0;
    }

    // --- TranslationQueue (v2) ---
    // Manages concurrent translation of units with retry/backoff and caching

    const QUEUE_CONCURRENCY = 3;
    const QUEUE_TIMEOUT_MS = 15000;
    const QUEUE_MAX_RETRIES = 3;
    const QUEUE_BASE_BACKOFF_MS = 1000;

    /**
     * TranslationQueue - manages concurrent translation of units
     */
    class TranslationQueue {
        /**
         * @param {Object} context - Translation context for cache key generation
         * @param {string} context.provider - API provider (e.g., "openai", "anthropic")
         * @param {string} context.endpoint - API endpoint URL
         * @param {string} context.model - Model name
         * @param {string} context.targetLanguage - Target language code
         * @param {string} context.translationInstructions - Translation instructions
         */
        constructor(context = {}) {
            this.queue = [];
            this.activeCount = 0;
            this.stopped = false;
            this.cache = new Map();
            this.stats = {
                completed: 0,
                failed: 0,
                cached: 0,
                total: 0,
            };
            this.onProgress = null; // callback(stats)
            this.onUnitComplete = null; // callback(unit, result)

            // Store translation context for cache key generation
            this.context = context;
            // Pre-compute context hash for efficiency
            this.contextHash = this.hashString(
                JSON.stringify({
                    provider: context.provider || "",
                    endpoint: context.endpoint || "",
                    model: context.model || "",
                    targetLanguage: context.targetLanguage || "",
                    translationInstructions: context.translationInstructions || "",
                }),
            );
        }

        /**
         * Simple string hash function (djb2 algorithm)
         * @param {string} str
         * @returns {string}
         */
        hashString(str) {
            let hash = 5381;
            for (let i = 0; i < str.length; i++) {
                hash = (hash * 33) ^ str.charCodeAt(i);
            }
            return (hash >>> 0).toString(36);
        }

        /**
         * Generate a cache key for a unit
         * Cache key includes context (provider/model/endpoint/language/instructions)
         * and the serialized text with placeholders
         * @param {string} serializedText - Text with placeholder tokens (⟦P0⟧/⟦/P0⟧)
         * @returns {string}
         */
        getCacheKey(serializedText) {
            // Combine context hash with content hash for a unique cache key
            const contentHash = this.hashString(serializedText);
            return `${this.contextHash}:${contentHash}`;
        }

        /**
         * Add units to the queue
         * @param {Array<{element: Element, serializedText: string}>} units
         */
        addUnits(units) {
            this.stats.total += units.length;
            for (const unit of units) {
                this.queue.push({
                    ...unit,
                    retryCount: 0,
                    status: "pending",
                });
            }
        }

        /**
         * Start processing the queue
         * @returns {Promise<void>}
         */
        async start() {
            this.stopped = false;
            console.log(`TranslationQueue: starting with ${this.queue.length} units`);

            // Process queue with concurrency control
            const processNext = async () => {
                while (!this.stopped && this.queue.length > 0) {
                    // Wait if we're at concurrency limit
                    while (this.activeCount >= QUEUE_CONCURRENCY && !this.stopped) {
                        await this.sleep(50);
                    }

                    if (this.stopped) break;

                    // Get next pending unit
                    const unitIndex = this.queue.findIndex((u) => u.status === "pending");
                    if (unitIndex === -1) break;

                    const unit = this.queue[unitIndex];
                    unit.status = "processing";
                    this.activeCount++;

                    // Process in background
                    this.processUnit(unit).finally(() => {
                        this.activeCount--;
                    });
                }
            };

            // Start multiple workers up to concurrency limit
            const workers = [];
            for (let i = 0; i < QUEUE_CONCURRENCY; i++) {
                workers.push(processNext());
            }

            await Promise.all(workers);

            // Wait for all active work to complete
            while (this.activeCount > 0 && !this.stopped) {
                await this.sleep(50);
            }

            console.log("TranslationQueue: finished", this.stats);
        }

        /**
         * Stop processing (cancel remaining work)
         */
        stop() {
            this.stopped = true;
            console.log("TranslationQueue: stopped");
        }

        /**
         * Process a single unit with retry logic
         * @param {Object} unit
         */
        async processUnit(unit) {
            // Serialize with placeholders first - this is used for both cache key and translation
            const { text: serializedWithPlaceholders, placeholders } =
                serializeUnitWithPlaceholders(unit.element);

            // Generate cache key using placeholder-serialized text (not plain textContent)
            const cacheKey = this.getCacheKey(serializedWithPlaceholders);

            // Check cache first
            if (this.cache.has(cacheKey)) {
                console.log("TranslationQueue: cache hit");
                unit.result = this.cache.get(cacheKey);
                unit.placeholders = placeholders;
                unit.status = "completed";
                this.stats.completed++;
                this.stats.cached++;
                this.notifyProgress();
                if (this.onUnitComplete) {
                    this.onUnitComplete(unit, { success: true, cached: true });
                }
                return;
            }

            while (unit.retryCount <= QUEUE_MAX_RETRIES && !this.stopped) {
                try {
                    const result = await this.translateWithTimeout(
                        serializedWithPlaceholders,
                        unit.retryCount > 0, // isRetry
                    );

                    // Validate placeholders
                    const validation = validatePlaceholders(
                        serializedWithPlaceholders,
                        result,
                    );

                    if (!validation.valid) {
                        console.warn(
                            "TranslationQueue: placeholder validation failed",
                            validation,
                        );
                        if (unit.retryCount < QUEUE_MAX_RETRIES) {
                            unit.retryCount++;
                            continue; // Retry with stricter prompt
                        }
                        // Final attempt failed - use result anyway or fallback
                    }

                    // Success
                    unit.result = result;
                    unit.placeholders = placeholders;
                    unit.status = "completed";
                    this.cache.set(cacheKey, result);
                    this.stats.completed++;
                    this.notifyProgress();
                    if (this.onUnitComplete) {
                        this.onUnitComplete(unit, { success: true });
                    }
                    return;
                } catch (error) {
                    console.error("TranslationQueue: unit error", error);

                    // Check if retryable error
                    if (
                        this.isRetryableError(error) &&
                        unit.retryCount < QUEUE_MAX_RETRIES
                    ) {
                        unit.retryCount++;
                        const backoff = this.calculateBackoff(unit.retryCount);
                        console.log(
                            `TranslationQueue: retrying in ${backoff}ms (attempt ${unit.retryCount})`,
                        );
                        await this.sleep(backoff);
                        continue;
                    }

                    // Non-retryable or max retries exceeded
                    unit.error = error.message;
                    unit.status = "failed";
                    this.stats.failed++;
                    this.notifyProgress();
                    if (this.onUnitComplete) {
                        this.onUnitComplete(unit, {
                            success: false,
                            error: error.message,
                        });
                    }
                    return;
                }
            }
        }

        /**
         * Translate with timeout
         * @param {string} content
         * @param {boolean} isRetry
         * @returns {Promise<string>}
         */
        translateWithTimeout(content, isRetry) {
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error("Translation timeout"));
                }, QUEUE_TIMEOUT_MS);

                chrome.runtime.sendMessage(
                    {
                        action: "translateUnit",
                        content,
                        meta: { isPlaceholderFormat: true, isRetry },
                    },
                    (response) => {
                        clearTimeout(timeoutId);
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }
                        if (response?.error) {
                            reject(new Error(response.error));
                            return;
                        }
                        if (response?.translatedText) {
                            resolve(response.translatedText);
                        } else {
                            reject(new Error("No translation received"));
                        }
                    },
                );
            });
        }

        /**
         * Check if an error is retryable (429, 503, network)
         * @param {Error} error
         * @returns {boolean}
         */
        isRetryableError(error) {
            const message = error.message?.toLowerCase() || "";
            return (
                message.includes("429") ||
                message.includes("503") ||
                message.includes("rate limit") ||
                message.includes("timeout") ||
                message.includes("network") ||
                message.includes("fetch failed")
            );
        }

        /**
         * Calculate exponential backoff delay
         * @param {number} retryCount
         * @returns {number}
         */
        calculateBackoff(retryCount) {
            // Exponential backoff with jitter
            const base = QUEUE_BASE_BACKOFF_MS * Math.pow(2, retryCount - 1);
            const jitter = Math.random() * 500;
            return Math.min(base + jitter, 30000); // Cap at 30s
        }

        /**
         * Notify progress callback
         */
        notifyProgress() {
            if (this.onProgress) {
                this.onProgress({ ...this.stats });
            }
        }

        /**
         * Sleep helper
         * @param {number} ms
         * @returns {Promise<void>}
         */
        sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        /**
         * Get current stats
         * @returns {Object}
         */
        getStats() {
            return { ...this.stats };
        }
    }

    // --- Apply Translation to DOM (v2) ---

    /**
     * Apply translated text with placeholders to an element by updating text nodes
     * This preserves the DOM structure and only modifies text content
     * @param {Element} element - The element to update
     * @param {string} translatedText - The translated text with placeholders
     * @param {Map<number, {tag: string, node: Node}>} placeholders - Placeholder to node mapping
     * @returns {boolean} - True if successful
     */
    function applyTranslationToUnit(element, translatedText, placeholders) {
        try {
            console.log(
                `applyTranslationToUnit: applying to ${element.tagName}`,
                `(${translatedText.length} chars, ${placeholders.size} placeholders)`,
            );

            // Parse the translated output into segments
            const segments = parsePlaceholderOutput(translatedText);

            // Collect all text nodes in the element
            const textNodes = [];
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
            let node;
            while ((node = walker.nextNode())) {
                textNodes.push(node);
            }

            if (textNodes.length === 0) {
                console.warn("applyTranslationToUnit: no text nodes found");
                return false;
            }

            // Build a mapping from placeholder index to inline element
            // The strategy: walk through segments and associate text with correct nodes
            // For simplicity in v1, we'll use a simpler approach:
            // Extract just the text portions and update text nodes sequentially

            // Extract translated text only (ignore placeholder structure for now)
            const translatedTextParts = [];
            for (const seg of segments) {
                if (seg.type === "text") {
                    translatedTextParts.push(seg.content);
                }
            }
            const fullTranslatedText = translatedTextParts.join("");

            // Simple approach: if single text node, replace its content
            if (textNodes.length === 1) {
                textNodes[0].textContent = fullTranslatedText;
                console.log("applyTranslationToUnit: updated single text node");
                return true;
            }

            // For multiple text nodes, we need to be smarter
            // Strategy: distribute translated text proportionally based on original lengths
            const originalLengths = textNodes.map((n) => (n.textContent || "").length);
            const totalOriginalLength = originalLengths.reduce(
                (sum, len) => sum + len,
                0,
            );

            if (totalOriginalLength === 0) {
                console.warn("applyTranslationToUnit: total original length is 0");
                return false;
            }

            // Distribute new text proportionally
            let offset = 0;
            for (let i = 0; i < textNodes.length; i++) {
                const proportion = originalLengths[i] / totalOriginalLength;
                const charCount = Math.round(proportion * fullTranslatedText.length);

                // For all but the last node, use proportional amount
                // Last node gets the remainder to avoid rounding issues
                if (i === textNodes.length - 1) {
                    textNodes[i].textContent = fullTranslatedText.slice(offset);
                } else {
                    textNodes[i].textContent = fullTranslatedText.slice(
                        offset,
                        offset + charCount,
                    );
                    offset += charCount;
                }
            }

            console.log(`applyTranslationToUnit: updated ${textNodes.length} text nodes`);
            return true;
        } catch (error) {
            console.error("applyTranslationToUnit error:", error);
            return false;
        }
    }

    /**
     * Simple fallback: just replace textContent (loses inline formatting)
     * @param {Element} element
     * @param {string} translatedText
     * @returns {boolean}
     */
    function applyPlainTextFallback(element, translatedText) {
        try {
            // Remove placeholder markers for plain text fallback
            const cleanText = translatedText.replace(/⟦\/?P\d+⟧/g, "").trim();

            // Find all text nodes and update the first one, clear others
            const textNodes = [];
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
            let node;
            while ((node = walker.nextNode())) {
                textNodes.push(node);
            }

            if (textNodes.length > 0) {
                textNodes[0].textContent = cleanText;
                for (let i = 1; i < textNodes.length; i++) {
                    textNodes[i].textContent = "";
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error("applyPlainTextFallback error:", error);
            return false;
        }
    }

    // --- ELD Language Detection (runs in content script) ---
    const MAX_TEXT_SAMPLE_FOR_DETECTION = 512;

    // Language code to name mapping (ISO 639-1)
    const LANGUAGE_NAMES = {
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

    function getLanguageDisplayName(languageCode) {
        if (!languageCode) return "Unknown";
        const normalizedCode = languageCode.toLowerCase().split("-")[0];
        return (
            LANGUAGE_NAMES[languageCode] || LANGUAGE_NAMES[normalizedCode] || languageCode
        );
    }

    function detectLanguage(text) {
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

    // --- End ELD Language Detection ---

    // Track mouse position
    window.lastMouseX = 0;
    window.lastMouseY = 0;
    document.addEventListener("mousemove", function (e) {
        window.lastMouseX = e.clientX;
        window.lastMouseY = e.clientY;
    });

    let translationPopup = null; // For selected text popup
    let loadingIndicator = null; // For visual feedback during API calls
    let originalBodyContent = null; // Store original content for potential revert (basic)
    let isTranslated = false; // Track if the page is currently translated
    let stopTranslationFlag = false; // Flag to stop translation process

    const STREAM_PORT_NAME = "translationStream";
    let activeStreamPort = null;
    let activeStreamRequestId = null;
    let completedStreamRequestId = null;

    const SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY = "showTranslateButtonOnSelection";
    let showTranslateButtonOnSelectionEnabled = true;
    let selectionTranslateButton = null;
    let selectionTranslateInProgress = false;
    let selectionListenerCleanup = null;
    let currentDetectedLanguage = null;
    let currentDetectedLanguageName = null;

    // --- Message Listener (Handles multiple actions) ---
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Content Script Received Action:", request.action, request);

        switch (request.action) {
            // --- Display Popup for Selected Text (Handles Loading and Result) ---
            case "displayTranslation": {
                const requestId = request.requestId || null;
                const isStreaming = request.isStreaming === true;

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

                // If it's the final result (not loading), remove any separate loading indicator
                if (!request.isLoading && !isStreaming) {
                    removeLoadingIndicator();
                    selectionTranslateInProgress = false;
                    hideSelectionTranslateButton();
                }
                // Call displayPopup, passing the loading state, error status, and detection info
                displayPopup(
                    request.text,
                    request.isError,
                    request.isLoading,
                    request.detectedLanguageName,
                    request.targetLanguageName,
                    isStreaming,
                );

                if (requestId && !request.isLoading && !isStreaming) {
                    completedStreamRequestId = requestId;
                    activeStreamRequestId = null;
                }

                sendResponse({ status: "Popup displayed/updated" });
                break;
            }

            // --- Request from Background to Get Page Text (for full-page translation) ---
            case "getPageText":
                (function () {
                    const pageHtml = extractMainContentHTML();
                    console.log("Extracted page HTML length:", pageHtml.length);
                    sendResponse({ text: pageHtml });
                })();
                return true; // Explicitly indicate async-style handling done synchronously here

            // --- Apply Full Page Translation (HTML-based, preserves structure) ---
            case "applyFullPageTranslation":
                if (request.html) {
                    try {
                        const target = document.querySelector("main") || document.body;
                        console.log(
                            "Applying full page translation to target element:",
                            target.tagName,
                            "Translated HTML length:",
                            request.html.length,
                        );
                        setSanitizedContent(target, request.html);
                        removeLoadingIndicator();
                        sendResponse({ status: "applied" });
                    } catch (e) {
                        console.error("Error applying full page translation:", e);
                        removeLoadingIndicator();
                        sendResponse({ status: "error", message: e.message });
                    }
                } else {
                    console.error("applyFullPageTranslation called without html content");
                    removeLoadingIndicator();
                    sendResponse({ status: "error", message: "No HTML provided" });
                }
                break;

            // --- Extract Selected HTML (for hyperlink preservation) ---
            case "extractSelectedHtml":
                const selectedHtml = extractSelectedHtml();
                console.log("Extracted selected HTML:", selectedHtml);
                sendResponse({ html: selectedHtml });
                break;

            // --- Request from Background to Start Element Translation ---
            case "startElementTranslation":
                removeLoadingIndicator();
                if (request.isError) {
                    displayPopup(`Translation Error: ${request.text}`, true);
                    console.error("Element translation failed:", request.text);
                } else if (!isTranslated) {
                    console.log("Starting page translation v2 (placeholder-based).");
                    translatePageV2(); // Use new v2 translation
                    // Note: isTranslated is set by translatePageV2 on completion
                } else {
                    console.log("Page already translated, skipping translation.");
                }
                sendResponse({ status: "received" });
                break;

            // --- Handle Element Translation Result ---
            case "elementTranslationResult":
                handleElementTranslationResult(request);
                sendResponse({ status: "received" });
                break;

            // --- Show/Hide Loading Indicator (Now primarily for Full Page) ---
            case "showLoadingIndicator":
                // Display the loading indicator only for full page translations now
                if (request.isFullPage) {
                    displayLoadingIndicator("Translating page...");
                } else {
                    // For selected text, the popup itself shows loading state
                    console.log(
                        "Loading indicator request ignored for selected text (popup handles it).",
                    );
                }
                sendResponse({ status: "received" });
                break;

            default:
                console.log("Unknown action received:", request.action);
                sendResponse({ status: "unknown action" });
                break;
        }

        // Return true if you intend to send a response asynchronously (like for getPageText)
        // For others, it's okay to return false or nothing.
        return request.action === "getPageText";
    });

    chrome.runtime.onConnect.addListener((port) => {
        if (port.name !== STREAM_PORT_NAME) {
            return;
        }

        activeStreamPort = port;

        port.onMessage.addListener((message) => {
            if (message?.action !== "streamTranslationUpdate") {
                return;
            }
            handleStreamUpdate(message);
        });

        port.onDisconnect.addListener(() => {
            if (activeStreamPort === port) {
                activeStreamPort = null;
                activeStreamRequestId = null;
            }
        });
    });

    chrome.storage.sync.get([SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.warn(
                "Error reading selection button setting:",
                chrome.runtime.lastError.message,
            );
            showTranslateButtonOnSelectionEnabled = true;
        } else {
            const stored = result?.[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY];
            showTranslateButtonOnSelectionEnabled =
                typeof stored === "boolean" ? stored : true;
        }

        updateSelectionTranslateButtonState();
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync") {
            return;
        }
        if (!changes[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY]) {
            return;
        }
        const nextValue = changes[SHOW_TRANSLATE_BUTTON_ON_SELECTION_KEY].newValue;
        showTranslateButtonOnSelectionEnabled =
            typeof nextValue === "boolean" ? nextValue : true;
        updateSelectionTranslateButtonState();
    });

    function updateSelectionTranslateButtonState() {
        if (showTranslateButtonOnSelectionEnabled) {
            ensureSelectionTranslateButton();
            attachSelectionTranslateListeners();
        } else {
            detachSelectionTranslateListeners();
            hideSelectionTranslateButton();
        }
    }

    function ensureSelectionTranslateButton() {
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

            // Use the new message with detected language info
            chrome.runtime.sendMessage(
                {
                    action: "translateSelectedHtmlWithDetection",
                    html,
                    detectedLanguage: currentDetectedLanguage,
                    detectedLanguageName: currentDetectedLanguageName,
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        selectionTranslateInProgress = false;
                        displayPopup(
                            `Translation Error: ${chrome.runtime.lastError.message}`,
                            true,
                            false,
                        );
                        return;
                    }

                    if (response?.status && response.status !== "ok") {
                        selectionTranslateInProgress = false;
                        displayPopup(
                            `Translation Error: ${response.message || "Unknown error"}`,
                            true,
                            false,
                        );
                    }
                },
            );
        });

        document.body.appendChild(selectionTranslateButton);
    }

    function attachSelectionTranslateListeners() {
        if (selectionListenerCleanup) {
            return;
        }

        let debounceTimer = null;

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

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                hideSelectionTranslateButton();
            }
        };

        const onDocumentMouseDown = (event) => {
            if (
                selectionTranslateButton &&
                selectionTranslateButton.contains(event.target)
            ) {
                return;
            }

            if (translationPopup && translationPopup.contains(event.target)) {
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

    function detachSelectionTranslateListeners() {
        if (!selectionListenerCleanup) {
            return;
        }
        selectionListenerCleanup();
        selectionListenerCleanup = null;
    }

    function hideSelectionTranslateButton() {
        if (!selectionTranslateButton) {
            return;
        }
        selectionTranslateButton.style.display = "none";
    }

    function updateSelectionTranslateButtonPosition() {
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
                ? selection.anchorNode
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

        // Check language BEFORE showing button to avoid flash
        detectAndShowButton(selectedText, rect);
    }

    /**
     * Detect language first, then show button only if appropriate
     */
    function detectAndShowButton(text, rect) {
        // Reset current detection
        currentDetectedLanguage = null;
        currentDetectedLanguageName = null;

        // Detect language locally using ELD
        const detectionResult = detectLanguage(text);

        if (!detectionResult) {
            console.log("Language detection failed or unavailable, not showing button");
            hideSelectionTranslateButton();
            return;
        }

        // Get target language from background to compare
        chrome.runtime.sendMessage({ action: "getTargetLanguage" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn(
                    "Failed to get target language:",
                    chrome.runtime.lastError.message,
                );
                hideSelectionTranslateButton();
                return;
            }

            const targetLanguage = response?.targetLanguage || "en";

            // Compare detected language with target language
            const detectedNormalized = detectionResult.language
                .toLowerCase()
                .split("-")[0];
            const targetNormalized = targetLanguage.toLowerCase().split("-")[0];
            const isSameLanguage = detectedNormalized === targetNormalized;

            if (isSameLanguage) {
                console.log(
                    "Detected language matches target language, not showing button",
                );
                hideSelectionTranslateButton();
                return;
            }

            // Check if translation started while we were waiting for target language
            if (selectionTranslateInProgress) {
                return;
            }

            // Update detection state
            currentDetectedLanguage = detectionResult.language;
            currentDetectedLanguageName = detectionResult.languageName;

            // Now show the button
            showButtonAtPosition(rect, currentDetectedLanguageName);
        });
    }

    /**
     * Position and show the translate button
     */
    function showButtonAtPosition(rect, languageName) {
        if (!selectionTranslateButton) {
            return;
        }

        // Never show button if translation is in progress
        if (selectionTranslateInProgress) {
            return;
        }

        // Verify selection still exists (user might have clicked away during detection)
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            return;
        }

        const margin = 8;

        // Position the button (use visibility hidden first to measure)
        selectionTranslateButton.style.visibility = "hidden";
        selectionTranslateButton.style.display = "inline-flex";

        const top = window.scrollY + rect.bottom + margin;

        let left = window.scrollX + rect.left;
        const buttonWidth = selectionTranslateButton.offsetWidth || 100;
        const maxLeft = window.scrollX + window.innerWidth - buttonWidth - margin;
        left = Math.min(Math.max(left, window.scrollX + margin), maxLeft);

        selectionTranslateButton.style.top = `${top}px`;
        selectionTranslateButton.style.left = `${left}px`;

        // Update label
        updateButtonLabel(languageName);

        // Now make it visible
        selectionTranslateButton.style.visibility = "visible";
    }

    /**
     * Update button label to show detected language
     */
    function updateButtonLabel(languageName) {
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

    // --- Function to Extract Selected HTML Content ---
    // This extracts the HTML of the selected text range to preserve hyperlinks and formatting
    function extractSelectedHtml() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return null; // No content selected

        // Clone the selected contents
        const fragment = range.cloneContents();

        // Serialize to HTML
        const tempDiv = document.createElement("div");
        tempDiv.appendChild(fragment);

        // Simplify the HTML before returning
        return simplifyHtmlForTranslation(tempDiv.innerHTML);
    }

    // --- Function to Simplify HTML for Translation ---
    // Strips layout wrappers while preserving meaningful formatting
    function simplifyHtmlForTranslation(html) {
        if (!html || typeof html !== "string") {
            return html;
        }

        // Tags to keep (preserve element; strip attributes except href on <a>)
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

        // Tags to unwrap (remove tag but keep contents)
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

        // Tags to remove entirely (drop element + content)
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

        // Allowed URL schemes for href
        const ALLOWED_SCHEMES = ["http:", "https:", "mailto:"];

        // Parse HTML into a detached container
        const root = document.createElement("div");
        root.innerHTML = html;

        // Step 1: Pre-remove all REMOVE tags
        REMOVE_TAGS.forEach((tag) => {
            root.querySelectorAll(tag).forEach((el) => el.remove());
        });

        // Step 2: Transform div blocks - convert to p if they have text content
        const divs = Array.from(root.querySelectorAll("div"));
        for (const div of divs) {
            if (div.textContent.trim() !== "") {
                // Replace div with p, preserving children
                const p = document.createElement("p");
                while (div.firstChild) {
                    p.appendChild(div.firstChild);
                }
                div.parentNode.replaceChild(p, div);
            } else {
                // Empty div - remove it
                div.remove();
            }
        }

        // Step 3: Walk the tree bottom-up and process nodes
        // We need to collect all elements first, then process from deepest to shallowest
        function processNode(node) {
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            // Process children first (bottom-up)
            Array.from(node.children).forEach((child) => processNode(child));

            const tagName = node.tagName.toLowerCase();

            if (KEEP_TAGS.has(tagName)) {
                // Strip all attributes except href on <a> tags
                const attrs = Array.from(node.attributes);
                for (const attr of attrs) {
                    if (tagName === "a" && attr.name === "href") {
                        // Sanitize href
                        const sanitizedHref = sanitizeHref(attr.value);
                        if (sanitizedHref) {
                            node.setAttribute("href", sanitizedHref);
                        } else {
                            node.removeAttribute("href");
                        }
                    } else {
                        node.removeAttribute(attr.name);
                    }
                }
            } else if (UNWRAP_TAGS.has(tagName) || !KEEP_TAGS.has(tagName)) {
                // Unwrap: replace element with its children
                unwrapElement(node);
            }
        }

        // Helper: Sanitize href value
        function sanitizeHref(href) {
            if (!href || typeof href !== "string") {
                return null;
            }

            const trimmed = href.trim();
            if (trimmed === "") {
                return null;
            }

            // Check for allowed schemes
            try {
                const url = new URL(trimmed, window.location.href);
                if (ALLOWED_SCHEMES.some((scheme) => url.protocol === scheme)) {
                    return trimmed;
                }
                return null;
            } catch {
                // If URL parsing fails, check if it's a relative URL (no scheme)
                if (!trimmed.includes(":") || trimmed.startsWith("/")) {
                    return trimmed;
                }
                return null;
            }
        }

        // Helper: Unwrap an element (replace with its children)
        function unwrapElement(element) {
            const parent = element.parentNode;
            if (!parent) {
                return;
            }

            while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
        }

        // Process all children of root
        Array.from(root.children).forEach((child) => processNode(child));

        return root.innerHTML;
    }

    // --- Function to Extract Main Content HTML ---
    // This extracts HTML content to preserve formatting for translation
    function extractMainContentHTML() {
        // Try to target the main content area if possible, otherwise use body
        const mainElement = document.querySelector("main") || document.body;
        // Clone the element to avoid modifying the original
        const clonedBody = mainElement.cloneNode(true);

        // Remove unwanted elements but keep their structure
        clonedBody
            .querySelectorAll(
                'script, style, nav, header, footer, aside, form, button, input, textarea, select, [aria-hidden="true"], noscript',
            )
            .forEach((el) => el.remove());

        // Return the innerHTML with formatting preserved
        return clonedBody.innerHTML;
    }

    // --- New Element-Based Translation Functions ---

    /**
     * Get all translatable elements from the page
     * IMPROVED: Now extracts plain text content only for translation
     */
    function getTranslatableElements() {
        const elements = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function (node) {
                    // Skip nodes inside <script>, <style>, <noscript> tags
                    if (
                        node.parentElement &&
                        ["SCRIPT", "STYLE", "NOSCRIPT"].includes(
                            node.parentElement.tagName,
                        )
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Skip nodes that are part of the extension's UI
                    if (
                        node.closest("#translation-popup-extension") ||
                        node.closest("#translation-loading-indicator")
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Skip form elements and buttons
                    if (
                        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(node.tagName)
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Include elements that have text content
                    const textContent = node.textContent?.trim() || "";
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
                element: node,
                text: extractPlainText(node), // NEW: Extract only plain text, no HTML
                path: getElementPath(node),
            });
        }

        return elements;
    }

    /**
     * Extract only plain text content from an element, removing all HTML tags
     * This ensures we send only text to the AI, not HTML structure
     */
    function extractPlainText(element) {
        // Get the text content directly - this strips all HTML tags
        return element.textContent.trim();
    }

    /**
     * Get a unique path for an element to help with identification
     */
    function getElementPath(element) {
        if (element === document.body) return "body";

        const parts = [];
        while (element && element !== document.body) {
            const part = element.tagName.toLowerCase();
            const index = Array.from(element.parentNode.children).indexOf(element) + 1;
            parts.unshift(`${part}:nth-child(${index})`);
            element = element.parentElement;
        }
        return parts.join(" > ");
    }

    /**
     * Find element by path (for translation result mapping)
     */
    function findElementByPath(path) {
        try {
            // Simple selector-based approach for common elements
            if (path.includes(" > ")) {
                const parts = path.split(" > ");
                let element = document.body;

                for (const part of parts) {
                    const [tag, nthChild] = part.split(":nth-child(");
                    const index = parseInt(nthChild.replace(")", "")) - 1;
                    element = element.children[index];
                    if (!element || element.tagName.toLowerCase() !== tag) {
                        return null;
                    }
                }
                return element;
            }

            // Handle body case
            if (path === "body") {
                return document.body;
            }

            return null;
        } catch (error) {
            console.warn("Error finding element by path:", error);
            return null;
        }
    }

    /**
     * Translate page elements asynchronously with batch processing.
     * - Uses small concurrency for providers with stricter rate limits (like OpenRouter).
     * - Shows per-element error markers when a translation fails.
     */
    async function translatePageElements() {
        console.log("Starting element-by-element page translation...");

        // Reset stop flag
        stopTranslationFlag = false;

        const elements = getTranslatableElements();
        console.log(`Found ${elements.length} translatable elements`);

        if (elements.length === 0) {
            console.log("No translatable elements found");
            return;
        }

        // Show progress indicator
        displayLoadingIndicator(`Translating ${elements.length} elements...`);

        // Use small concurrency to avoid provider rate limits (e.g., OpenRouter)
        const batchSize = 3;
        const batches = [];
        for (let i = 0; i < elements.length; i += batchSize) {
            batches.push(elements.slice(i, i + batchSize));
        }

        let completed = 0;
        let errorCount = 0;

        // Process batches sequentially; within each batch we use limited parallelism.
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            // Check if translation was stopped
            if (stopTranslationFlag) {
                console.log("Translation stopped by user.");
                removeLoadingIndicator();
                displayPopup("Translation stopped by user.", true, false);
                return;
            }

            const batch = batches[batchIndex];

            try {
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
                            // Mark the individual element so failures are visible in-page
                            markElementTranslationError(item.element, error);
                        }

                        // Update progress indicator
                        updateLoadingProgress(completed, elements.length, errorCount);
                    }),
                );

                console.log(`Completed batch ${batchIndex + 1}/${batches.length}`);
            } catch (error) {
                console.error("Batch processing error:", error);
            }
        }

        console.log(
            `Translation complete. ${completed} elements translated, ${errorCount} errors.`,
        );

        // Remove loading indicator when done
        setTimeout(() => removeLoadingIndicator(), 1000);
    }

    // --- Full-Page Translation V2 (placeholder-based) ---
    let activeTranslationQueue = null;

    /**
     * Translate page using v2 safe units + placeholder system
     * This is the new approach that preserves DOM structure better
     */
    async function translatePageV2() {
        console.log("Starting translatePageV2...");

        // Reset any previous translation state
        if (activeTranslationQueue) {
            activeTranslationQueue.stop();
            activeTranslationQueue = null;
        }
        stopTranslationFlag = false;

        // Phase 1: Preparing - collect safe units
        displayLoadingIndicatorV2("Preparing...", "preparing");
        const units = collectSafeTranslationUnits();

        if (units.length === 0) {
            console.log("No safe translation units found");
            displayLoadingIndicatorV2("No translatable content found", "done");
            setTimeout(() => removeLoadingIndicator(), 2000);
            return;
        }

        console.log(`Found ${units.length} safe translation units`);

        // Fetch translation context for cache key generation
        const context = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { action: "getTranslationContext" },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn(
                            "Failed to get translation context:",
                            chrome.runtime.lastError,
                        );
                        resolve({});
                    } else {
                        resolve(response || {});
                    }
                },
            );
        });
        console.log("Translation context for cache:", {
            provider: context.provider,
            model: context.model,
            targetLanguage: context.targetLanguage,
        });

        // Phase 2: Translating
        const queue = new TranslationQueue(context);
        activeTranslationQueue = queue;

        queue.addUnits(units);

        // Progress callback
        queue.onProgress = (stats) => {
            const errorText = stats.failed > 0 ? ` (${stats.failed} errors)` : "";
            const cachedText = stats.cached > 0 ? ` [${stats.cached} cached]` : "";
            displayLoadingIndicatorV2(
                `Translating ${stats.completed}/${stats.total}${errorText}${cachedText}`,
                "translating",
            );
        };

        // Unit completion callback - apply translation to DOM
        queue.onUnitComplete = (unit, result) => {
            if (result.success && unit.result) {
                // Apply the translation
                const applied = applyTranslationToUnit(
                    unit.element,
                    unit.result,
                    unit.placeholders || new Map(),
                );
                if (!applied) {
                    // Fallback to plain text
                    applyPlainTextFallback(unit.element, unit.result);
                }
            } else if (!result.success) {
                // Mark error on element
                markElementTranslationError(
                    unit.element,
                    new Error(result.error || "Translation failed"),
                );
            }
        };

        displayLoadingIndicatorV2(`Translating 0/${units.length}`, "translating");

        try {
            await queue.start();

            // Phase 3: Done
            const stats = queue.getStats();
            if (queue.stopped) {
                displayLoadingIndicatorV2(
                    `Stopped. Translated ${stats.completed}/${stats.total}`,
                    "stopped",
                );
            } else {
                const summary =
                    stats.failed > 0
                        ? `Done. ${stats.completed} translated, ${stats.failed} errors`
                        : `Done. ${stats.completed} translated`;
                displayLoadingIndicatorV2(summary, "done");
            }

            isTranslated = true;
            setTimeout(() => removeLoadingIndicator(), 3000);
        } catch (error) {
            console.error("translatePageV2 error:", error);
            displayLoadingIndicatorV2(`Error: ${error.message}`, "error");
            setTimeout(() => removeLoadingIndicator(), 5000);
        }

        activeTranslationQueue = null;
    }

    /**
     * Stop the v2 translation
     */
    function stopTranslationV2() {
        stopTranslationFlag = true;
        if (activeTranslationQueue) {
            activeTranslationQueue.stop();
        }
        console.log("Translation V2 stopped");
    }

    /**
     * Display loading indicator with state-aware styling
     * @param {string} message
     * @param {string} state - preparing | translating | done | stopped | error
     */
    function displayLoadingIndicatorV2(message, state = "translating") {
        removeLoadingIndicator();

        loadingIndicator = document.createElement("div");
        loadingIndicator.id = "translation-loading-indicator";

        // Build UI
        const stateIcon = document.createElement("span");
        stateIcon.className = "state-icon";

        const progressText = document.createElement("span");
        progressText.className = "progress-text";
        progressText.textContent = message;

        const stopButtonEl = document.createElement("button");
        stopButtonEl.className = "stop-button";
        stopButtonEl.textContent = "Stop";
        stopButtonEl.style.display = state === "translating" ? "inline-block" : "none";

        loadingIndicator.appendChild(stateIcon);
        loadingIndicator.appendChild(progressText);
        loadingIndicator.appendChild(stopButtonEl);

        // State-specific styling
        const stateColors = {
            preparing: { bg: "rgba(59, 130, 246, 0.9)", icon: "..." },
            translating: { bg: "rgba(16, 185, 129, 0.9)", icon: "..." },
            done: { bg: "rgba(34, 197, 94, 0.9)", icon: "check" },
            stopped: { bg: "rgba(251, 191, 36, 0.9)", icon: "pause" },
            error: { bg: "rgba(239, 68, 68, 0.9)", icon: "x" },
        };

        const stateConfig = stateColors[state] || stateColors.translating;

        // Basic Styling
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
        loadingIndicator.style.gap = "10px";
        loadingIndicator.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";

        // State icon styling
        stateIcon.textContent =
            stateConfig.icon === "..."
                ? ""
                : stateConfig.icon === "check"
                  ? "✓"
                  : stateConfig.icon === "pause"
                    ? "⏸"
                    : "✗";
        stateIcon.style.fontSize = "16px";

        // Stop button styling
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
        stopButtonEl.onclick = stopTranslationV2;

        document.body.appendChild(loadingIndicator);
    }

    /**
     * Attach a small inline error indicator near the element that failed to translate.
     */
    function markElementTranslationError(element, error) {
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

    /**
     * Stop translation process
     */
    function stopTranslation() {
        stopTranslationFlag = true;
        removeLoadingIndicator();
        console.log("Translation process stopped by user.");
    }

    /**
     * Translate a single element
     */
    async function translateElement(elementData) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                {
                    action: "translateElement",
                    text: elementData.text,
                    elementPath: elementData.path,
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }

                    if (response && response.translatedText) {
                        // Update the element with translated text using inline replacement
                        updateElementTextInline(
                            elementData.element,
                            elementData.text,
                            response.translatedText,
                        );
                        resolve();
                    } else {
                        reject(new Error("No translation received"));
                    }
                },
            );
        });
    }

    /**
     * NEW APPROACH: Replace text content inline while preserving HTML structure
     * This method preserves all HTML elements, classes, styling, and attributes
     */
    function updateElementTextInline(element, originalText, translatedText) {
        try {
            console.log(
                `Updating element ${element.tagName} with inline text replacement`,
            );
            console.log(`Original: "${originalText.substring(0, 50)}..."`);
            console.log(`Translated: "${translatedText.substring(0, 50)}..."`);

            // Use TreeWalker to find all text nodes in this element
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node) {
                        // Skip empty text nodes and whitespace-only nodes
                        if (!node.nodeValue.trim()) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    },
                },
                false,
            );

            let textNode;
            const textNodes = [];
            while ((textNode = walker.nextNode())) {
                textNodes.push(textNode);
            }

            if (textNodes.length === 0) {
                console.warn("No text nodes found in element");
                return;
            }

            // Replace text content in the first text node (most common case)
            // This preserves all HTML structure while only changing the text
            const firstTextNode = textNodes[0];
            const originalNodeValue = firstTextNode.nodeValue;

            // Replace the text content
            firstTextNode.nodeValue = translatedText;

            console.log(`Successfully updated text in element: ${element.tagName}`);
            console.log(
                `Preserved HTML structure: ${element.outerHTML.substring(0, 100)}...`,
            );
        } catch (error) {
            console.error("Error updating element text inline:", error);
        }
    }

    /**
     * Handle element translation results from background script
     */
    function handleElementTranslationResult(request) {
        if (request.error) {
            console.error("Element translation error:", request.error);
            return;
        }

        if (request.translatedText && request.elementPath) {
            const element = findElementByPath(request.elementPath);
            if (element) {
                updateElementTextInline(
                    element,
                    request.originalText,
                    request.translatedText,
                );
                console.log(`Updated element at path ${request.elementPath}`);
            } else {
                console.warn(`Could not find element at path: ${request.elementPath}`);
            }
        }
    }

    /**
     * Update loading indicator progress
     */
    function updateLoadingProgress(completed, total, errors) {
        if (loadingIndicator) {
            const progress = Math.round((completed / total) * 100);
            const errorText = errors > 0 ? ` (${errors} errors)` : "";
            loadingIndicator.querySelector(".progress-text").textContent =
                `Translating elements... ${completed}/${total} (${progress}%)${errorText}`;
        }
    }

    // --- Legacy function for backward compatibility ---
    function replaceVisibleText(fullTranslation) {
        console.log(
            "Legacy replaceVisibleText called - redirecting to element translation",
        );
        translatePageElements();
    }

    // --- Function to Display Loading Indicator ---
    function displayLoadingIndicator(message = "Loading...") {
        removeLoadingIndicator(); // Remove previous one if exists

        loadingIndicator = document.createElement("div");
        loadingIndicator.id = "translation-loading-indicator";

        // Build UI with DOM methods to avoid innerHTML security warnings
        const progressText = document.createElement("span");
        progressText.className = "progress-text";
        progressText.textContent = message;

        const stopButtonEl = document.createElement("button");
        stopButtonEl.className = "stop-button";
        stopButtonEl.textContent = "Stop";

        loadingIndicator.appendChild(progressText);
        loadingIndicator.appendChild(stopButtonEl);

        // Basic Styling
        loadingIndicator.style.position = "fixed";
        loadingIndicator.style.bottom = "20px";
        loadingIndicator.style.left = "20px";
        loadingIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        loadingIndicator.style.color = "white";
        loadingIndicator.style.padding = "10px 15px";
        loadingIndicator.style.borderRadius = "5px";
        loadingIndicator.style.zIndex = "2147483647"; // Max z-index
        loadingIndicator.style.fontSize = "14px";
        loadingIndicator.style.fontFamily = "sans-serif";
        loadingIndicator.style.display = "flex";
        loadingIndicator.style.alignItems = "center";
        loadingIndicator.style.gap = "10px";

        // Style the stop button
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

    // --- Function to Remove Loading Indicator ---
    function removeLoadingIndicator() {
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
            loadingIndicator = null;
        }
    }

    // --- Sanitized HTML helpers (avoid innerHTML assignments) ---
    function clearElement(element) {
        if (!element) {
            return;
        }
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    function htmlToFragment(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const fragment = document.createDocumentFragment();
        while (doc.body.firstChild) {
            fragment.appendChild(doc.body.firstChild);
        }
        return fragment;
    }

    function setSanitizedContent(element, html) {
        if (!element) {
            return;
        }
        const sanitized = DOMPurify.sanitize(html ?? "");
        const fragment = htmlToFragment(sanitized);
        clearElement(element);
        element.appendChild(fragment);
    }

    function updateStreamingPopup(popup, content) {
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

    function handleStreamUpdate(message) {
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

    function cancelActiveStream() {
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

        chrome.runtime.sendMessage({ action: "cancelTranslation", requestId: requestId });
    }

    // --- Popup Display Function (for selected text) ---
    function displayPopup(
        content,
        isError = false,
        isLoading = false,
        detectedLanguageName = null,
        targetLanguageName = null,
        isStreaming = false,
    ) {
        console.log("displayPopup called with:", {
            content,
            isError,
            isLoading,
            detectedLanguageName,
            targetLanguageName,
        });
        const popupId = "translation-popup-extension";
        let existingPopup = document.getElementById(popupId);

        if (existingPopup && isStreaming) {
            updateStreamingPopup(existingPopup, content);
            return;
        }

        // If the popup already exists (from loading state) and this is the final result
        if (existingPopup && !isLoading) {
            existingPopup.classList.remove("is-streaming");
            console.log("Updating existing popup content.");
            // Use DOMPurify to sanitize HTML content while preserving formatting
            setSanitizedContent(existingPopup, content);
            existingPopup.style.backgroundColor = isError ? "#fff0f0" : "white";
            existingPopup.style.border = `1px solid ${isError ? "#f00" : "#ccc"}`;
            existingPopup.style.color = isError ? "#a00" : "#333";

            addCloseButton(existingPopup);
            console.log("Existing popup updated:", existingPopup);
            return;
        }

        // If popup exists and we get another loading message (shouldn't happen often, but handle)
        if (existingPopup && isLoading) {
            existingPopup.classList.remove("is-streaming");
            console.log("Popup already exists in loading state.");
            return;
        }

        // If popup doesn't exist, create it
        if (!existingPopup) {
            console.log("Creating new popup.");
            removePopup(false); // Don't reset selectionTranslateInProgress

            // Calculate position and width based on selection
            let top = 0;
            let left = 0;
            let popupWidth = 350; // Default/minimum width
            const minWidth = 350;
            const maxWidth = window.innerWidth * 0.8;

            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                top = window.scrollY + rect.bottom + 10; // 10px below selection
                left = window.scrollX + rect.left;

                // Calculate popup width based on selection width, clamped to min/max
                popupWidth = Math.max(minWidth, Math.min(rect.width, maxWidth));

                // Keep it within viewport width
                if (left + popupWidth > window.innerWidth) {
                    left = window.innerWidth - popupWidth - 20;
                }
            } else {
                // Fallback to mouse position if for some reason selection is gone
                // Note: lastMouseX/Y might be 0 if content script just loaded
                top = window.scrollY + window.lastMouseY + 20;
                left = window.scrollX + window.lastMouseX;
            }

            translationPopup = document.createElement("div");
            translationPopup.id = popupId;
            existingPopup = translationPopup;

            // Apply styles directly or use styles.css
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

            // Ensure it's displayed and visible
            translationPopup.style.display = "block";
            translationPopup.style.backgroundColor = isError ? "#fff0f0" : "white";
            translationPopup.style.border = `1px solid ${isError ? "#f00" : "#ccc"}`;
            translationPopup.style.color = isError ? "#a00" : "#333";
            translationPopup.style.minWidth = `${minWidth}px`;
            translationPopup.style.minHeight = "20px";
            translationPopup.style.visibility = "visible";
            translationPopup.style.opacity = "1";

            console.log(
                "Popup element created and styled (before content):",
                translationPopup,
            );

            // Append to body *before* setting content that might rely on styles
            try {
                document.body.appendChild(translationPopup);
                console.log("Popup appended to document body.");
            } catch (e) {
                console.error("Error appending popup to body:", e);
                return;
            }

            // Close on click outside
            setTimeout(() => {
                document.addEventListener("click", handleClickOutside, true);
            }, 0);
        }

        // Set content and style based on loading/error state for the newly created or existing popup
        if (isLoading) {
            existingPopup.classList.remove("is-streaming");
            clearElement(existingPopup);
            console.log("Setting loading content.");
            // Keep forceful styles, maybe adjust background slightly
            existingPopup.style.backgroundColor = "#f0f0f0"; // Loading background
            existingPopup.style.border = "3px solid orange"; // Loading border
            existingPopup.style.color = "#555";
            // Build spinner with DOM methods to avoid innerHTML security warnings
            const spinnerContainer = document.createElement("div");
            spinnerContainer.style.cssText =
                "display: flex; align-items: center; justify-content: center; height: 30px;";

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

            // Add keyframes style if not already present
            if (!document.getElementById("translation-spinner-style")) {
                const style = document.createElement("style");
                style.id = "translation-spinner-style";
                style.textContent =
                    "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
                document.head.appendChild(style);
            }
        } else if (isStreaming) {
            updateStreamingPopup(existingPopup, content);
            return;
        } else {
            console.log("Setting final content:", content);
            existingPopup.classList.remove("is-streaming");
            clearElement(existingPopup);

            // Add language detection header if available
            if (!isError && detectedLanguageName && targetLanguageName) {
                const headerDiv = document.createElement("div");
                headerDiv.style.cssText =
                    "font-size: 11px; color: #666; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #ddd;";
                headerDiv.textContent = `${detectedLanguageName} → ${targetLanguageName}`;
                existingPopup.appendChild(headerDiv);
            }

            // Add the translated content
            const contentDiv = document.createElement("div");
            const sanitized = DOMPurify.sanitize(content ?? "");
            const fragment = htmlToFragment(sanitized);
            contentDiv.appendChild(fragment);
            existingPopup.appendChild(contentDiv);

            // Apply final forceful styles (adjusting for error state)
            existingPopup.style.backgroundColor = isError ? "#ffdddd" : "#f8f9fa"; // Error/Success background
            existingPopup.style.border = `1px solid ${isError ? "#dc3545" : "#28a745"}`; // Error/Success border
            existingPopup.style.color = isError ? "#a00" : "#333"; // Error/Success text color
        }

        // Add close button (important to add after setting innerHTML)
        addCloseButton(existingPopup);
        console.log("Popup content set:", existingPopup);
    }

    // Helper function to add the close button
    function addCloseButton(popupElement) {
        // Remove existing close button first if any
        const existingButton = popupElement.querySelector(
            ".translation-popup-close-button",
        );
        if (existingButton) {
            existingButton.remove();
        }

        const closeButton = document.createElement("button");
        closeButton.textContent = "×";
        closeButton.className = "translation-popup-close-button"; // Add class for potential removal
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

    // --- Popup Removal Function ---
    function removePopup(resetInProgress = true) {
        cancelActiveStream();
        if (resetInProgress) {
            selectionTranslateInProgress = false;
        }
        hideSelectionTranslateButton();
        const popup = document.getElementById("translation-popup-extension");
        if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup);
            // Keep the global variable null assignment if other parts rely on it
            if (popup === translationPopup) {
                translationPopup = null;
            }
            document.removeEventListener("click", handleClickOutside, true);
        }
    }

    // --- Click Outside Handler ---
    function handleClickOutside(event) {
        if (translationPopup && !translationPopup.contains(event.target)) {
            // Check if the click target is the loading indicator; if so, don't close popup
            if (!loadingIndicator || !loadingIndicator.contains(event.target)) {
                removePopup();
            }
        }
    }
}
