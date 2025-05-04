// background.js - Handles context menu, API calls, full page, and auto-translate trigger

// Default settings
const DEFAULT_SETTINGS = {
    apiEndpoint: "",
    apiKey: "",
    apiType: "openai",
    // autoTranslateEnabled: false // Not needed here, read directly when needed
};

// --- Context Menu Setup ---
chrome.runtime.onInstalled.addListener(() => {
    // Context menu for selected text
    chrome.contextMenus.create({
        id: "translateSelectedText",
        title: "Translate '%s'",
        contexts: ["selection"],
    });

    // Context menu for the whole page
    chrome.contextMenus.create({
        id: "translateFullPage",
        title: "Translate Entire Page",
        contexts: ["page"],
    });

    console.log("AI Translator context menus created.");
});

// --- Message Listener (for Auto-Translate Trigger) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "triggerAutoTranslate") {
        console.log("Received triggerAutoTranslate request from tab:", sender.tab?.id);
        if (sender.tab?.id) {
            // 1. Ask content script to extract page text (same as manual trigger)
            chrome.tabs.sendMessage(
                sender.tab.id,
                { action: "getPageText" },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Error sending getPageText for auto-translate:",
                            chrome.runtime.lastError.message,
                        );
                        return;
                    }
                    if (response && response.text) {
                        console.log(
                            "Received page text for auto-translate (length):",
                            response.text.length,
                        );
                        // 2. Get settings and trigger translation
                        getSettingsAndTranslate(response.text, sender.tab.id, true); // true = full page
                    } else {
                        console.error(
                            "Did not receive text from content script for auto-translate.",
                        );
                    }
                },
            );
            sendResponse({ status: "started" }); // Confirm start
        } else {
            console.error("Could not get sender tab ID for auto-translate.");
            sendResponse({ status: "error", message: "No sender tab ID" });
        }
        return true; // Indicate async response possible (though we send sync here)
    }
    // Handle other messages if necessary in the future
});

// --- Context Menu Click Handler ---
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log("Context menu item clicked.", info, tab); // Added log
    if (!tab || !tab.id) {
        console.error("Cannot get tab ID.");
        return;
    }
    const tabId = tab.id;

    // Handle Selected Text Translation
    if (info.menuItemId === "translateSelectedText" && info.selectionText) {
        const selectedText = info.selectionText;
        console.log("Action: Translate Selected Text - ", selectedText);
        // Immediately tell content script to show the popup in loading state
        notifyContentScript(tabId, "Translating...", false, false, true); // isFullPage=false, isError=false, isLoading=true
        // Then, get settings and start the actual translation
        getSettingsAndTranslate(selectedText, tabId, false); // false = not full page
    }
    // Handle Full Page Translation (Manual Trigger)
    else if (info.menuItemId === "translateFullPage") {
        console.log("Action: Translate Full Page requested manually for tab:", tabId); // Added log
        // Show indicator immediately for manual trigger (Full page still uses separate indicator)
        chrome.tabs.sendMessage(tabId, {
            action: "showLoadingIndicator",
            isFullPage: true,
        });
        // 1. Ask content script to extract page text
        chrome.tabs.sendMessage(tabId, { action: "getPageText" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(
                    "Error sending getPageText message:",
                    chrome.runtime.lastError.message,
                );
                // Notify with error for full page
                notifyContentScript(
                    tabId,
                    `Error: Could not communicate with page content. Try reloading. (${chrome.runtime.lastError.message})`,
                    true, // isFullPage = true
                    true, // isError = true
                );
                return;
            }
            if (response && response.text) {
                console.log("Received page text (length):", response.text.length); // Added log
                // 2. Get settings and trigger translation
                getSettingsAndTranslate(response.text, tabId, true); // true = full page
            } else {
                console.error("Did not receive text from content script.");
                // Notify with error for full page
                notifyContentScript(
                    tabId,
                    "Error: Could not extract text content from the page.",
                    true, // isFullPage = true
                    true, // isError = true
                );
            }
        });
    }
});

// --- Helper Function to Get Settings and Call API ---
function getSettingsAndTranslate(textToTranslate, tabId, isFullPage) {
    console.log("getSettingsAndTranslate called.", { textToTranslate, tabId, isFullPage }); // Added log
    chrome.storage.sync.get(["apiKey", "apiEndpoint", "apiType", "modelName"], (settings) => { // Added modelName to retrieval
        console.log("Settings retrieved from storage:", settings); // Added log
        const {
            apiKey = DEFAULT_SETTINGS.apiKey,
            apiEndpoint = DEFAULT_SETTINGS.apiEndpoint,
            apiType = DEFAULT_SETTINGS.apiType,
            modelName = DEFAULT_SETTINGS.modelName // Retrieve modelName
        } = settings;

        if (!apiKey || !apiEndpoint) {
            const errorMsg =
                "Translation Error: API Key or Endpoint not set. Please configure in extension settings.";
            console.error(errorMsg);
            // Send error back to content script to update the popup/indicator
            notifyContentScript(tabId, errorMsg, isFullPage, true, false); // isError=true, isLoading=false
            return;
        }

        console.log("Attempting to call translateTextApiCall."); // Added log before API call

        // Call the API - the promise resolution/rejection will handle sending the final result
        translateTextApiCall(textToTranslate, apiKey, apiEndpoint, apiType, isFullPage)
            .then((translation) => {
                console.log("Translation received (length):", translation.length); // Existing log
                // Send final translation result
                notifyContentScript(tabId, translation, isFullPage, false, false); // isError=false, isLoading=false
            })
            .catch((error) => {
                console.error("Translation error:", error); // Existing log
                // Send final error result
                notifyContentScript(
                    tabId,
                    `Translation Error: ${error.message}`,
                    isFullPage,
                    true, // isError=true
                    false, // isLoading=false
                );
            });
    });
}

// --- Notify Content Script ---
function notifyContentScript(tabId, text, isFullPage, isError = false, isLoading = false) {
    let message = {
        text: text,
        isError: isError,
        isLoading: isLoading, // Pass loading state
    };

    if (isFullPage) {
        // Full page still uses replacePageContent or potentially a loading indicator
        if (isLoading) {
            message.action = "showLoadingIndicator"; // Or a specific full-page loading action if needed
        } else {
            message.action = "replacePageContent";
        }
    } else {
        // Selected text uses displayTranslation for both loading and final result
        message.action = "displayTranslation";
    }

    console.log(`Sending message to content script:`, message); // Log the message being sent

    chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
            // Don't log error if it's just because the tab was closed during translation
            if (
                !chrome.runtime.lastError.message.includes("Receiving end does not exist")
            ) {
                console.warn(
                    `Could not send message to tab ${tabId} for action ${message.action}: ${chrome.runtime.lastError.message}.`,
                );
            }
        } else if (response?.status === "received") {
            console.log(`Content script in tab ${tabId} acknowledged ${message.action}.`);
        } else {
            // This might happen if content script is busy or didn't send response back correctly
            // console.log(`Content script in tab ${tabId} received ${message.action} but did not send expected response.`);
        }
    });
}

// --- API Call Function (Unchanged from previous version) ---
async function translateTextApiCall(
    textToTranslate,
    apiKey,
    apiEndpoint,
    apiType,
    isFullPage,
) {
    console.log(
        `Sending text to API (${apiType}) at ${apiEndpoint}. FullPage: ${isFullPage}. Text length: ${textToTranslate.length}`,
    );
    console.log("Text being sent for translation:", textToTranslate); // Added log for input text

    let requestBody;
    let headers = { "Content-Type": "application/json" };
    const prompt = `Translate the following text to English. Keep the same meaning and tone as the original text. DO NOT add any additional text or explanations. DO NOT start your response with an acknowledgement. Only produce the translated text. Text to translate: ${textToTranslate}`;
    const systemPrompt =
        "You are a professional translator. Translate the provided text accurately to English.";

    // Retrieve modelName from storage
    const settings = await chrome.storage.sync.get(["modelName"]);
    const modelName = settings.modelName || DEFAULT_SETTINGS.modelName; // Use default if not set

    switch (apiType) {
        case "openai":
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: modelName || "gpt-3.5-turbo", // Use modelName from settings, fallback to gpt-3.5-turbo
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                max_tokens: isFullPage ? 3000 : 500,
            };
            break;
        case "anthropic":
            headers["x-api-key"] = apiKey;
            headers["anthropic-version"] = "2023-06-01";
            requestBody = {
                model: modelName || "claude-3-haiku-20240307", // Use modelName from settings, fallback to claude-3-haiku-20240307
                max_tokens: isFullPage ? 3000 : 500,
                system: systemPrompt,
                messages: [{ role: "user", content: prompt }],
            };
            break;
        case "google":
            headers["x-goog-api-key"] = apiKey;
            // Google API endpoint includes the version, the model name is part of the path
            const googleApiUrl = `${apiEndpoint}/models/${modelName || "gemini-2.5-flash-preview-04-17"}:generateContent`; // Use modelName from settings, fallback to gemini-2.5-flash-preview-04-17
            requestBody = {
                contents: [
                    {
                        parts: [
                            { text: systemPrompt },
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: isFullPage ? 65536 : 8000, // Increased maxOutputTokens for selected text
                },
            };
             console.log("Google API Request Body:", JSON.stringify(requestBody)); // Log request body for debugging
            // Use the constructed googleApiUrl for the fetch call
            apiEndpoint = googleApiUrl;
            break;
        default:
            throw new Error(`Unsupported API type configured: ${apiType}`);
    }

    console.log(`Sending request to ${apiEndpoint} with body:`, requestBody); // Log request being sent

    try {
        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
        });

        console.log("Received API response:", response); // Log the raw response object

        if (!response.ok) {
            let errorDetails = `API request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                console.error("API Error Response Body:", errorData); // Log API error response body
                errorDetails += `: ${
                    errorData?.error?.message ||
                    errorData?.detail ||
                    JSON.stringify(errorData)
                }`;
            } catch (e) {
                errorDetails += `: ${response.statusText}`;
            }
            console.error("API request failed:", errorDetails); // Log the failure
            throw new Error(errorDetails);
        }
        const data = await response.json();
        console.log("API Response Data Received Successfully:", data); // Log successful response data

        let translation;
        switch (apiType) {
            case "openai":
                translation = data.choices?.[0]?.message?.content?.trim();
                break;
            case "anthropic":
                if (
                    data.content &&
                    Array.isArray(data.content) &&
                    data.content.length > 0
                ) {
                    translation = data.content
                        .map((block) => block.text)
                        .join("\n")
                        .trim();
                }
                break;
            case "google":
                 console.log("Google API Candidates:", data.candidates); // Existing log for Google API candidates
                 // Log the parts array content
                 if (data.candidates?.[0]?.content?.parts) {
                     console.log("Google API Parts:", data.candidates[0].content.parts);
                     // Log the first element of the parts array
                     if (data.candidates[0].content.parts.length > 0) {
                         console.log("Google API First Part:", data.candidates[0].content.parts[0]);
                     }
                 }
                 // Assuming the structure is data.candidates[0].content.parts[0].text
                 translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                 break;
            default:
                throw new Error(
                    "Could not determine how to extract translation for this API type."
                );
        }

        if (translation === undefined || translation === null || translation.trim() === "") {
            console.error("Extracted translation is empty or null.", data); // Log failure to extract translation
            throw new Error("API returned no translation text."); // More specific error message
        }
        console.log("Successfully extracted translation:", translation); // Log the extracted translation
        return translation;
    } catch (error) {
        console.error("Fetch API error:", error); // Log fetch errors
        throw error;
    }
}

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});
