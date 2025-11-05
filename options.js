const apiKeyInput = document.getElementById("api-key");
const apiEndpointInput = document.getElementById("api-endpoint");
const apiTypeSelect = document.getElementById("api-type");
const statusMessage = document.getElementById("status-message");
const fillDefaultEndpointButton = document.getElementById("fill-default-endpoint");
const modelNameInput = document.getElementById("model-name");
const fillDefaultModelButton = document.getElementById("fill-default-model");

const DEFAULT_ENDPOINTS = {
    openai: "https://api.openai.com/v1/chat/completions",
    anthropic: "https://api.anthropic.com/v1/messages",
    google: "https://generativelanguage.googleapis.com/v1beta",
};

const DEFAULT_MODELS = {
    openai: "gpt-5-nano",
    anthropic: "claude-haiku-4-5-20251001",
    google: "gemini-flash-lite-latest",
};

let debounceTimer;

function loadSettings() {
    console.log("options.js: Attempting to load settings...");
    chrome.storage.sync.get(
        ["apiKey", "apiEndpoint", "apiType", "modelName"],
        (result) => {
            if (chrome.runtime.lastError) {
                console.error(
                    "options.js: Error loading settings:",
                    chrome.runtime.lastError,
                );
                displayStatus(
                    `Error loading settings: ${chrome.runtime.lastError.message}`,
                    true,
                );
                return;
            }

            console.log("options.js: Settings loaded from storage:", result);
            if (result.apiKey) {
                apiKeyInput.value = result.apiKey;
            }
            if (result.apiEndpoint) {
                apiEndpointInput.value = result.apiEndpoint;
            }
            if (result.apiType) {
                apiTypeSelect.value = result.apiType;
            } else {
                apiTypeSelect.value = "openai";
            }

            if (result.modelName) {
                modelNameInput.value = result.modelName;
            }
        },
    );
}

function autoSaveSetting() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveSetting, 500);
}

function saveSetting() {
    console.log("options.js: autoSaveSetting function called.");

    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();
    const apiType = apiTypeSelect.value;
    const modelName = modelNameInput.value.trim();

    console.log(
        `options.js: Values to save: apiKey=***, apiEndpoint=${apiEndpoint}, apiType=${apiType}, modelName=${modelName}`,
    );

    // Validate API endpoint if provided
    if (apiEndpoint && apiKey) {
        try {
            new URL(apiEndpoint);
        } catch (_) {
            console.warn("options.js: Invalid API Endpoint URL format.");
            displayStatus("Invalid API Endpoint URL format.", true);
            return;
        }
    }

    console.log("options.js: Attempting to save settings to chrome.storage.sync...");
    chrome.storage.sync.set(
        {
            apiKey: apiKey,
            apiEndpoint: apiEndpoint,
            apiType: apiType,
            modelName: modelName,
        },
        () => {
            if (chrome.runtime.lastError) {
                console.error(
                    "options.js: Error saving settings:",
                    chrome.runtime.lastError,
                );
                displayStatus(`Error saving: ${chrome.runtime.lastError.message}`, true);
            } else {
                console.log("options.js: Settings saved successfully.");
                displayStatus("Settings saved!", false);
            }
        },
    );
}

let statusTimeout;
function displayStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "#dc2626" : "#16a34a";
    statusMessage.classList.remove("opacity-0");

    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
        statusMessage.classList.add("opacity-0");
    }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("options.js: DOMContentLoaded event fired.");
    loadSettings();

    // Add auto-save listeners to all form inputs
    if (apiKeyInput) {
        apiKeyInput.addEventListener("input", autoSaveSetting);
        console.log("options.js: Auto-save listener added to api-key input.");
    }

    if (apiEndpointInput) {
        apiEndpointInput.addEventListener("input", autoSaveSetting);
        console.log("options.js: Auto-save listener added to api-endpoint input.");
    }

    if (apiTypeSelect) {
        apiTypeSelect.addEventListener("change", (event) => {
            autoSaveSetting(event);

            // Update model suggestions based on API type
            const selectedApiType = event.target.value;
            const defaultModel = DEFAULT_MODELS[selectedApiType];
            if (defaultModel && !modelNameInput.value) {
                modelNameInput.value = defaultModel;
                autoSaveSetting();
            }
        });
        console.log("options.js: Change event listener added to api-type select.");
    }

    if (modelNameInput) {
        modelNameInput.addEventListener("input", autoSaveSetting);
        console.log("options.js: Auto-save listener added to model-name input.");
    }

    if (fillDefaultEndpointButton) {
        fillDefaultEndpointButton.addEventListener("click", () => {
            console.log("options.js: Fill Default button clicked.");
            const selectedApiType = apiTypeSelect.value;
            const defaultEndpoint = DEFAULT_ENDPOINTS[selectedApiType];

            if (defaultEndpoint) {
                apiEndpointInput.value = defaultEndpoint;
                console.log(
                    `options.js: Filled endpoint with default for ${selectedApiType}: ${defaultEndpoint}`,
                );
                autoSaveSetting();
            } else {
                console.warn(
                    `options.js: No default endpoint found for API type: ${selectedApiType}`,
                );
                displayStatus(
                    `No default endpoint available for ${selectedApiType}.`,
                    true,
                );
            }
        });
        console.log("options.js: Click event listener added to fill default button.");
    } else {
        console.error("options.js: Could not find fill default endpoint button element!");
    }

    if (fillDefaultModelButton) {
        fillDefaultModelButton.addEventListener("click", () => {
            console.log("options.js: Fill Default Model button clicked.");
            const selectedApiType = apiTypeSelect.value;
            const defaultModel = DEFAULT_MODELS[selectedApiType];

            if (defaultModel) {
                modelNameInput.value = defaultModel;
                console.log(
                    `options.js: Filled model name with default for ${selectedApiType}: ${defaultModel}`,
                );
                autoSaveSetting();
            } else {
                console.warn(
                    `options.js: No default model found for API type: ${selectedApiType}`,
                );
                displayStatus(
                    `No default model available for ${selectedApiType}.`,
                    true,
                );
            }
        });
        console.log("options.js: Click event listener added to fill default model button.");
    } else {
        console.error("options.js: Could not find fill default model button element!");
    }
});

console.log("options.js: Script loaded.");
