const PROVIDERS = ["openai", "anthropic", "google", "grok", "openrouter"];

// Per-provider defaults (for when no stored settings exist)
const PROVIDER_DEFAULTS = {
    openai: {
        apiEndpoint: "https://api.openai.com/v1/chat/completions",
        modelName: "gpt-4o-mini",
    },
    anthropic: {
        apiEndpoint: "https://api.anthropic.com/v1/messages",
        modelName: "claude-3-haiku-20240307",
    },
    google: {
        apiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
        modelName: "gemini-2.0-flash",
    },
    grok: {
        apiEndpoint: "https://api.x.ai/v1/chat/completions",
        modelName: "grok-2-mini",
    },
    openrouter: {
        apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
        modelName: "openrouter/auto",
    },
};

function resolveProviderDefaults(provider) {
    const defaults = PROVIDER_DEFAULTS[provider] || {};
    return {
        apiKey: "",
        apiEndpoint: defaults.apiEndpoint || "",
        modelName: defaults.modelName || "",
        apiType: provider,
    };
}

// DEFAULT_SETTINGS kept for internal fallback usage (e.g. non-migrated installs)
const DEFAULT_SETTINGS = resolveProviderDefaults("openai");

// --- Context Menu Setup ---
chrome.runtime.onInstalled.addListener(() => {
    // Context menu for selected text
    chrome.contextMenus.create({
        id: "translateSelectedText",
        title: "Translate to English",
        contexts: ["selection"],
    });

    // Context menu for the whole page (always visible, even if text is selected)
    chrome.contextMenus.create({
        id: "translateFullPage",
        title: "Translate Entire Page",
        contexts: ["page", "selection"],
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
                // Selected text translation error -> not full page, show error popup
                notifyContentScript(tabId, "Could not extract selected content", false, true, false);
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
                // Selected text translation error -> not full page, show error popup
                notifyContentScript(tabId, "Could not extract selected HTML", false, true, false);
            }
        });
    }
    // Handle Full Page Translation (Manual Trigger) - New HTML-based approach
    else if (info.menuItemId === "translateFullPage") {
        console.log("Action: Translate Full Page requested manually for tab:", tabId);

        // 1) Ask content script for main content HTML snapshot
        chrome.tabs.sendMessage(tabId, { action: "getPageText" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(
                    "Error getting page HTML for full page translation:",
                    chrome.runtime.lastError.message
                );
                notifyContentScript(
                    tabId,
                    "Translation failed to start: could not read page content.",
                    true, // isFullPage
                    true, // isError
                    false // isLoading
                );
                return;
            }

            if (!response || !response.text) {
                console.error("No page HTML received from content script for full page translation.");
                notifyContentScript(
                    tabId,
                    "Translation failed to start: empty page content.",
                    true, // isFullPage
                    true, // isError
                    false // isLoading
                );
                return;
            }

            const pageHtml = response.text;
            console.log("Received page HTML for full page translation, length:", pageHtml.length);

            // 2) Show loading indicator on page (with initial progress)
            chrome.tabs.sendMessage(
                tabId,
                {
                    action: "showLoadingIndicator",
                    isFullPage: true,
                    text: "Translating page... 0% (starting)"
                },
                (indicatorResponse) => {
                    if (chrome.runtime.lastError) {
                        console.warn(
                            "Could not show loading indicator:",
                            chrome.runtime.lastError.message
                        );
                    } else {
                        console.log("Loading indicator shown:", indicatorResponse);
                    }
                }
            );

            // 3) Call API with isFullPage = true using the HTML snapshot
            chrome.storage.sync.get(
                ["apiKey", "apiEndpoint", "apiType", "modelName", "providerSettings"],
                (settings) => {
                    const {
                        apiKey,
                        apiEndpoint,
                        apiType,
                        modelName,
                        providerSettings = {},
                    } = settings;

                    const activeProvider = (apiType && PROVIDERS.includes(apiType)) ? apiType : "openai";
                    const perProvider = providerSettings[activeProvider];

                    const effective = perProvider
                        ? {
                            apiKey: perProvider.apiKey || "",
                            apiEndpoint: perProvider.apiEndpoint || (PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint || ""),
                            modelName: perProvider.modelName || (PROVIDER_DEFAULTS[activeProvider]?.modelName || ""),
                            apiType: activeProvider,
                        }
                        : {
                            apiKey: apiKey || "",
                            apiEndpoint: apiEndpoint || (PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint || ""),
                            modelName: modelName || (PROVIDER_DEFAULTS[activeProvider]?.modelName || ""),
                            apiType: activeProvider,
                        };

                    const {
                        apiKey: finalKey,
                        apiEndpoint: finalEndpoint,
                        apiType: finalType,
                        modelName: finalModel,
                    } = effective;

                    if (!finalKey || !finalEndpoint) {
                        const errorMsg =
                            "Translation Error: API Key or Endpoint not set. Please configure in extension settings.";
                        console.error(errorMsg);
                        notifyContentScript(
                            tabId,
                            errorMsg,
                            true,  // isFullPage
                            true,  // isError
                            false  // isLoading
                        );
                        return;
                    }

                    // Optional: send a mid-translation progress hint (best-effort UX)
                    try {
                        const approxTokens = Math.round(pageHtml.length / 4);
                        chrome.tabs.sendMessage(tabId, {
                            action: "showLoadingIndicator",
                            isFullPage: true,
                            text: `Translating page... input size ~${approxTokens} tokens`
                        }, () => { /* ignore errors */ });
                    } catch (e) {
                        console.warn("Could not send progress hint:", e);
                    }

                    translateTextApiCall(
                        pageHtml,
                        finalKey,
                        finalEndpoint,
                        finalType,
                        true,       // isFullPage
                        finalModel
                    )
                        .then((translatedHtml) => {
                            console.log(
                                "Full page translation received, length:",
                                translatedHtml.length
                            );

                            // 4) Send translated HTML back for in-place replacement
                            chrome.tabs.sendMessage(tabId, {
                                action: "applyFullPageTranslation",
                                html: translatedHtml
                            }, (applyResponse) => {
                                if (chrome.runtime.lastError) {
                                    console.error(
                                        "Error applying full page translation:",
                                        chrome.runtime.lastError.message
                                    );
                                    notifyContentScript(
                                        tabId,
                                        "Failed to apply translated content.",
                                        true,  // isFullPage
                                        true,  // isError
                                        false  // isLoading
                                    );
                                    return;
                                }
                                console.log("Full page translation applied:", applyResponse);
                            });
                        })
                        .catch((error) => {
                            console.error("Full page translation error:", error);
                            notifyContentScript(
                                tabId,
                                `Translation Error: ${error.message}`,
                                true,  // isFullPage
                                true,  // isError
                                false  // isLoading
                            );
                        });
                }
            );
        });
    }
});

// --- Helper Function to Translate Individual Element Text ---
async function translateElementText(textToTranslate, elementPath, tabId) {
    console.log(`Translating element text (length: ${textToTranslate.length}) for path: ${elementPath}`);

    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(
            ["apiKey", "apiEndpoint", "apiType", "modelName", "providerSettings"],
            (settings) => {
                const {
                    apiKey,
                    apiEndpoint,
                    apiType,
                    modelName,
                    providerSettings = {},
                } = settings;

                const activeProvider = (apiType && PROVIDERS.includes(apiType)) ? apiType : "openai";
                const perProvider = providerSettings[activeProvider];

                const effective = perProvider
                    ? {
                        apiKey: perProvider.apiKey || "",
                        apiEndpoint: perProvider.apiEndpoint || (PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint || ""),
                        modelName: perProvider.modelName || (PROVIDER_DEFAULTS[activeProvider]?.modelName || ""),
                        apiType: activeProvider,
                    }
                    : {
                        apiKey: apiKey || "",
                        apiEndpoint: apiEndpoint || (PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint || ""),
                        modelName: modelName || (PROVIDER_DEFAULTS[activeProvider]?.modelName || ""),
                        apiType: activeProvider,
                    };

                const {
                    apiKey: finalKey,
                    apiEndpoint: finalEndpoint,
                    apiType: finalType,
                    modelName: finalModel,
                } = effective;

                if (!finalKey || !finalEndpoint) {
                    reject(new Error("API Key or Endpoint not set. Please configure in extension settings."));
                    return;
                }

                // Call the API for element translation
                translateTextApiCall(textToTranslate, finalKey, finalEndpoint, finalType, false, finalModel) // false = not full page
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
    chrome.storage.sync.get(
        ["apiKey", "apiEndpoint", "apiType", "modelName", "providerSettings"],
        (settings) => {
            console.log("Settings retrieved from storage:", settings);
            const {
                apiKey,
                apiEndpoint,
                apiType,
                modelName,
                providerSettings = {},
            } = settings;

            const activeProvider = (apiType && PROVIDERS.includes(apiType)) ? apiType : "openai";
            const perProvider = providerSettings[activeProvider];

            const effective = perProvider
                ? {
                    apiKey: perProvider.apiKey || "",
                    apiEndpoint: perProvider.apiEndpoint || (PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint || ""),
                    modelName: perProvider.modelName || (PROVIDER_DEFAULTS[activeProvider]?.modelName || ""),
                    apiType: activeProvider,
                }
                : {
                    apiKey: apiKey || "",
                    apiEndpoint: apiEndpoint || (PROVIDER_DEFAULTS[activeProvider]?.apiEndpoint || ""),
                    modelName: modelName || (PROVIDER_DEFAULTS[activeProvider]?.modelName || ""),
                    apiType: activeProvider,
                };

            const {
                apiKey: finalKey,
                apiEndpoint: finalEndpoint,
                apiType: finalType,
                modelName: finalModel,
            } = effective;

            if (!finalKey || !finalEndpoint) {
                const errorMsg =
                    "Translation Error: API Key or Endpoint not set. Please configure in extension settings.";
                console.error(errorMsg);
                // Send error back to content script to update the popup/indicator
                notifyContentScript(tabId, errorMsg, isFullPage, true, false); // isError=true, isLoading=false
                return;
            }

            console.log("Attempting to call translateTextApiCall with resolved provider settings.");

            // Call the API - the promise resolution/rejection will handle sending the final result
            translateTextApiCall(textToTranslate, finalKey, finalEndpoint, finalType, isFullPage, finalModel)
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

    // Normalize provider name
    const provider = (apiType && PROVIDERS.includes(apiType)) ? apiType : "openai";

    // Use modelName from parameter, fallback to provider defaults
    const selectedModelName =
        modelName ||
        PROVIDER_DEFAULTS[provider]?.modelName ||
        DEFAULT_SETTINGS.modelName;

    switch (provider) {
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
        case "google": {
            headers["x-goog-api-key"] = apiKey;
            const base = apiEndpoint || PROVIDER_DEFAULTS.google.apiEndpoint;
            const googleApiUrl = `${base.replace(/\/+$/, "")}/models/${selectedModelName || "gemini-2.0-flash"}:generateContent`;
            requestBody = {
                contents: [
                    {
                        parts: [
                            { text: systemPrompt },
                            { text: prompt },
                        ],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: isFullPage ? 65536 : 8000,
                },
            };
            console.log("Google API Request Body:", JSON.stringify(requestBody));
            apiEndpoint = googleApiUrl;
            break;
        }
        case "grok": {
            // Grok (xAI) - OpenAI-compatible style
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.grok.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                max_tokens: isFullPage ? 3000 : 500,
            };
            break;
        }
        case "openrouter": {
            headers["Authorization"] = `Bearer ${apiKey}`;
            headers["HTTP-Referer"] = "https://github.com/"; // safe generic referer
            headers["X-Title"] = "AI Translator Extension";
            requestBody = {
                model: selectedModelName || PROVIDER_DEFAULTS.openrouter.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                max_tokens: isFullPage ? 3000 : 500,
            };
            break;
        }
        default:
            throw new Error(`Unsupported API type configured: ${provider}`);
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
        switch (provider) {
            case "openai":
            case "grok":
            case "openrouter":
                translation = data.choices?.[0]?.message?.content?.trim();
                break;
            case "anthropic":
                if (Array.isArray(data.content) && data.content.length > 0) {
                    translation = data.content
                        .map((block) => block.text || "")
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
                    "Could not determine how to extract translation for this provider."
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
