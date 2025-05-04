// content.js - Handles displaying popups, extracting page text, replacing content, and auto-translate.

let translationPopup = null; // For selected text popup
let loadingIndicator = null; // For visual feedback during API calls
let originalBodyContent = null; // Store original content for potential revert (basic)
let isTranslated = false; // Track if the page is currently translated

// --- Message Listener (Handles multiple actions) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content Script Received Action:", request.action);

    switch (request.action) {
        // --- Display Popup for Selected Text ---
        case "displayTranslation":
            removeLoadingIndicator(); // Remove indicator if it was shown
            if (request.isError) {
                displayPopup(`Error: ${request.text}`); // Show error in popup
            } else {
                displayPopup(request.text);
            }
            sendResponse({ status: "Popup displayed" });
            break;

        // --- Request from Background to Get Page Text ---
        case "getPageText":
            const pageText = extractMainContentText();
            console.log("Extracted page text length:", pageText.length);
            sendResponse({ text: pageText });
            break; // Important: response is sent asynchronously

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

        // --- Show/Hide Loading Indicator ---
        case "showLoadingIndicator":
            if (request.isFullPage) {
                displayLoadingIndicator("Translating page...");
            } else {
                // Maybe show a smaller indicator near selection? For now, just log.
                console.log("Loading translation for selection...");
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

// --- Function to Extract Main Text Content ---
// This is a simplified approach. It might grab unwanted text (nav, footer)
// or miss text in complex structures (iframes, shadow DOM).
function extractMainContentText() {
    // Try to target the main content area if possible, otherwise use body
    const mainElement = document.querySelector("main") || document.body;
    // Exclude script, style, nav, header, footer content if possible
    const clonedBody = mainElement.cloneNode(true);
    clonedBody
        .querySelectorAll(
            'script, style, nav, header, footer, aside, form, button, input, textarea, select, [aria-hidden="true"], noscript',
        )
        .forEach((el) => el.remove());
    // Get innerText, which tries to respect visibility
    let text = clonedBody.innerText || "";
    // Basic cleanup
    text = text.replace(/\s\s+/g, " ").trim(); // Replace multiple spaces/newlines with single space
    return text;
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
                    `Replacing node value: "${node.nodeValue.trim().substring(0, 50)}..." with segment ${segmentIndex}`,
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
function displayPopup(translationText, isError = false) {
    removePopup(); // Remove existing popup

    const selection = window.getSelection();
    let rect = { top: 10, left: 10, bottom: 10, right: 10 };
    if (selection && selection.rangeCount > 0) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
    }

    translationPopup = document.createElement("div");
    translationPopup.id = "translation-popup-extension";
    translationPopup.textContent = translationText;
    translationPopup.classList.add("visible"); // Add class for potential CSS animation

    // Apply styles directly or use styles.css
    translationPopup.style.position = "absolute";
    translationPopup.style.top = `${window.scrollY + rect.bottom + 5}px`;
    translationPopup.style.left = `${window.scrollX + rect.left}px`;
    translationPopup.style.zIndex = "2147483646"; // Slightly lower than indicator maybe
    translationPopup.style.backgroundColor = isError ? "#fff0f0" : "white"; // Reddish background for errors
    translationPopup.style.border = `1px solid ${isError ? "#f00" : "#ccc"}`;
    translationPopup.style.borderRadius = "5px";
    translationPopup.style.padding = "10px 25px 10px 15px"; // Space for close button
    translationPopup.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    translationPopup.style.maxWidth = "350px";
    translationPopup.style.fontFamily = "Arial, sans-serif";
    translationPopup.style.fontSize = "14px";
    translationPopup.style.color = isError ? "#a00" : "#333";
    translationPopup.style.lineHeight = "1.4";
    translationPopup.style.pointerEvents = "auto"; // Ensure it's clickable

    // Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.position = "absolute";
    closeButton.style.top = "2px";
    closeButton.style.right = "5px";
    closeButton.style.background = "none";
    closeButton.style.border = "none";
    closeButton.style.fontSize = "18px";
    closeButton.style.cursor = "pointer";
    closeButton.style.color = "#888";
    closeButton.onclick = removePopup;

    translationPopup.appendChild(closeButton);
    document.body.appendChild(translationPopup);

    // Close on click outside
    setTimeout(() => {
        document.addEventListener("click", handleClickOutside, true);
    }, 0);
}

// --- Popup Removal Function ---
function removePopup() {
    if (translationPopup && translationPopup.parentNode) {
        translationPopup.parentNode.removeChild(translationPopup);
        translationPopup = null;
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
