const DEFAULT_SETTINGS = {
    apiEndpoint: "",
    apiKey: "",
    apiType: "openai",
    modelName: ""
};

// --- Context Menu Setup ---
chrome.runtime.onInstalled.addListener(() => {
    // Context menu for selected text
    chrome.contextMenus.create({
        id: "translateSelectedText",
        title: "Translate to English",
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

// --- Message Listener (for Element Translation Only) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle individual element translation
    if (request.action === "translateElement") {
        console.log("Received translateElement request:", {
            textLength: request.text?.length,
            elementPath: request.elementPath
        });

        if (sender.tab?.id) {
            translateElementText(request.text, request.elementPath, sender.tab.id)
                .then((translation) => {
                    console.log("Element translation completed for:", request.elementPath);
                    sendResponse({ translatedText: translation });
                })
                .catch((error) => {
                    console.error("Element translation error:", error);
                    sendResponse({
                        error: error.message,
                        elementPath: request.elementPath
                    });
                });
        } else {
            console.error("Could not get sender tab ID for element translation.");
            sendResponse({ error: "No sender tab ID" });
        }
        return true; // Indicate async response
    }
    // Handle other messages if necessary in the future
});

// --- Context Menu Click Handler ---
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log("Context menu item clicked.", info, tab);
    if (!tab || !tab.id) {
        console.error("Cannot get tab ID.");
        return;
    }
    const tabId = tab.id;

    // Handle Selected Text Translation
    if (info.menuItemId === "translateSelectedText" && info.selectionText) {
        console.log("Action: Translate Selected Text - Getting HTML content");
        // First, get the HTML content from the selected text to preserve hyperlinks
        chrome.tabs.sendMessage(tabId, { action: "extractSelectedHtml" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting selected HTML:", chrome.runtime.lastError.message);
                notifyContentScript(tabId, "Could not extract selected content", true, false, false);
                return;
            }

            if (response && response.html) {
                console.log("Received selected HTML:", response.html);
                // Immediately tell content script to show the popup in loading state
                notifyContentScript(tabId, "Translating...", false, false, true); // isFullPage=false, isError=false, isLoading=true
                // Then, get settings and start the actual translation with HTML content
                getSettingsAndTranslate(response.html, tabId, false); // false = not full page
            } else {
                console.error("No HTML content received from content script");
                notifyContentScript(tabId, "Could not extract selected HTML", true, false, false);
            }
        });
    }
    // Handle Full Page Translation (Manual Trigger) - Now uses element-based approach
    else if (info.menuItemId === "translateFullPage") {
        console.log("Action: Translate Full Page requested manually for tab:", tabId);
        // Use the new element-based translation approach
        chrome.tabs.sendMessage(tabId, {
            action: "startElementTranslation",
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(
                    "Error sending startElementTranslation message:",
                    chrome.runtime.lastError.message,
                );
                notifyContentScript(tabId, "Translation failed to start", true, true, false);
                return;
            }
            console.log("Element-based page translation started:", response);
        });
    }
});

// --- Helper Function to Translate Individual Element Text ---
async function translateElementText(textToTranslate, elementPath, tabId) {
    console.log(`Translating element text (length: ${textToTranslate.length}) for path: ${elementPath}`);

    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(["apiKey", "apiEndpoint", "apiType", "modelName"], (settings) => {
            const {
                apiKey = DEFAULT_SETTINGS.apiKey,
                apiEndpoint = DEFAULT_SETTINGS.apiEndpoint,
                apiType = DEFAULT_SETTINGS.apiType,
                modelName = DEFAULT_SETTINGS.modelName
            } = settings;

            if (!apiKey || !apiEndpoint) {
                reject(new Error("API Key or Endpoint not set. Please configure in extension settings."));
                return;
            }

            // Call the API for element translation
            translateTextApiCall(textToTranslate, apiKey, apiEndpoint, apiType, false, modelName) // false = not full page
                .then((translation) => {
                    console.log("Element translation received:", translation);
                    resolve(translation);
                })
                .catch((error) => {
                    console.error("Element translation error:", error);
                    reject(error);
                });
        });
    });
}

// --- Helper Function to Get Settings and Call API ---
function getSettingsAndTranslate(textToTranslate, tabId, isFullPage) {
    console.log("getSettingsAndTranslate called.", { textToTranslate, tabId, isFullPage });
    chrome.storage.sync.get(["apiKey", "apiEndpoint", "apiType", "modelName"], (settings) => {
        console.log("Settings retrieved from storage:", settings);
        const {
            apiKey = DEFAULT_SETTINGS.apiKey,
            apiEndpoint = DEFAULT_SETTINGS.apiEndpoint,
            apiType = DEFAULT_SETTINGS.apiType,
            modelName = DEFAULT_SETTINGS.modelName
        } = settings;

        if (!apiKey || !apiEndpoint) {
            const errorMsg =
                "Translation Error: API Key or Endpoint not set. Please configure in extension settings.";
            console.error(errorMsg);
            // Send error back to content script to update the popup/indicator
            notifyContentScript(tabId, errorMsg, isFullPage, true, false); // isError=true, isLoading=false
            return;
        }

        console.log("Attempting to call translateTextApiCall.");

        // Call the API - the promise resolution/rejection will handle sending the final result
        translateTextApiCall(textToTranslate, apiKey, apiEndpoint, apiType, isFullPage, modelName)
            .then((translation) => {
                console.log("Translation received (length):", translation.length);
                // Send final translation result
                notifyContentScript(tabId, translation, isFullPage, false, false); // isError=false, isLoading=false
            })
            .catch((error) => {
                console.error("Translation error:", error);
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
        // Full page now uses startElementTranslation
        if (isLoading) {
            message.action = "showLoadingIndicator";
        } else {
            message.action = "startElementTranslation"; // Changed from replacePageContent
        }
    } else {
        // Selected text uses displayTranslation for both loading and final result
        message.action = "displayTranslation";
    }

    console.log(`Sending message to content script:`, message);

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
        }
    });
}

// --- API Call Function (Updated to include modelName parameter) ---
async function translateTextApiCall(
    textToTranslate,
    apiKey,
    apiEndpoint,
    apiType,
    isFullPage,
    modelName,
) {
    console.log(
        `Sending text to API (${apiType}) at ${apiEndpoint}. FullPage: ${isFullPage}. Text length: ${textToTranslate.length}`,
    );
    console.log("Text being sent for translation:", textToTranslate);

    let requestBody;
    let headers = { "Content-Type": "application/json" };

    // Simpler prompt for element-based translation, but still preserve HTML
    const prompt = `Translate the following text to English. Keep the same meaning and tone. DO NOT add any additional text or explanations. If this contains HTML, preserve the HTML structure and formatting. Text to translate: ${textToTranslate}`;
    const systemPrompt =
        "You are a professional translator. Translate the provided text accurately to English.";

    // Use modelName from parameter, fallback to default
    const selectedModelName = modelName || DEFAULT_SETTINGS.modelName;

    switch (apiType) {
        case "openai":
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: selectedModelName || "gpt-3.5-turbo",
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
                model: selectedModelName || "claude-3-haiku-20240307",
                max_tokens: isFullPage ? 3000 : 500,
                system: systemPrompt,
                messages: [{ role: "user", content: prompt }],
            };
            break;
        case "google":
            headers["x-goog-api-key"] = apiKey;
            // Google API endpoint includes the version, the model name is part of the path
            const googleApiUrl = `${apiEndpoint}/models/${selectedModelName || "gemini-2.5-flash"}:generateContent`;
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
                    maxOutputTokens: isFullPage ? 65536 : 8000,
                },
            };
            console.log("Google API Request Body:", JSON.stringify(requestBody));
            // Use the constructed googleApiUrl for the fetch call
            apiEndpoint = googleApiUrl;
            break;
        default:
            throw new Error(`Unsupported API type configured: ${apiType}`);
    }

    console.log(`Sending request to ${apiEndpoint} with body:`, requestBody);

    try {
        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
        });

        console.log("Received API response:", response);

        if (!response.ok) {
            let errorDetails = `API request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                console.error("API Error Response Body:", errorData);
                errorDetails += `: ${errorData?.error?.message ||
                    errorData?.detail ||
                    JSON.stringify(errorData)
                    }`;
            } catch (e) {
                errorDetails += `: ${response.statusText}`;
            }
            console.error("API request failed:", errorDetails);
            throw new Error(errorDetails);
        }
        const data = await response.json();
        console.log("API Response Data Received Successfully:", data);

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
                console.log("Google API Candidates:", data.candidates);
                if (data.candidates?.[0]?.content?.parts) {
                    console.log("Google API Parts:", data.candidates[0].content.parts);
                    if (data.candidates[0].content.parts.length > 0) {
                        console.log("Google API First Part:", data.candidates[0].content.parts[0]);
                    }
                }
                translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                break;
            default:
                throw new Error(
                    "Could not determine how to extract translation for this API type."
                );
        }

        if (translation === undefined || translation === null || translation.trim() === "") {
            console.error("Extracted translation is empty or null.", data);
            throw new Error("API returned no translation text.");
        }
        console.log("Successfully extracted translation:", translation);
        console.log("=== RAW TRANSLATION DEBUG START ===");
        console.log("Raw translation text:", translation);
        console.log("=== RAW TRANSLATION DEBUG END ===");
        return translation;
    } catch (error) {
        console.error("Fetch API error:", error);
        throw error;
    }
}

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});
