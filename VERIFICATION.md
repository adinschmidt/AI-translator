# Manual Smoke Verification Checklist

**Bead:** bd-azg - Verification: manual smoke checklist (Chrome + Firefox)
**Date:** 2026-01-25
**Build:** `bun run build.ts`

---

## Build Verification

### Files Present in Build Output

Both Chrome and Firefox builds contain all required files:

- ✓ manifest.json / manifest.firefox.json
- ✓ background.js (service worker)
- ✓ content.js (content script)
- ✓ options.html / options.js / options.css
- ✓ styles.css (injected styles)
- ✓ purify.min.js (HTML sanitization)
- ✓ eld-bundle.js (external library)
- ✓ tailwindcss.min.js (CSS framework)
- ✓ images/ (icon assets)

### Manifest Permissions

Both manifests declare required permissions:
- ✓ `contextMenus` - for translation context menu items
- ✓ `scripting` - for injection capabilities
- ✓ `storage` - for settings persistence
- ✓ Host permissions for `https://*/*` and `http://*/*`

### Content Security Policy

- ✓ Chrome: Restrictive CSP for extension pages
- ✓ Firefox: Restrictive CSP for extension pages
- ✓ Sandbox configured for script execution

---

## Code Verification

### Context Menu Items (background.js)

Verified that both context menu items are registered:

- ✓ "Translate Selected Text" - for translating user-selected text
- ✓ "Translate Entire Page" - for full-page translation

### Storage Persistence

- ✓ `chrome.storage.sync` is used in `options.js` (lines 131, 142)
- ✓ `chrome.storage.sync` is used in `content.js` (line 35)
- ✓ Settings saved in providerSettings structure

### HTML Sanitization

- ✓ `DOMPurify` is used in `content.js` for sanitizing translated HTML (lines 418, 424, 1242, 1409)
- ✓ `purify.min.js` is loaded before `content.js` in manifest

---

## Manual Test Checklist

To complete this verification, load the extension and test the following:

### Prerequisites
1. Load the extension:
   - Chrome: `chrome://extensions/` → Developer mode → "Load unpacked" → select `dist/chrome/`
   - Firefox: `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on…" → select `dist/firefox/manifest.json`
2. Configure an AI provider in the options page with valid API credentials

### Test 1: Translate Selected Text
**Context menu → "Translate Selected Text"**
- [ ] Select text on any web page
- [ ] Right-click and choose "Translate Selected Text"
- [ ] **Expected:** Popup appears showing the translation result
- [ ] **Expected:** Translation is displayed in a user-friendly popup

### Test 2: Translate Entire Page
**Context menu → "Translate Entire Page"**
- [ ] Navigate to a web page (e.g., Wikipedia article)
- [ ] Right-click and choose "Translate Entire Page"
- [ ] **Expected:** Loading indicator appears
- [ ] **Expected:** Page content is replaced with translated text
- [ ] **Expected:** Page structure is preserved

### Test 3: Options Page Persists Provider Settings
**Settings persistence via chrome.storage.sync**
- [ ] Open extension options page
- [ ] Configure provider (API key, endpoint, model name, instructions)
- [ ] Save settings
- [ ] Close and reopen options page (or reload extension)
- [ ] **Expected:** All settings are restored correctly

### Test 4: Full-Page Translation Preserves Links
**Link-heavy page (e.g., Wikipedia)**
- [ ] Navigate to a link-heavy page (Wikipedia recommended)
- [ ] Use "Translate Entire Page"
- [ ] **Expected:** All anchor tags (`<a>`) are preserved
- [ ] **Expected:** All `href` attributes are intact
- [ ] **Expected:** Links remain clickable and functional

### Test 5: Formatting Is Preserved
**Formatting-heavy page (tables, lists, code blocks)**
- [ ] Navigate to a page with rich formatting (e.g., documentation site)
- [ ] Use "Translate Entire Page"
- [ ] **Expected:** Tables maintain their structure
- [ ] **Expected:** Lists (ordered/unordered) are preserved
- [ ] **Expected:** Code blocks keep inline styling
- [ ] **Expected:** Page layout remains intact

### Test 6: No Placeholder Artifacts
**Regression test for HTML corruption**
- [ ] Translate multiple pages
- [ ] **Expected:** No placeholder text (e.g., `__placeholder__`) visible
- [ ] **Expected:** No missing HTML elements
- [ ] **Expected:** No broken page structure

---

## Automated Verification Summary

The following components have been automatically verified:

### Build Process
- ✓ Both Chrome and Firefox builds complete successfully
- ✓ All required files are present in build output

### Code Structure
- ✓ Context menu items are registered in background.js
- ✓ chrome.storage.sync is used for settings persistence
- ✓ DOMPurify is integrated for HTML sanitization

### Manifest Configuration
- ✓ Required permissions are declared
- ✓ Content scripts are properly configured
- ✓ CSP is appropriately restrictive

---

## Status

**Automated Verification:** COMPLETE ✓

**Manual Verification:** Requires manual testing in browser

To complete this bead:
1. Load the extension in Chrome and Firefox
2. Perform all 6 manual test checks above
3. Report any failures
