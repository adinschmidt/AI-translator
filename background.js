// background.js - Handles context menu, API calls, full page, and auto-translate trigger

// Default settings
const DEFAULT_SETTINGS = {
    apiEndpoint: '',
    apiKey: '',
    apiType: 'openai',
    // autoTranslateEnabled: false // Not needed here, read directly when needed
  };
  
  // --- Context Menu Setup ---
  chrome.runtime.onInstalled.addListener(() => {
    // Context menu for selected text
    chrome.contextMenus.create({
      id: "translateSelectedText",
      title: "Translate '%s'",
      contexts: ["selection"]
    });
  
    // Context menu for the whole page
    chrome.contextMenus.create({
      id: "translateFullPage",
      title: "Translate Entire Page",
      contexts: ["page"]
    });
  
    console.log("AI Translator context menus created.");
  });
  
  // --- Message Listener (for Auto-Translate Trigger) ---
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "triggerAutoTranslate") {
          console.log("Received triggerAutoTranslate request from tab:", sender.tab?.id);
          if (sender.tab?.id) {
              // 1. Ask content script to extract page text (same as manual trigger)
              chrome.tabs.sendMessage(sender.tab.id, { action: "getPageText" }, (response) => {
                   if (chrome.runtime.lastError) {
                      console.error("Error sending getPageText for auto-translate:", chrome.runtime.lastError.message);
                      return;
                   }
                   if (response && response.text) {
                      console.log("Received page text for auto-translate (length):", response.text.length);
                      // 2. Get settings and trigger translation
                      getSettingsAndTranslate(response.text, sender.tab.id, true); // true = full page
                   } else {
                      console.error("Did not receive text from content script for auto-translate.");
                   }
              });
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
    if (!tab || !tab.id) {
        console.error("Cannot get tab ID.");
        return;
    }
    const tabId = tab.id;
  
    // Handle Selected Text Translation
    if (info.menuItemId === "translateSelectedText" && info.selectionText) {
      const selectedText = info.selectionText;
      console.log("Action: Translate Selected Text - ", selectedText);
      getSettingsAndTranslate(selectedText, tabId, false); // false = not full page
    }
    // Handle Full Page Translation (Manual Trigger)
    else if (info.menuItemId === "translateFullPage") {
      console.log("Action: Translate Full Page requested manually for tab:", tabId);
      // Show indicator immediately for manual trigger
      chrome.tabs.sendMessage(tabId, { action: "showLoadingIndicator", isFullPage: true });
      // 1. Ask content script to extract page text
      chrome.tabs.sendMessage(tabId, { action: "getPageText" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending getPageText message:", chrome.runtime.lastError.message);
          notifyContentScript(tabId, `Error: Could not communicate with page content. Try reloading. (${chrome.runtime.lastError.message})`, true, true);
          return;
        }
        if (response && response.text) {
          console.log("Received page text (length):", response.text.length);
          // 2. Get settings and trigger translation
          getSettingsAndTranslate(response.text, tabId, true); // true = full page
        } else {
          console.error("Did not receive text from content script.");
          notifyContentScript(tabId, "Error: Could not extract text content from the page.", true, true);
        }
      });
    }
  });
  
  // --- Helper Function to Get Settings and Call API ---
  function getSettingsAndTranslate(textToTranslate, tabId, isFullPage) {
    chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'apiType'], (settings) => {
      const {
        apiKey = DEFAULT_SETTINGS.apiKey,
        apiEndpoint = DEFAULT_SETTINGS.apiEndpoint,
        apiType = DEFAULT_SETTINGS.apiType
      } = settings;
  
      if (!apiKey || !apiEndpoint) {
        const errorMsg = "Translation Error: API Key or Endpoint not set. Please configure in extension settings.";
        console.error(errorMsg);
        notifyContentScript(tabId, errorMsg, isFullPage, true); // Notify content script (isError=true)
        return;
      }
  
      // Loading indicator might already be shown by content script (auto) or context menu handler (manual)
      // chrome.tabs.sendMessage(tabId, { action: "showLoadingIndicator", isFullPage: isFullPage });
  
      // Call the API
      translateTextApiCall(textToTranslate, apiKey, apiEndpoint, apiType, isFullPage)
        .then(translation => {
          console.log("Translation received (length):", translation.length);
          notifyContentScript(tabId, translation, isFullPage, false); // Send translation (isError=false)
        })
        .catch(error => {
          console.error("Translation error:", error);
          notifyContentScript(tabId, `Translation Error: ${error.message}`, isFullPage, true); // Send error (isError=true)
        });
    });
  }
  
  // --- Notify Content Script ---
  function notifyContentScript(tabId, text, isFullPage, isError = false) {
     const message = {
         text: text,
         isError: isError
     };
     if (isFullPage) {
         message.action = "replacePageContent";
     } else {
         message.action = "displayTranslation"; // For popup
     }
  
     chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
              // Don't log error if it's just because the tab was closed during translation
              if (!chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
                   console.warn(`Could not send message to tab ${tabId} for action ${message.action}: ${chrome.runtime.lastError.message}.`);
              }
          } else if (response?.status === 'received') {
               console.log(`Content script in tab ${tabId} acknowledged ${message.action}.`);
          } else {
               // This might happen if content script is busy or didn't send response back correctly
               // console.log(`Content script in tab ${tabId} received ${message.action} but did not send expected response.`);
          }
     });
  }
  
  
  // --- API Call Function (Unchanged from previous version) ---
  async function translateTextApiCall(textToTranslate, apiKey, apiEndpoint, apiType, isFullPage) {
    console.log(`Sending text to API (${apiType}) at ${apiEndpoint}. FullPage: ${isFullPage}. Text length: ${textToTranslate.length}`);
  
    let requestBody;
    let headers = { 'Content-Type': 'application/json' };
    const prompt = `Translate the following text to English: ${textToTranslate}`;
    const systemPrompt = "You are a helpful translator. Translate the provided text accurately to English.";
  
    switch (apiType) {
      case 'openai':
        headers['Authorization'] = `Bearer ${apiKey}`;
        requestBody = {
          model: "gpt-3.5-turbo",
          messages: [ { "role": "system", "content": systemPrompt }, { "role": "user", "content": prompt } ],
          max_tokens: isFullPage ? 3000 : 500
        };
        break;
      case 'anthropic':
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        requestBody = {
          model: "claude-3-haiku-20240307",
          max_tokens: isFullPage ? 3000 : 500,
          system: systemPrompt,
          messages: [ { "role": "user", "content": prompt } ]
        };
        break;
      default: throw new Error(`Unsupported API type configured: ${apiType}`);
    }
  
    try {
      const response = await fetch(apiEndpoint, { method: 'POST', headers: headers, body: JSON.stringify(requestBody) });
      if (!response.ok) {
        let errorDetails = `API request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            errorDetails += `: ${errorData?.error?.message || errorData?.detail || JSON.stringify(errorData)}`;
        } catch (e) { errorDetails += `: ${response.statusText}`; }
        throw new Error(errorDetails);
      }
      const data = await response.json();
      console.log("API Response Data Received.");
  
      let translation;
      switch (apiType) {
          case 'openai': translation = data.choices?.[0]?.message?.content?.trim(); break;
          case 'anthropic':
               if (data.content && Array.isArray(data.content) && data.content.length > 0) {
                  translation = data.content.map(block => block.text).join("\n").trim();
              } break;
          default: throw new Error("Could not determine how to extract translation for this API type.");
      }
  
      if (translation === undefined || translation === null) {
          throw new Error("Could not extract translation from API response.");
      }
      return translation;
    } catch (error) {
      console.error('Fetch API error:', error);
      throw error;
    }
  }
  