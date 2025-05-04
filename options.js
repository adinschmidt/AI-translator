// options.js - Logic for the settings page (with debugging)

// --- DOM Elements ---
const form = document.getElementById("settings-form");
const apiKeyInput = document.getElementById("api-key");
const apiEndpointInput = document.getElementById("api-endpoint");
const apiTypeSelect = document.getElementById("api-type");
const autoTranslateToggle = document.getElementById("auto-translate");
const statusMessage = document.getElementById("status-message");
const fillDefaultEndpointButton = document.getElementById("fill-default-endpoint");

// Define default endpoints
const DEFAULT_ENDPOINTS = {
    openai: "https://api.openai.com/v1/chat/completions",
    anthropic: "https://api.anthropic.com/v1/messages",
    google: "https://generativelanguage.googleapis.com/v1beta", // Placeholder
};

// --- Load saved settings ---
function loadSettings() {
    console.log("options.js: Attempting to load settings...");
    // Use chrome.storage.sync to get settings synchronized across devices
    chrome.storage.sync.get(
        ["apiKey", "apiEndpoint", "apiType", "autoTranslateEnabled"],
        (result) => {
            // Check for errors during load
            if (chrome.runtime.lastError) {
                console.error(
                    "options.js: Error loading settings:",
                    chrome.runtime.lastError,
                );
                displayStatus(
                    `Error loading settings: ${chrome.runtime.lastError.message}`,
                    true,
                );
                return; // Stop execution if loading failed
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
                apiTypeSelect.value = "openai"; // Default
            }
            // Set the toggle state based on the loaded value
            const loadedToggleState = !!result.autoTranslateEnabled; // Use !! to ensure boolean
            autoTranslateToggle.checked = loadedToggleState;
            console.log(
                `options.js: Set autoTranslateToggle.checked to: ${loadedToggleState}`,
            );

            // CSS :checked pseudo-class handles the visual update
        },
    );
}

// --- Save settings ---
function saveSettings(event) {
    event.preventDefault(); // Prevent default form submission
    console.log("options.js: saveSettings function called.");

    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();
    const apiType = apiTypeSelect.value;
    const autoTranslateEnabled = autoTranslateToggle.checked; // Get the current toggle state

    console.log(
        `options.js: Values to save: apiKey=***, apiEndpoint=${apiEndpoint}, apiType=${apiType}, autoTranslateEnabled=${autoTranslateEnabled}`,
    );

    if (!apiKey || !apiEndpoint) {
        console.warn("options.js: API Key or Endpoint missing.");
        displayStatus("API Key and Endpoint URL are required.", true);
        return;
    }
    try {
        new URL(apiEndpoint);
    } catch (_) {
        console.warn("options.js: Invalid API Endpoint URL format.");
        displayStatus("Invalid API Endpoint URL format.", true);
        return;
    }

    console.log("options.js: Attempting to save settings to chrome.storage.sync...");
    // Save using chrome.storage.sync
    chrome.storage.sync.set(
        {
            apiKey: apiKey,
            apiEndpoint: apiEndpoint,
            apiType: apiType,
            autoTranslateEnabled: autoTranslateEnabled, // Save the toggle state
        },
        () => {
            // Check for errors during save
            if (chrome.runtime.lastError) {
                console.error(
                    "options.js: Error saving settings:",
                    chrome.runtime.lastError,
                );
                displayStatus(`Error saving: ${chrome.runtime.lastError.message}`, true);
            } else {
                console.log("options.js: Settings saved successfully.");
                displayStatus("Settings Saved!", false);
            }
        },
    );
}

// --- Display status message ---
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

// --- Event Listeners ---
// Load settings when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("options.js: DOMContentLoaded event fired.");
    loadSettings();

    // Add listener to the form submission
    if (form) {
        form.addEventListener("submit", saveSettings);
        console.log("options.js: Submit event listener added to form.");
    } else {
        console.error("options.js: Could not find settings form element!");
    }

    // Add listener to the fill default endpoint button
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

    // Optional: Add listener specifically to the toggle to see if its state changes
    if (autoTranslateToggle) {
        autoTranslateToggle.addEventListener("change", (event) => {
            console.log(
                `options.js: autoTranslateToggle 'change' event fired. New checked state: ${event.target.checked}`,
            );
        });
        console.log("options.js: Change event listener added to toggle.");
    } else {
        console.error("options.js: Could not find auto-translate toggle element!");
    }
});

console.log("options.js: Script loaded."); // Log script load
