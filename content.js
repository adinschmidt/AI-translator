// Track if content script is already loaded
if (window.hasRun) {
    console.log("AI Translator Content Script already loaded - skipping initialization");
} else {
    window.hasRun = true;

    console.log("AI Translator Content Script Loaded - Top Level");

    // content.js - Handles displaying popups, extracting page text, replacing content, and manual translation.

    // Track mouse position
    window.lastMouseX = 0;
    window.lastMouseY = 0;
    document.addEventListener('mousemove', function (e) {
        window.lastMouseX = e.clientX;
        window.lastMouseY = e.clientY;
    });

    let translationPopup = null; // For selected text popup
    let loadingIndicator = null; // For visual feedback during API calls
    let originalBodyContent = null; // Store original content for potential revert (basic)
    let isTranslated = false; // Track if the page is currently translated
    let stopTranslationFlag = false; // Flag to stop translation process

    // --- Message Listener (Handles multiple actions) ---
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Content Script Received Action:", request.action, request);

        switch (request.action) {
            // --- Display Popup for Selected Text (Handles Loading and Result) ---
            case "displayTranslation":
                // If it's the final result (not loading), remove any separate loading indicator
                if (!request.isLoading) {
                    removeLoadingIndicator();
                }
                // Call displayPopup, passing the loading state and error status
                displayPopup(request.text, request.isError, request.isLoading);
                sendResponse({ status: "Popup displayed/updated" });
                break;

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
                            request.html.length
                        );
                        target.innerHTML = DOMPurify.sanitize(request.html);
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
                    console.log("Starting element-by-element page translation.");
                    translatePageElements();
                    isTranslated = true; // Mark page as translated
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
                    console.log("Loading indicator request ignored for selected text (popup handles it).");
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
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(fragment);
        return tempDiv.innerHTML;
    }

    // --- Function to Extract Main Content HTML ---
    // This extracts HTML content to preserve formatting for translation
    function extractMainContentHTML() {
        // Try to target the main content area if possible, otherwise use body
        const mainElement = document.querySelector("main") || document.body;
        // Clone the element to avoid modifying the original
        const clonedBody = mainElement.cloneNode(true);

        // Remove unwanted elements but keep their structure
        clonedBody.querySelectorAll(
            'script, style, nav, header, footer, aside, form, button, input, textarea, select, [aria-hidden="true"], noscript'
        ).forEach((el) => el.remove());

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
                        ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)
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
                    const textContent = node.textContent?.trim() || '';
                    if (textContent.length > 3) {
                        return NodeFilter.FILTER_ACCEPT;
                    }

                    return NodeFilter.FILTER_REJECT;
                }
            },
            false
        );

        let node;
        while ((node = walker.nextNode())) {
            elements.push({
                element: node,
                text: extractPlainText(node), // NEW: Extract only plain text, no HTML
                path: getElementPath(node)
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
        if (element === document.body) return 'body';

        const parts = [];
        while (element && element !== document.body) {
            const part = element.tagName.toLowerCase();
            const index = Array.from(element.parentNode.children).indexOf(element) + 1;
            parts.unshift(`${part}:nth-child(${index})`);
            element = element.parentElement;
        }
        return parts.join(' > ');
    }

    /**
     * Find element by path (for translation result mapping)
     */
    function findElementByPath(path) {
        try {
            // Simple selector-based approach for common elements
            if (path.includes(' > ')) {
                const parts = path.split(' > ');
                let element = document.body;

                for (const part of parts) {
                    const [tag, nthChild] = part.split(':nth-child(');
                    const index = parseInt(nthChild.replace(')', '')) - 1;
                    element = element.children[index];
                    if (!element || element.tagName.toLowerCase() !== tag) {
                        return null;
                    }
                }
                return element;
            }

            // Handle body case
            if (path === 'body') {
                return document.body;
            }

            return null;
        } catch (error) {
            console.warn('Error finding element by path:', error);
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
                    })
                );

                console.log(`Completed batch ${batchIndex + 1}/${batches.length}`);
            } catch (error) {
                console.error("Batch processing error:", error);
            }
        }

        console.log(`Translation complete. ${completed} elements translated, ${errorCount} errors.`);

        // Remove loading indicator when done
        setTimeout(() => removeLoadingIndicator(), 1000);
    }

    /**
     * Attach a small inline error indicator near the element that failed to translate.
     */
    function markElementTranslationError(element, error) {
        try {
            const marker = document.createElement("span");
            marker.textContent = " [translation error]";
            marker.title = (error && error.message) ? error.message : "Translation failed";
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
            chrome.runtime.sendMessage({
                action: "translateElement",
                text: elementData.text,
                elementPath: elementData.path
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (response && response.translatedText) {
                    // Update the element with translated text using inline replacement
                    updateElementTextInline(elementData.element, elementData.text, response.translatedText);
                    resolve();
                } else {
                    reject(new Error("No translation received"));
                }
            });
        });
    }

    /**
     * NEW APPROACH: Replace text content inline while preserving HTML structure
     * This method preserves all HTML elements, classes, styling, and attributes
     */
    function updateElementTextInline(element, originalText, translatedText) {
        try {
            console.log(`Updating element ${element.tagName} with inline text replacement`);
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
                    }
                },
                false
            );

            let textNode;
            const textNodes = [];
            while ((textNode = walker.nextNode())) {
                textNodes.push(textNode);
            }

            if (textNodes.length === 0) {
                console.warn('No text nodes found in element');
                return;
            }

            // Replace text content in the first text node (most common case)
            // This preserves all HTML structure while only changing the text
            const firstTextNode = textNodes[0];
            const originalNodeValue = firstTextNode.nodeValue;

            // Replace the text content
            firstTextNode.nodeValue = translatedText;

            console.log(`Successfully updated text in element: ${element.tagName}`);
            console.log(`Preserved HTML structure: ${element.outerHTML.substring(0, 100)}...`);

        } catch (error) {
            console.error('Error updating element text inline:', error);
        }
    }

    /**
     * Handle element translation results from background script
     */
    function handleElementTranslationResult(request) {
        if (request.error) {
            console.error('Element translation error:', request.error);
            return;
        }

        if (request.translatedText && request.elementPath) {
            const element = findElementByPath(request.elementPath);
            if (element) {
                updateElementTextInline(element, request.originalText, request.translatedText);
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
            const errorText = errors > 0 ? ` (${errors} errors)` : '';
            loadingIndicator.querySelector('.progress-text').textContent = `Translating elements... ${completed}/${total} (${progress}%)${errorText}`;
        }
    }

    // --- Legacy function for backward compatibility ---
    function replaceVisibleText(fullTranslation) {
        console.log("Legacy replaceVisibleText called - redirecting to element translation");
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

        const stopButton = document.createElement("button");
        stopButton.className = "stop-button";
        stopButton.textContent = "Stop";

        loadingIndicator.appendChild(progressText);
        loadingIndicator.appendChild(stopButton);

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
        stopButton.style.backgroundColor = "#ff4444";
        stopButton.style.color = "white";
        stopButton.style.border = "none";
        stopButton.style.padding = "5px 10px";
        stopButton.style.borderRadius = "3px";
        stopButton.style.cursor = "pointer";
        stopButton.style.fontSize = "12px";
        stopButton.style.fontWeight = "bold";
        stopButton.onmouseover = () => {
            stopButton.style.backgroundColor = "#cc0000";
        };
        stopButton.onmouseout = () => {
            stopButton.style.backgroundColor = "#ff4444";
        };
        stopButton.onclick = stopTranslation;

        document.body.appendChild(loadingIndicator);
    }

    // --- Function to Remove Loading Indicator ---
    function removeLoadingIndicator() {
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
            loadingIndicator = null;
        }
    }

    // --- Popup Display Function (for selected text) ---
    function displayPopup(content, isError = false, isLoading = false) {
        console.log("displayPopup called with:", { content, isError, isLoading });
        const popupId = "translation-popup-extension";
        let existingPopup = document.getElementById(popupId);

        // If the popup already exists (from loading state) and this is the final result
        if (existingPopup && !isLoading) {
            console.log("Updating existing popup content.");
            existingPopup.innerHTML = "";
            // Use DOMPurify to sanitize HTML content while preserving formatting
            existingPopup.innerHTML = DOMPurify.sanitize(content);
            existingPopup.style.backgroundColor = isError ? "#fff0f0" : "white";
            existingPopup.style.border = `1px solid ${isError ? "#f00" : "#ccc"}`;
            existingPopup.style.color = isError ? "#a00" : "#333";

            addCloseButton(existingPopup);
            console.log("Existing popup updated:", existingPopup);
            return;
        }

        // If popup exists and we get another loading message (shouldn't happen often, but handle)
        if (existingPopup && isLoading) {
            console.log("Popup already exists in loading state.");
            return;
        }

        // If popup doesn't exist, create it
        if (!existingPopup) {
            console.log("Creating new popup.");
            removePopup();

            // Calculate position based on selection
            let top = 0;
            let left = 0;
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                top = window.scrollY + rect.bottom + 10; // 10px below selection
                left = window.scrollX + rect.left;

                // Keep it within viewport width
                if (left + 350 > window.innerWidth) { // 350 is approx max width
                    left = window.innerWidth - 370;
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
            translationPopup.style.maxWidth = "350px";
            translationPopup.style.fontFamily = "Arial, sans-serif";
            translationPopup.style.fontSize = "14px";
            translationPopup.style.lineHeight = "1.4";
            translationPopup.style.pointerEvents = "auto";

            // Ensure it's displayed and visible
            translationPopup.style.display = "block";
            translationPopup.style.backgroundColor = isError ? "#fff0f0" : "white";
            translationPopup.style.border = `1px solid ${isError ? "#f00" : "#ccc"}`;
            translationPopup.style.color = isError ? "#a00" : "#333";
            translationPopup.style.minWidth = "50px";
            translationPopup.style.minHeight = "20px";
            translationPopup.style.visibility = "visible";
            translationPopup.style.opacity = "1";

            console.log("Popup element created and styled (before content):", translationPopup);

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
        existingPopup.innerHTML = ""; // Clear previous content
        if (isLoading) {
            console.log("Setting loading content.");
            // Keep forceful styles, maybe adjust background slightly
            existingPopup.style.backgroundColor = "#f0f0f0"; // Loading background
            existingPopup.style.border = "3px solid orange"; // Loading border
            existingPopup.style.color = "#555";
            // Build spinner with DOM methods to avoid innerHTML security warnings
            const spinnerContainer = document.createElement("div");
            spinnerContainer.style.cssText = "display: flex; align-items: center; justify-content: center; height: 30px;";

            const spinner = document.createElement("div");
            spinner.className = "spinner";
            spinner.style.cssText = "border: 3px solid #f3f3f3; border-top: 3px solid #555; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite;";

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
                style.textContent = "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
                document.head.appendChild(style);
            }
        } else {
            console.log("Setting final content:", content);
            // Use DOMPurify to sanitize HTML content while preserving formatting
            existingPopup.innerHTML = DOMPurify.sanitize(content);
            // Apply final forceful styles (adjusting for error state)
            existingPopup.style.backgroundColor = isError ? "#ffdddd" : "yellow"; // Error/Success background
            existingPopup.style.border = `3px solid ${isError ? "red" : "green"}`; // Error/Success border
            existingPopup.style.color = isError ? "#a00" : "black"; // Error/Success text color
        }

        // Add close button (important to add after setting innerHTML)
        addCloseButton(existingPopup);
        console.log("Popup content set:", existingPopup);
    }

    // Helper function to add the close button
    function addCloseButton(popupElement) {
        // Remove existing close button first if any
        const existingButton = popupElement.querySelector(".translation-popup-close-button");
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
    function removePopup() {
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
