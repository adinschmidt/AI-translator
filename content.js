console.log("AI Translator Content Script Loaded - Top Level");

// content.js - Handles displaying popups, extracting page text, replacing content, and auto-translate.

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

        // --- Request from Background to Get Page Text ---
        case "getPageText":
            const pageText = extractMainContentHTML();
            console.log("Extracted page HTML length:", pageText.length);
            sendResponse({ text: pageText });
            break; // Important: response is sent asynchronously

        // --- Extract Selected HTML (for hyperlink preservation) ---
        case "extractSelectedHtml":
            const selectedHtml = extractSelectedHtml();
            console.log("Extracted selected HTML:", selectedHtml);
            sendResponse({ html: selectedHtml });
            break;

        // --- Request from Background to Replace Page Content ---
        case "replacePageContent":
            removeLoadingIndicator();
            if (request.isError) {
                // Display error prominently, maybe using the popup mechanism or a banner
                displayPopup(`Full Page Translation Error: ${request.text}`, true); // Make error popup more prominent
                console.error("Full page translation failed:", request.text);
            } else if (!isTranslated) {
                // Only translate if not already translated
                console.log("Replacing page content with translation.");
                replaceVisibleText(request.text);
                isTranslated = true; // Mark page as translated
                // Optional: Add a button/mechanism to revert? (More complex)
            } else {
                console.log("Page already translated, skipping replacement.");
            }
            sendResponse({ status: "received" }); // Acknowledge receipt
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

// --- Function to Replace Visible Text on the Page ---
// WARNING: This is a complex task and this implementation is BASIC.
// It might be slow on large pages and can break website functionality or layout.
// It doesn't handle text in input fields, buttons, placeholders, titles, etc.
// It also doesn't perfectly handle splitting/joining text nodes which might affect spacing.
function replaceVisibleText(fullTranslation) {
    console.log("Attempting DOM text replacement...");
    // Store original body for basic revert (very fragile)
    // if (!originalBodyContent) {
    //     originalBodyContent = document.body.innerHTML;
    // }

    // Split translation into sentences or paragraphs for potentially better matching (simplistic)
    // This is highly experimental and likely insufficient for accurate replacement.
    // A better approach would involve mapping original text nodes to translated segments.
    const translatedSegments = fullTranslation
        .split("\n")
        .filter((s) => s.trim().length > 0);
    let segmentIndex = 0;

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT, // Only consider text nodes
        {
            // Filter function
            acceptNode: function (node) {
                // Skip nodes inside <script>, <style>, <noscript> tags
                if (
                    node.parentElement &&
                    ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)
                ) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Skip nodes that are just whitespace
                if (node.nodeValue.trim() === "") {
                    return NodeFilter.FILTER_REJECT;
                }
                // Skip nodes that are part of the extension's UI (popup, indicator)
                if (
                    node.parentElement &&
                    (node.parentElement.closest("#translation-popup-extension") ||
                        node.parentElement.closest("#translation-loading-indicator"))
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            },
        },
        false, // deprecated but required in older specs
    );

    let node;
    const nodesToReplace = [];
    while ((node = walker.nextNode())) {
        nodesToReplace.push(node); // Collect nodes first
    }

    console.log(`Found ${nodesToReplace.length} text nodes to potentially replace.`);
    // Very basic replacement strategy: replace node value with next translation segment
    // This WILL break context and meaning in most cases.
    // A real solution needs complex text alignment algorithms.
    nodesToReplace.forEach((node) => {
        if (segmentIndex < translatedSegments.length) {
            // Heuristic: Only replace if original text is somewhat substantial?
            if (node.nodeValue.trim().length > 5) {
                // Arbitrary length check
                console.log(
                    `Replacing node value: "${node.nodeValue
                        .trim()
                        .substring(0, 50)}..." with segment ${segmentIndex}`,
                );
                node.nodeValue = translatedSegments[segmentIndex];
                segmentIndex++;
            } else {
                console.log(`Skipping short node: "${node.nodeValue.trim()}"`);
            }
        }
    });

    if (segmentIndex < translatedSegments.length) {
        console.warn(
            `Not all translated segments were used (${segmentIndex}/${translatedSegments.length}). Page structure might not match.`,
        );
    }

    // --- Alternative (Simpler, but breaks everything): ---
    // document.body.innerHTML = `<div style="padding: 20px; font-family: sans-serif;"><h1>Translated Content</h1><pre style="white-space: pre-wrap;">${fullTranslation}</pre></div>`;
    // ---

    console.log("DOM text replacement attempt finished.");
}

// --- Function to Display Loading Indicator ---
function displayLoadingIndicator(message = "Loading...") {
    removeLoadingIndicator(); // Remove previous one if exists

    loadingIndicator = document.createElement("div");
    loadingIndicator.id = "translation-loading-indicator";
    loadingIndicator.textContent = message;

    // Basic Styling
    loadingIndicator.style.position = "fixed";
    loadingIndicator.style.bottom = "20px";
    loadingIndicator.style.left = "20px";
    loadingIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    loadingIndicator.style.color = "white";
    loadingIndicator.style.padding = "10px 15px";
    loadingIndicator.style.borderRadius = "5px";
    loadingIndicator.style.zIndex = "2147483647"; // Max z-index
    loadingIndicator.style.fontSize = "14px";
    loadingIndicator.style.fontFamily = "sans-serif";

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
        // Use innerHTML instead of textContent to preserve formatting
        existingPopup.innerHTML = content;
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

        // Store cursor position when creating the popup
        const cursorX = window.lastMouseX || 0;
        const cursorY = window.lastMouseY || 0;

        translationPopup = document.createElement("div");
        translationPopup.id = popupId;
        existingPopup = translationPopup;

        // Apply styles directly or use styles.css
        translationPopup.style.position = "absolute";
        translationPopup.style.top = `${window.scrollY + cursorY + 20}px`; // 20px below cursor
        translationPopup.style.left = `${window.scrollX + cursorX}px`;
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
        // Add a simple spinner or text
        existingPopup.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 30px;">
            <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #555; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite;"></div>
            <span style="margin-left: 8px;">Translating...</span>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>`;
    } else {
        console.log("Setting final content:", content);
        // Use innerHTML to preserve formatting
        existingPopup.innerHTML = content;
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

// --- Automatic Translation Trigger ---
function checkAndTriggerAutoTranslate() {
    if (isTranslated) {
        console.log("Auto-translate check: Page already translated.");
        return;
    }

    chrome.storage.sync.get(["autoTranslateEnabled"], (result) => {
        if (result.autoTranslateEnabled) {
            console.log("Auto-translate enabled. Triggering full page translation.");
            // Need API key/endpoint info to proceed, request from background
            chrome.runtime.sendMessage({ action: "triggerAutoTranslate" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(
                        "Error sending triggerAutoTranslate:",
                        chrome.runtime.lastError.message,
                    );
                } else if (response?.status === "started") {
                    console.log("Background script acknowledged auto-translate trigger.");
                    // Show indicator immediately
                    displayLoadingIndicator("Auto-translating page...");
                } else {
                    console.warn(
                        "Background script did not confirm auto-translate start. Is it configured?",
                        response,
                    );
                }
            });
        } else {
            console.log("Auto-translate is disabled.");
        }
    });
}

// Run auto-translate check when the content script loads (page load)
// Use a small delay to allow the page to potentially finish rendering
setTimeout(checkAndTriggerAutoTranslate, 500);
