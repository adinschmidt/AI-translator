import { rm, mkdir, cp } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const ROOT = import.meta.dir;
const DIST = join(ROOT, "dist");

// Files to include in both builds
const COMMON_FILES = [
    "eld-bundle.js",
    "background.js",
    "content.js",
    "purify.min.js",
    "styles.css",
    "options.html",
    "options.js",
    "options.css",
    "tailwindcss.min.js",
];

const IMAGE_FILES = ["images/icon16.png", "images/icon48.png", "images/icon128.png"];

async function clean() {
    if (existsSync(DIST)) {
        await rm(DIST, { recursive: true });
    }
}

async function buildChrome() {
    const chromeDir = join(DIST, "chrome");
    await mkdir(join(chromeDir, "images"), { recursive: true });

    // Copy manifest
    await cp(join(ROOT, "manifest.json"), join(chromeDir, "manifest.json"));

    // Copy common files
    for (const file of COMMON_FILES) {
        await cp(join(ROOT, file), join(chromeDir, file));
    }

    // Copy images
    for (const file of IMAGE_FILES) {
        await cp(join(ROOT, file), join(chromeDir, file));
    }

    console.log("Built Chrome extension -> dist/chrome/");
}

async function buildFirefox() {
    const firefoxDir = join(DIST, "firefox");
    await mkdir(join(firefoxDir, "images"), { recursive: true });

    // Copy Firefox manifest (renamed to manifest.json)
    await cp(join(ROOT, "manifest.firefox.json"), join(firefoxDir, "manifest.json"));

    // Copy common files
    for (const file of COMMON_FILES) {
        await cp(join(ROOT, file), join(firefoxDir, file));
    }

    // Copy images
    for (const file of IMAGE_FILES) {
        await cp(join(ROOT, file), join(firefoxDir, file));
    }

    console.log("Built Firefox extension -> dist/firefox/");
}

async function createZips() {
    const version = (await Bun.file(join(ROOT, "manifest.json")).json()).version;

    // Create Chrome zip
    const chromeProc = Bun.spawn(
        ["zip", "-r", `../translator-${version}-chrome.zip`, "."],
        { cwd: join(DIST, "chrome") },
    );
    await chromeProc.exited;

    // Create Firefox zip
    const firefoxProc = Bun.spawn(
        ["zip", "-r", `../translator-${version}-firefox.zip`, "."],
        { cwd: join(DIST, "firefox") },
    );
    await firefoxProc.exited;

    console.log(`Created dist/translator-${version}-chrome.zip`);
    console.log(`Created dist/translator-${version}-firefox.zip`);
}

async function main() {
    const shouldZip = process.argv.includes("--zip");

    console.log("Cleaning dist/...");
    await clean();

    console.log("Building extensions...");
    await buildChrome();
    await buildFirefox();

    if (shouldZip) {
        console.log("Creating zip files...");
        await createZips();
    }

    console.log("Done!");
}

main().catch(console.error);
